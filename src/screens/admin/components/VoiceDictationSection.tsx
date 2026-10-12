import { useCallback, useRef } from 'react';

import { VoiceDictationCard } from '@/components/domain';
import { useVoiceDictation } from '@/hooks/useVoiceDictation';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { pendingProposals } from '@/services/assistant';
import { useAssistant } from '@/session/AssistantProvider';
import type { AudioFile, VoiceDictation } from '@/types/assistant';

export interface VoiceDictationSectionProps {
  petId: number;
  consultationId?: number;
  /** El servidor aplicó cambios: refrescar los datos de la pantalla. */
  onApplied?: (dictation: VoiceDictation) => void;
  onOpenConsultation?: (consultationId: number) => void;
}

/**
 * Dictado de consulta por voz dentro de la ficha de consulta o del paciente.
 * Solo aparece si el servidor tiene IA y el usuario puede dictar.
 */
export function VoiceDictationSection({
  petId,
  consultationId,
  onApplied,
  onOpenConsultation,
}: VoiceDictationSectionProps) {
  const { availability } = useAssistant();
  const recorder = useVoiceRecorder();
  const dictation = useVoiceDictation({ petId, consultationId, onApplied });
  // Se conserva el último audio para reintentar el envío sin volver a grabar.
  const lastAudio = useRef<AudioFile | null>(null);

  const onStopAndSend = useCallback(async () => {
    const audio = await recorder.stop();
    if (!audio) return;
    lastAudio.current = audio;
    await dictation.submit(audio);
  }, [recorder, dictation]);

  const onRetry = useCallback(() => {
    if (lastAudio.current) void dictation.submit(lastAudio.current);
  }, [dictation]);

  const onConfirmAll = useCallback(() => {
    const current = dictation.dictation;
    if (!current) return;
    void dictation.review(pendingProposals(current.tool_calls).map((call) => call.id));
  }, [dictation]);

  const onNew = useCallback(() => {
    lastAudio.current = null;
    dictation.reset();
  }, [dictation]);

  if (!availability.canDictate) return null;

  const current = dictation.dictation;
  const description = consultationId
    ? 'Dicta los hallazgos: el asistente completa esta consulta y propone recetas, vacunas o citas para que las confirmes.'
    : 'Dicta la consulta: el asistente la registra y propone recetas, vacunas o citas para que las confirmes.';

  return (
    <VoiceDictationCard
      title={consultationId ? 'Dictar a esta consulta' : 'Dictar nueva consulta'}
      description={description}
      isRecording={recorder.isRecording}
      durationMillis={recorder.durationMillis}
      phase={dictation.phase}
      dictation={current}
      errorMessage={recorder.error ?? dictation.error?.message ?? null}
      live={dictation.liveStatus === 'connected'}
      busyToolCallId={dictation.busyToolCallId}
      onStart={() => void recorder.start()}
      onStopAndSend={() => void onStopAndSend()}
      onCancel={() => void recorder.cancel()}
      onRetry={onRetry}
      onConfirm={(id) => void dictation.confirm(id)}
      onReject={(id) => void dictation.reject(id)}
      onConfirmAll={onConfirmAll}
      onNew={onNew}
      onOpenConsultation={
        onOpenConsultation && current?.consultation_id
          ? () => onOpenConsultation(current.consultation_id!)
          : undefined
      }
    />
  );
}
