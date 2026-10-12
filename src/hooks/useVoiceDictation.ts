/**
 * Dictado de consulta por nota de voz (veterinario).
 *
 * Flujo: `submit(audio)` crea la sesión (`client_request_id` idempotente) y
 * sube el audio; el servidor responde 202 y lo procesa en segundo plano
 * (recibido → transcribiendo → interpretando → aplicado). El progreso llega por
 * ActionCable; si el WebSocket no está conectado se consulta cada 3 s (y cada
 * 10 s como red de seguridad con el WebSocket activo).
 *
 * Política "Borrador revisable" del servidor: la consulta se aplica sola y lo
 * clínicamente sensible (recetas, vacunas, citas…) queda propuesto; el vet lo
 * confirma o rechaza aquí. `onApplied` avisa cuando cambió la consulta para
 * que la pantalla refresque sus datos.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  confirmToolCall,
  createVoiceDictation,
  getVoiceDictation,
  isAiDisabledError,
  isFinalDictationStatus,
  rejectToolCall,
  reviewVoiceDictation,
  uploadVoiceDictationAudio,
} from '@/services/assistant';
import type { AiUpdatesStatus } from '@/services/aiUpdates';
import { ApiError, toApiError } from '@/types/api';
import type {
  AiToolCall,
  AudioSource,
  VoiceDictation,
  VoiceDictationStatus,
} from '@/types/assistant';
import { newRequestId } from '@/utils/localId';
import { useAiUpdates } from './useAiUpdates';

export type DictationPhase = 'idle' | 'sending' | 'processing' | 'done' | 'error';

export interface UseVoiceDictationOptions {
  petId?: number;
  consultationId?: number;
  appointmentId?: number;
  /** El servidor aplicó cambios (consulta creada/actualizada o propuesta confirmada). */
  onApplied?: (dictation: VoiceDictation) => void;
}

export interface VoiceDictationState {
  phase: DictationPhase;
  dictation: VoiceDictation | null;
  error: ApiError | null;
  /** El servidor tiene "Sin inteligencia artificial". */
  aiDisabled: boolean;
  liveStatus: AiUpdatesStatus;
  /** Propuesta que se está confirmando/rechazando. */
  busyToolCallId: number | null;
  submit: (audio: AudioSource) => Promise<void>;
  confirm: (toolCallId: number) => Promise<void>;
  reject: (toolCallId: number) => Promise<void>;
  /** Confirma las indicadas, rechaza el resto y cierra el dictado. */
  review: (confirmIds: number[]) => Promise<void>;
  reset: () => void;
}

const STATUS_RANK: Record<VoiceDictationStatus, number> = {
  awaiting_audio: 0,
  received: 1,
  transcribing: 2,
  interpreting: 3,
  ready: 4,
  failed: 4,
  reviewed: 5,
};

const POLL_MS = 3_000;
const SAFETY_POLL_MS = 10_000;

function withToolCall(dictation: VoiceDictation, call: AiToolCall): VoiceDictation {
  const toolCalls = dictation.tool_calls.map((t) => (t.id === call.id ? call : t));
  return {
    ...dictation,
    tool_calls: toolCalls,
    pending_count: toolCalls.filter((t) => t.status === 'proposed').length,
  };
}

export function useVoiceDictation(
  options: UseVoiceDictationOptions,
): VoiceDictationState {
  const [phase, setPhase] = useState<DictationPhase>('idle');
  const [dictation, setDictation] = useState<VoiceDictation | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [busyToolCallId, setBusyToolCallId] = useState<number | null>(null);

  const currentId = useRef<number | null>(null);
  const current = useRef<VoiceDictation | null>(null);
  const pending = useRef<{ requestId: string; dictationId: number | null } | null>(null);
  const appliedStatus = useRef<string | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  });

  const accept = useCallback((next: VoiceDictation) => {
    if (currentId.current !== next.id) return;
    const prev = current.current;
    // Las respuestas del polling y del WebSocket pueden cruzarse: nunca retroceder.
    if (prev && STATUS_RANK[next.status] < STATUS_RANK[prev.status]) return;
    current.current = next;
    setDictation(next);
    if (isFinalDictationStatus(next.status)) setPhase('done');
    const applied = next.status === 'ready' || next.status === 'reviewed';
    if (applied && appliedStatus.current !== next.status) {
      appliedStatus.current = next.status;
      optionsRef.current.onApplied?.(next);
    }
  }, []);

  const liveStatus = useAiUpdates((update) => {
    if (update.type === 'voice_dictation') accept(update.voice_dictation);
  });

  // Polling de respaldo mientras el servidor procesa.
  const processingId = phase === 'processing' ? dictation?.id : undefined;
  useEffect(() => {
    if (processingId === undefined) return undefined;
    const every = liveStatus === 'connected' ? SAFETY_POLL_MS : POLL_MS;
    const timer = setInterval(() => {
      getVoiceDictation(processingId).then(accept, () => {});
    }, every);
    return () => clearInterval(timer);
  }, [processingId, liveStatus, accept]);

  // Al (re)conectar el WebSocket se recupera lo que pudo perderse sin conexión.
  useEffect(() => {
    if (liveStatus !== 'connected' || processingId === undefined) return;
    getVoiceDictation(processingId).then(accept, () => {});
  }, [liveStatus, processingId, accept]);

  const submit = useCallback(
    async (audio: AudioSource) => {
      setPhase('sending');
      setError(null);
      const attempt = (pending.current ??= {
        requestId: newRequestId(),
        dictationId: null,
      });
      try {
        if (attempt.dictationId === null) {
          const { petId, consultationId, appointmentId } = optionsRef.current;
          const created = await createVoiceDictation({
            pet_id: petId,
            consultation_id: consultationId,
            appointment_id: appointmentId,
            client_request_id: attempt.requestId,
          });
          attempt.dictationId = created.id;
          currentId.current = created.id;
          current.current = created;
          appliedStatus.current = null;
          setDictation(created);
        }
        const received = await uploadVoiceDictationAudio(attempt.dictationId, audio);
        pending.current = null;
        setPhase('processing');
        accept(received);
      } catch (e) {
        // Si el audio llegó pero se perdió la respuesta, el dictado ya avanza.
        if (attempt.dictationId !== null) {
          const recovered = await getVoiceDictation(attempt.dictationId).catch(
            () => null,
          );
          if (recovered && recovered.status !== 'awaiting_audio') {
            pending.current = null;
            setPhase('processing');
            accept(recovered);
            return;
          }
        }
        setError(toApiError(e));
        setPhase('error');
      }
    },
    [accept],
  );

  const decide = useCallback(
    async (toolCallId: number, action: (id: number) => Promise<AiToolCall>) => {
      const base = current.current;
      if (!base) return;
      setBusyToolCallId(toolCallId);
      setError(null);
      try {
        const call = await action(toolCallId);
        const next = withToolCall(current.current ?? base, call);
        current.current = next;
        setDictation(next);
        if (call.status === 'executed') optionsRef.current.onApplied?.(next);
      } catch (e) {
        setError(toApiError(e));
      } finally {
        setBusyToolCallId(null);
      }
    },
    [],
  );

  const confirm = useCallback((id: number) => decide(id, confirmToolCall), [decide]);
  const reject = useCallback((id: number) => decide(id, rejectToolCall), [decide]);

  const review = useCallback(
    async (confirmIds: number[]) => {
      const base = current.current;
      if (!base) return;
      setError(null);
      try {
        const result = await reviewVoiceDictation(base.id, confirmIds);
        accept(result.voice_dictation);
        if (result.failures.length > 0) {
          setError(
            new ApiError({
              message: `No se pudieron aplicar: ${result.failures.join('; ')}`,
              status: 422,
              kind: 'validation',
            }),
          );
        }
      } catch (e) {
        setError(toApiError(e));
      }
    },
    [accept],
  );

  const reset = useCallback(() => {
    currentId.current = null;
    current.current = null;
    pending.current = null;
    appliedStatus.current = null;
    setDictation(null);
    setError(null);
    setBusyToolCallId(null);
    setPhase('idle');
  }, []);

  return {
    phase,
    dictation,
    error,
    aiDisabled: isAiDisabledError(error),
    liveStatus,
    busyToolCallId,
    submit,
    confirm,
    reject,
    review,
    reset,
  };
}
