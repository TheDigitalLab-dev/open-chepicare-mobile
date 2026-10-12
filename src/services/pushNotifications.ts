/**
 * Notificaciones push remotas (Expo) de la app.
 *
 * - `getExpoPushToken`: pide permiso, crea el canal Android `asistente` y
 *   obtiene el token Expo del dispositivo. Devuelve null (sin lanzar) si no hay
 *   permiso, no hay `projectId` de EAS en el build o el dispositivo no puede
 *   recibir push (Expo Go en Android desde SDK 53): la app sigue funcionando
 *   con tiempo real (ActionCable) y polling.
 * - `parseAssistantPush` / `assistantPushTarget`: interpretan el `data` de la
 *   categoría `asistente` del backend ("Dictado procesado", "Respuesta del
 *   asistente") y deciden qué pantalla abrir al tocarla.
 */
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { AssistantPushData } from '@/types/assistant';

export const ASSISTANT_CHANNEL_ID = 'asistente';

function easProjectId(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (fromEnv) return fromEnv;
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      // En Android 13+ el diálogo de permiso solo aparece si ya existe un canal.
      await Notifications.setNotificationChannelAsync(ASSISTANT_CHANNEL_ID, {
        name: 'Asistente IA',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    const granted =
      current.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return null;
    const projectId = easProjectId();
    if (!projectId) return null;
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}

function toId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

/** `data` de una push del asistente, o null si es de otra categoría o está incompleta. */
export function parseAssistantPush(data: unknown): AssistantPushData | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  if (d.category !== 'asistente') return null;
  const entityId = toId(d.entity_id);
  const eventKey = typeof d.event_key === 'string' ? d.event_key : null;
  if (entityId === null || eventKey === null) return null;

  if (d.entity === 'voice_dictation') {
    return {
      category: 'asistente',
      entity: 'voice_dictation',
      entity_id: entityId,
      event_key: eventKey,
      consultation_id: toId(d.consultation_id),
      pet_id: toId(d.pet_id),
    };
  }
  if (d.entity === 'ai_message') {
    const conversationId = toId(d.conversation_id);
    if (conversationId === null) return null;
    return {
      category: 'asistente',
      entity: 'ai_message',
      entity_id: entityId,
      event_key: eventKey,
      conversation_id: conversationId,
    };
  }
  return null;
}

export type AssistantPushTarget =
  | { screen: 'consultation'; consultationId: number }
  | { screen: 'pet'; petId: number }
  | { screen: 'chat'; conversationId: number };

/** Pantalla que abre la notificación al tocarla. */
export function assistantPushTarget(data: AssistantPushData): AssistantPushTarget | null {
  if (data.entity === 'ai_message') {
    return { screen: 'chat', conversationId: data.conversation_id };
  }
  if (data.consultation_id !== null) {
    return { screen: 'consultation', consultationId: data.consultation_id };
  }
  if (data.pet_id !== null) return { screen: 'pet', petId: data.pet_id };
  return null;
}

/** Datos del dispositivo para el canje del QR y el registro push. */
export async function describeThisDevice(): Promise<{
  platform: 'android' | 'ios';
  device_name: string;
  expo_push_token?: string;
}> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const model = (Platform.constants as { Model?: string } | undefined)?.Model;
  const token = await getExpoPushToken();
  return {
    platform,
    device_name: model
      ? `${model} (PawCare)`
      : platform === 'ios'
        ? 'iPhone (PawCare)'
        : 'Android (PawCare)',
    ...(token ? { expo_push_token: token } : {}),
  };
}
