/**
 * Contrato de la superficie Bearer `/auth/mobile/*` del backend (login,
 * registro, refresh y canje del QR de emparejamiento comparten el sobre).
 */
import type { AuthTokenPair } from './api';
import type { ClinicConfig, StaffUser } from './models';

/** Usuario tal como lo serializa el backend (`as_json` + `user_type`). */
export interface ApiUser extends Record<string, unknown> {
  id: number;
  user_type: 'Owner' | 'User';
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role?: StaffUser['role'];
}

export interface AuthEnvelope {
  success: boolean;
  user: ApiUser;
  auth: AuthTokenPair;
  /** Zona horaria y formatos de la clínica (si el backend los envía). */
  clinic?: ClinicConfig;
}
