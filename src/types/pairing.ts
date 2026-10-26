/**
 * Emparejamiento de la app con un servidor ChepiCare por código QR.
 * Contenido del QR:
 * `chepicare://pair?v=1&server=<URL url-encoded>&code=<token>&account=<staff|owner>`.
 * Lo genera el Perfil de la web, tanto del personal como del propietario.
 */
import type { AuthEnvelope } from './auth';
import type { DevicePlatform } from './devices';
import type { AuthUser } from './models';

/**
 * Tipo de cuenta que generó el código: `staff` (personal de la clínica, modelo
 * `User`) u `owner` (propietario de mascotas, modelo `Owner`).
 */
export type PairingAccountType = 'staff' | 'owner';

/** Contenido validado del QR. */
export interface PairingPayload {
  /** URL base pública del servidor, normalizada (sin "/" final). */
  server: string;
  /** Token de un solo uso y corta vida (10 min). */
  code: string;
  /**
   * Tipo de cuenta anunciado por el QR. Solo informativo (falta en QR de
   * servidores anteriores): la sesión la decide el canje.
   */
  account?: PairingAccountType;
}

export interface PairingDevice {
  expo_push_token?: string;
  platform: DevicePlatform;
  device_name?: string;
}

/**
 * Respuesta de `POST /auth/mobile/pair`: el sobre de login + el servidor y el
 * tipo de cuenta (fuente de verdad; servidores anteriores no lo envían).
 */
export interface PairEnvelope extends AuthEnvelope {
  server: { name: string };
  account_type?: PairingAccountType;
}

export interface PairingResult {
  user: AuthUser;
  accountType: PairingAccountType;
  serverName: string;
  serverUrl: string;
}
