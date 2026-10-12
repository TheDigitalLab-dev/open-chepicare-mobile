/**
 * Dispositivo registrado para push (Expo) en `/auth/mobile/devices`.
 */
export type DevicePlatform = 'android' | 'ios';

export interface PushDeviceInput {
  expo_push_token: string;
  platform: DevicePlatform;
  /** Categorías (claves de `NOTIFICATION_CATEGORIES`) que el usuario apagó. */
  disabled_categories?: string[];
}

export interface RegisteredDevice {
  id: number;
  expo_push_token: string;
  platform: DevicePlatform;
  disabled_categories: string[];
  last_used_at: string | null;
}
