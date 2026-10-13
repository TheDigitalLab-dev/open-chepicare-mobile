/**
 * Servicio de Perfil (usuario autenticado) contra `../open-chepicare-web`.
 * Endpoints JSON: PATCH /profile, PATCH /profile/password.
 */
import type { AuthTokenPair } from '@/types/api';
import { api } from './api';
import { storeTokenPair } from './auth';

export interface ProfileInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  identity_document?: string;
  /** `null` vacía el campo. */
  address?: string | null;
  phone?: string | null;
  sex?: string;
  phone_type?: string;
}

export interface ChangePasswordInput {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export async function updateProfile(input: ProfileInput): Promise<void> {
  await api.patch('/profile', input);
}

/**
 * Cambia la contraseña. El backend cierra TODAS las sesiones (revoca los
 * refresh y los JWT llevan la huella de la contraseña) y entrega a la sesión
 * actual un par nuevo en `auth` (clientes Bearer): hay que guardarlo, o el
 * siguiente request daría 401 y la app cerraría sesión.
 */
export async function changePassword(input: ChangePasswordInput): Promise<void> {
  const res = await api.patch<{ success: boolean; auth?: AuthTokenPair }>(
    '/profile/password',
    input,
  );
  if (res?.auth) await storeTokenPair(res.auth);
}

/** Elimina la cuenta del usuario autenticado (acción permanente). */
export async function deleteAccount(): Promise<void> {
  await api.delete('/profile');
}
