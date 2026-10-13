/**
 * Tipos del asistente IA de ChepiCare (dictado de consultas por voz, chat,
 * capacidades del servidor y push de la categoría `asistente`).
 *
 * Reflejan el contrato real de `open-chepicare-web` (rama feat/voice-dictation-mcp):
 * `AiJsonable` (voice_dictation, tool_call, message, conversation) y
 * `Server::GetCapabilities`. Ver `docs/plans/voice-dictation-mcp.md` del backend.
 */
import type { ClinicConfig } from './models';

// --- Capacidades del servidor ------------------------------------------------

/** Motor de IA configurado en Configuración > Inteligencia Artificial. */
export type AiEngine = 'none' | 'claude_cli' | 'anthropic_api';

export interface ServerCapabilities {
  server: { name: string; api_version: number };
  pairing: { enabled: boolean; qr_version: number };
  /**
   * Configuración pública de la clínica (zona, formatos, reglas de agenda),
   * la misma de la sesión. Ausente en backends anteriores.
   */
  clinic?: ClinicConfig | null;
  ai: {
    /** false = "Sin inteligencia artificial": ocultar chat y dictado. */
    enabled: boolean;
    engine: AiEngine;
    chat: boolean;
    /** false si el servidor no tiene transcripción configurada. */
    voice_chat: boolean;
    dictation: boolean;
  };
  /** Solo con sesión de personal: permisos efectivos del usuario. */
  user: { can_chat: boolean; can_dictate: boolean } | null;
}

/** Lo que la UI puede mostrar, ya cruzado con los permisos del usuario. */
export interface AssistantAvailability {
  aiEnabled: boolean;
  canChat: boolean;
  canVoiceChat: boolean;
  canDictate: boolean;
}

// --- Acciones del agente (auditoría ai_tool_calls) ---------------------------

export type ToolRisk = 'read' | 'auto' | 'confirm';
export type ToolCallStatus = 'executed' | 'proposed' | 'rejected' | 'failed' | 'denied';

export interface AiToolCall {
  id: number;
  tool_name: string;
  risk: ToolRisk;
  status: ToolCallStatus;
  channel: 'dictation' | 'chat' | 'mcp';
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error_message: string | null;
  target_type: string | null;
  target_id: number | null;
  position: number | null;
  voice_dictation_id: number | null;
  ai_message_id: number | null;
  executed_at: string | null;
  decided_at: string | null;
}

// --- Dictado de consulta -----------------------------------------------------

export type VoiceDictationStatus =
  | 'awaiting_audio'
  | 'received'
  | 'transcribing'
  | 'interpreting'
  | 'ready'
  | 'reviewed'
  | 'failed';

export interface VoiceDictation {
  id: number;
  status: VoiceDictationStatus;
  source: 'web' | 'mobile' | 'api';
  pet_id: number | null;
  consultation_id: number | null;
  appointment_id: number | null;
  language: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  summary: string | null;
  error_message: string | null;
  stt_provider: string | null;
  stt_model: string | null;
  agent_provider: string | null;
  agent_model: string | null;
  /** Propuestas que esperan confirmación del veterinario. */
  pending_count: number;
  tool_calls: AiToolCall[];
  created_at: string;
  transcribing_at: string | null;
  interpreting_at: string | null;
  ready_at: string | null;
  reviewed_at: string | null;
}

export interface CreateVoiceDictationInput {
  pet_id?: number;
  consultation_id?: number;
  appointment_id?: number;
  /** UUID v4: reintentos idempotentes (el servidor devuelve el mismo dictado). */
  client_request_id: string;
}

/** Archivo de audio local (URI de expo-audio) listo para subir por FormData. */
export interface AudioFile {
  uri: string;
  name: string;
  type: string;
}

/** Audio a subir: archivo local (React Native) o Blob ya en memoria. */
export type AudioSource = AudioFile | { blob: Blob; name: string };

export interface ReviewResult {
  voice_dictation: VoiceDictation;
  failures: string[];
}

// --- Chat ----------------------------------------------------------------------

export type AiMessageStatus =
  | 'pending'
  | 'transcribing'
  | 'thinking'
  | 'completed'
  | 'failed';

export interface AiMessage {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  input_mode: 'text' | 'voice';
  status: AiMessageStatus;
  content: string | null;
  error_message: string | null;
  agent_engine: string | null;
  agent_model: string | null;
  tool_calls: AiToolCall[];
  created_at: string;
  updated_at: string;
}

export interface AiConversation {
  id: number;
  title: string | null;
  pet_id: number | null;
  last_message_at: string | null;
  created_at: string;
}

export interface AiConversationWithMessages extends AiConversation {
  messages: AiMessage[];
}

export interface SentMessages {
  user_message: AiMessage;
  assistant_message: AiMessage;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

// --- Tiempo real (AiUpdatesChannel) -------------------------------------------

export type AiUpdate =
  | { type: 'voice_dictation'; voice_dictation: VoiceDictation }
  | { type: 'ai_message'; message: AiMessage };

// --- Push (Expo) ---------------------------------------------------------------

/** `data` de la notificación push de la categoría `asistente`. */
export type AssistantPushData =
  | {
      category: 'asistente';
      entity: 'voice_dictation';
      entity_id: number;
      event_key: string;
      consultation_id: number | null;
      pet_id: number | null;
    }
  | {
      category: 'asistente';
      entity: 'ai_message';
      entity_id: number;
      event_key: string;
      conversation_id: number;
    };
