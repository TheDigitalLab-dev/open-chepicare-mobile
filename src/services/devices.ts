/**
 * Registro del dispositivo para notificaciones push (Expo) en el backend:
 * `/auth/mobile/devices` (upsert por token). Params planos: es una superficie
 * de autenticación (excepción a la convención de wrappers).
 */
import type { PushDeviceInput, RegisteredDevice } from '@/types/devices';
import { api } from './api';

const BASE = '/auth/mobile/devices';

export async function registerPushDevice(
  input: PushDeviceInput,
): Promise<RegisteredDevice> {
  const { device } = await api.post<{ device: RegisteredDevice }>(BASE, input);
  return device;
}

/** Da de baja el token (al cerrar sesión o al desactivar las notificaciones). */
export async function unregisterPushDevice(expoPushToken: string): Promise<void> {
  await api.delete(BASE, { body: { expo_push_token: expoPushToken } });
}
