/**
 * Contrato de la superficie Bearer `/auth/mobile/*` del backend (login,
 * registro, refresh y canje del QR de emparejamiento comparten el sobre).
 */
import type { AuthTokenPair } from './api';
import type { ClinicConfig, PhoneType, StaffUser } from './models';

export type { PhoneType };
export type OwnerSex = 'male' | 'female' | 'other';

/** Payload de `POST /auth/mobile/register` (`owner_params`). */
export interface OwnerRegistration {
  first_name: string;
  last_name: string;
  identity_document: string;
  email: string;
  username: string;
  password: string;
  password_confirmation: string;
  address: string;
  sex: OwnerSex;
  phone: string;
  phone_type: PhoneType;
}

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
