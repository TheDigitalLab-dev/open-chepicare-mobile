/**
 * Emparejamiento de la app con un servidor PawCare por código QR.
 * Contenido del QR: `pawcare://pair?v=1&server=<URL url-encoded>&code=<token>`.
 */
import type { AuthEnvelope } from './auth';
import type { DevicePlatform } from './devices';
import type { AuthUser } from './models';

/** Contenido validado del QR. */
export interface PairingPayload {
  /** URL base pública del servidor, normalizada (sin "/" final). */
  server: string;
  /** Token de un solo uso y corta vida (10 min). */
  code: string;
}

export interface PairingDevice {
  expo_push_token?: string;
  platform: DevicePlatform;
  device_name?: string;
}

/** Respuesta de `POST /auth/mobile/pair`: el sobre de login + el servidor. */
export interface PairEnvelope extends AuthEnvelope {
  server: { name: string };
}

export interface PairingResult {
  user: AuthUser;
  serverName: string;
  serverUrl: string;
}
