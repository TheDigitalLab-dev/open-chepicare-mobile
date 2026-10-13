/**
 * Servicio del asistente IA (staff) contra el backend real de PawCare:
 * dictado de consulta por voz, chat escrito/por voz y confirmación de las
 * propuestas del agente. Ver contrato en `docs/plans/voice-dictation-mcp.md`
 * de open-chepicare-web.
 *
 * Convención del backend: datos con wrapper de modelo (`{ voice_dictation: {…} }`)
 * y archivos (audio) por FormData en endpoints separados.
 *
 * Con la IA apagada ("Sin inteligencia artificial") todos los endpoints
 * responden 409 `{ code: "ai_disabled" }` → `isAiDisabledError`.
 */
import { ApiError } from '@/types/api';
import type {
  AiConversation,
  AiConversationWithMessages,
  AiMessageStatus,
  AiToolCall,
  AudioFile,
  AudioSource,
  CreateVoiceDictationInput,
  PaginationMeta,
  ReviewResult,
  SentMessages,
  VoiceDictation,
  VoiceDictationStatus,
} from '@/types/assistant';
import { api } from './api';

/** Subida de audio: más tiempo que el default (notas de hasta 15 min). */
const UPLOAD_TIMEOUT_MS = 120_000;

// --- Estados y progreso -------------------------------------------------------

export const DICTATION_STATUS_LABEL: Record<VoiceDictationStatus, string> = {
  awaiting_audio: 'Esperando audio',
  received: 'Recibido',
  transcribing: 'Transcribiendo',
  interpreting: 'Interpretando',
  ready: 'Aplicado',
  reviewed: 'Revisado',
  failed: 'Con error',
};

/** Etapas visibles del progreso: recibido → transcribiendo → interpretando → aplicado. */
export const DICTATION_STEPS = [
  'Recibido',
  'Transcribiendo',
  'Interpretando',
  'Aplicado',
];

/** Índice de la etapa (0–3) de `DICTATION_STEPS`; -1 si aún no hay audio. */
export function dictationStep(status: VoiceDictationStatus): number {
  switch (status) {
    case 'awaiting_audio':
      return -1;
    case 'received':
      return 0;
    case 'transcribing':
      return 1;
    case 'interpreting':
      return 2;
    case 'ready':
    case 'reviewed':
    case 'failed':
      return 3;
  }
}

/** El servidor ya no cambiará el dictado por sí solo (fin del polling). */
export function isFinalDictationStatus(status: VoiceDictationStatus): boolean {
  return status === 'ready' || status === 'reviewed' || status === 'failed';
}

export const MESSAGE_STATUS_LABEL: Record<AiMessageStatus, string> = {
  pending: 'En cola',
  transcribing: 'Transcribiendo',
  thinking: 'Pensando',
  completed: 'Listo',
  failed: 'Con error',
};

export function isFinalMessageStatus(status: AiMessageStatus): boolean {
  return status === 'completed' || status === 'failed';
}

/** true si el servidor respondió que la IA está deshabilitada. */
export function isAiDisabledError(error: unknown): boolean {
  return (
    error instanceof ApiError && error.kind === 'conflict' && error.code === 'ai_disabled'
  );
}

/** Propuestas del agente que esperan confirmación del veterinario. */
export function pendingProposals(toolCalls: AiToolCall[]): AiToolCall[] {
  return toolCalls.filter((call) => call.status === 'proposed');
}

// --- Audio --------------------------------------------------------------------

/** Límite del servidor: notas de hasta 15 min (≤ 25 MB). */
export const MAX_RECORDING_SECONDS = 15 * 60;

const AUDIO_MIME: Record<string, string> = {
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
};

/** Archivo a subir a partir de la URI local que deja expo-audio al detenerse. */
export function audioFileFromRecording(uri: string): AudioFile {
  const last = uri.split('/').pop() ?? '';
  const ext = last.includes('.') ? (last.split('.').pop() ?? '').toLowerCase() : '';
  const type = AUDIO_MIME[ext];
  if (!type) return { uri, name: 'nota-de-voz.m4a', type: 'audio/mp4' };
  return { uri, name: last, type };
}

/** `m:ss` para el cronómetro de la grabación. */
export function formatRecordingDuration(millis: number): string {
  const total = Math.floor(millis / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const TOOL_LABELS: Record<string, string> = {
  search_pets: 'Buscar mascotas',
  get_pet_clinical_history: 'Consultar historia clínica',
  list_services: 'Consultar servicios',
  create_consultation: 'Crear la consulta',
  update_consultation: 'Actualizar la consulta',
  add_prescription: 'Agregar receta',
  request_lab_exam: 'Solicitar examen',
  register_vaccination: 'Registrar vacuna',
  register_deworming: 'Registrar desparasitación',
  update_medical_profile: 'Actualizar perfil médico',
  schedule_follow_up: 'Agendar control',
};

/** Nombre en español de una acción del agente (tool MCP). */
export function toolCallLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? toolName.replace(/_/g, ' ');
}

const SUMMARY_FIELDS = [
  'product_name',
  'vaccine_name',
  'exam_name',
  'diagnosis',
  'reason',
  'scheduled_at',
  'query',
] as const;

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

/** Resumen corto de lo que propone/hizo el agente (para revisar sin abrir el JSON). */
export function toolCallSummary(call: Pick<AiToolCall, 'tool_name' | 'input'>): string {
  const input = call.input ?? {};
  const parts: string[] = [];
  if (Array.isArray(input.items)) {
    for (const item of input.items as Record<string, unknown>[]) {
      const name = asText(item?.medication_name);
      if (name) parts.push([name, asText(item.dose)].filter(Boolean).join(' '));
    }
  }
  const allergies = Array.isArray(input.add_allergies)
    ? (input.add_allergies as unknown[]).map(asText).filter(Boolean)
    : [];
  if (allergies.length > 0) parts.push(`Alergias: ${allergies.join(', ')}`);
  const diseases = Array.isArray(input.add_chronic_diseases)
    ? (input.add_chronic_diseases as unknown[]).map(asText).filter(Boolean)
    : [];
  if (diseases.length > 0) parts.push(`Crónicas: ${diseases.join(', ')}`);
  for (const field of SUMMARY_FIELDS) {
    const text = asText(input[field]);
    if (text) parts.push(text);
  }
  return parts.join(' · ');
}

export const TOOL_CALL_STATUS_LABEL: Record<AiToolCall['status'], string> = {
  executed: 'Aplicada',
  proposed: 'Por confirmar',
  rejected: 'Rechazada',
  failed: 'Falló',
  denied: 'Sin permiso',
};

function audioForm(audio: AudioSource): FormData {
  const form = new FormData();
  if ('blob' in audio) {
    form.append('audio', audio.blob, audio.name);
  } else {
    // React Native: FormData acepta `{ uri, name, type }` y lee el archivo local.
    form.append('audio', audio as unknown as Blob);
  }
  return form;
}

// --- Dictado de consulta -------------------------------------------------------

export async function createVoiceDictation(
  input: CreateVoiceDictationInput,
): Promise<VoiceDictation> {
  const { voice_dictation } = await api.post<{ voice_dictation: VoiceDictation }>(
    '/admin/voice_dictations',
    { voice_dictation: { ...input, source: 'mobile' } },
  );
  return voice_dictation;
}

/** Sube la nota de voz; el servidor responde 202 y encola el procesamiento. */
export async function uploadVoiceDictationAudio(
  id: number,
  audio: AudioSource,
): Promise<VoiceDictation> {
  const { voice_dictation } = await api.upload<{ voice_dictation: VoiceDictation }>(
    `/admin/voice_dictations/${id}/audio`,
    audioForm(audio),
    { timeoutMs: UPLOAD_TIMEOUT_MS },
  );
  return voice_dictation;
}

export async function getVoiceDictation(id: number): Promise<VoiceDictation> {
  const { voice_dictation } = await api.get<{ voice_dictation: VoiceDictation }>(
    `/admin/voice_dictations/${id}`,
  );
  return voice_dictation;
}

export async function listVoiceDictations(filters: {
  pet_id?: number;
  consultation_id?: number;
  page?: number;
}): Promise<{ voice_dictations: VoiceDictation[]; pagination: PaginationMeta }> {
  return api.get('/admin/voice-dictations-list', { params: filters });
}

/** Confirma las propuestas indicadas, rechaza las demás y cierra el dictado. */
export async function reviewVoiceDictation(
  id: number,
  confirmIds: number[],
): Promise<ReviewResult> {
  return api.post<ReviewResult>(`/admin/voice_dictations/${id}/review`, {
    confirm_ids: confirmIds,
  });
}

export async function confirmToolCall(id: number): Promise<AiToolCall> {
  const { tool_call } = await api.post<{ tool_call: AiToolCall }>(
    `/admin/ai_tool_calls/${id}/confirm`,
  );
  return tool_call;
}

export async function rejectToolCall(id: number): Promise<AiToolCall> {
  const { tool_call } = await api.post<{ tool_call: AiToolCall }>(
    `/admin/ai_tool_calls/${id}/reject`,
  );
  return tool_call;
}

// --- Chat ----------------------------------------------------------------------

export async function listConversations(
  page?: number,
): Promise<{ conversations: AiConversation[]; pagination: PaginationMeta }> {
  return api.get('/admin/ai-conversations-list', { params: { page } });
}

export async function createConversation(input: {
  title?: string;
  pet_id?: number;
}): Promise<AiConversationWithMessages> {
  const { conversation } = await api.post<{ conversation: AiConversationWithMessages }>(
    '/admin/ai_conversations',
    { ai_conversation: input },
  );
  return conversation;
}

export async function getConversation(id: number): Promise<AiConversationWithMessages> {
  const { conversation } = await api.get<{ conversation: AiConversationWithMessages }>(
    `/admin/ai_conversations/${id}`,
  );
  return conversation;
}

export async function deleteConversation(id: number): Promise<void> {
  await api.delete(`/admin/ai_conversations/${id}`);
}

export async function sendMessage(
  conversationId: number,
  content: string,
): Promise<SentMessages> {
  return api.post<SentMessages>(`/admin/ai_conversations/${conversationId}/messages`, {
    ai_message: { content },
  });
}

export async function sendVoiceMessage(
  conversationId: number,
  audio: AudioSource,
): Promise<SentMessages> {
  return api.upload<SentMessages>(
    `/admin/ai_conversations/${conversationId}/voice_message`,
    audioForm(audio),
    { timeoutMs: UPLOAD_TIMEOUT_MS },
  );
}
