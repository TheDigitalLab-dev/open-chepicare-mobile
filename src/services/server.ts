/**
 * Capacidades del servidor PawCare al que está conectada la app
 * (`GET /auth/mobile/capabilities`). Es público; con sesión de personal agrega
 * los permisos efectivos del usuario. Con "Sin inteligencia artificial" en
 * Configuración > IA, `ai.enabled` es false y la app oculta chat y dictado.
 */
import type { AssistantAvailability, ServerCapabilities } from '@/types/assistant';
import { api } from './api';

export async function getCapabilities(): Promise<ServerCapabilities> {
  return api.get<ServerCapabilities>('/auth/mobile/capabilities');
}

/** Lo que la UI puede mostrar: IA del servidor cruzada con permisos del usuario. */
export function assistantAvailability(
  caps: ServerCapabilities | null,
): AssistantAvailability {
  const aiEnabled = caps?.ai.enabled === true;
  const user = caps?.user ?? null;
  const canChat = aiEnabled && caps!.ai.chat && user?.can_chat === true;
  return {
    aiEnabled,
    canChat,
    canVoiceChat: canChat && caps!.ai.voice_chat,
    canDictate: aiEnabled && caps!.ai.dictation && user?.can_dictate === true,
  };
}
