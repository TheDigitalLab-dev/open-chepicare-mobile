/**
 * Servicio de autenticación (F4) contra la superficie Bearer del backend:
 * `/auth/mobile/*` (separada del flujo web por cookies). Ver
 * `../pawcare/docs/mobile-auth-plan/auth.html`.
 *
 * Contrato:
 *  - login/register/refresh devuelven `{ success, user, auth: { access_token,
 *    refresh_token, token_type, expires_in } }`.
 *  - El access viaja como `Authorization: Bearer`; el refresh se rota en cada uso.
 *  - `user` trae `user_type` ("Owner" | "User"); de ahí se deriva el rol.
 */
import type { AuthUser, Owner, StaffUser } from '@/types/models';
import { ApiError } from '@/types/api';
import * as secureStore from '@/utils/secureStore';
import type { OwnerRegistration } from '@/screens/auth/RegisterScreen';
import { api, registerSessionRefresher, registerTokenProvider } from './api';

const BASE = '/auth/mobile';

/** Usuario tal como lo serializa el backend (`as_json` + `user_type`). */
interface ApiUser extends Record<string, unknown> {
  id: number;
  user_type: 'Owner' | 'User';
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role?: StaffUser['role'];
}

/** Par de tokens Bearer que entrega el backend. */
export interface AuthTokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

interface AuthEnvelope {
  success: boolean;
  user: ApiUser;
  auth: AuthTokenPair;
}

// --- Normalización ---------------------------------------------------------

/** Convierte el `user` del backend (`user_type`) al modelo del app (`type`). */
export function toAuthUser(raw: ApiUser): AuthUser {
  const { user_type, ...rest } = raw;
  if (user_type === 'User') {
    return { ...rest, type: 'User' } as unknown as StaffUser;
  }
  return { ...rest, type: 'Owner' } as unknown as Owner;
}

async function persistTokens(env: AuthEnvelope): Promise<AuthUser> {
  await storeTokenPair(env.auth);
  return toAuthUser(env.user);
}

// --- Endpoints -------------------------------------------------------------

export async function login(login: string, password: string): Promise<AuthUser> {
  const env = await api.post<AuthEnvelope>(
    `${BASE}/login`,
    { login, password },
    { auth: false },
  );
  return persistTokens(env);
}

export async function register(data: OwnerRegistration): Promise<AuthUser> {
  const env = await api.post<AuthEnvelope>(
    `${BASE}/register`,
    { owner: data },
    { auth: false },
  );
  return persistTokens(env);
}

/** Restaura la sesión al arrancar: valida el access (auto-refresh ante 401). */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const res = await api.get<{ user: ApiUser }>(`${BASE}/me`);
  return toAuthUser(res.user);
}

export async function forgotPassword(email: string): Promise<void> {
  // El backend siempre responde 200 (no revela si el correo existe).
  await api.post(`${BASE}/forgot_password`, { email }, { auth: false });
}

export async function resetPassword(
  token: string,
  password: string,
  passwordConfirmation: string,
): Promise<void> {
  await api.post(
    `${BASE}/reset_password`,
    { token, password, password_confirmation: passwordConfirmation },
    { auth: false },
  );
}

export async function logout(): Promise<void> {
  const refresh = await secureStore.getRefreshToken();
  try {
    // El refresh a revocar viaja en el CUERPO (los query params quedan en logs
    // de servidores/proxies). `skipRefresh` evita bucles si el access expiró.
    await api.delete(`${BASE}/logout`, {
      body: refresh ? { refresh_token: refresh } : undefined,
      skipRefresh: true,
    });
  } finally {
    await secureStore.clearTokens();
  }
}

// --- Interceptores de F3 (registro único en carga) -------------------------

/** Notifica a la capa de sesión que el refresh falló y hay que volver a público. */
let onSessionExpired: () => void = () => {};
export function setOnSessionExpired(fn: () => void): void {
  onSessionExpired = fn;
}

/** Guarda el par que entrega el backend (login, refresh o cambio de contraseña). */
export async function storeTokenPair(pair: AuthTokenPair): Promise<void> {
  await secureStore.setTokens({ access: pair.access_token, refresh: pair.refresh_token });
}

/**
 * Rota tokens usando el refresh guardado. Devuelve true si conviene reintentar.
 *
 * - El backend rota (y revoca) el refresh en cada uso: si dos peticiones
 *   renovaran a la vez, la segunda usaría un refresh revocado y cerraría la
 *   sesión. Por eso hay UNA renovación en vuelo compartida por todas.
 * - Si el servidor rechaza el refresh (revocado por cambio/restablecimiento de
 *   contraseña, cuenta desactivada o eliminada, vencido) se borran los tokens y
 *   se avisa una sola vez a la capa de sesión.
 * - Un fallo transitorio (sin red, timeout, 5xx, 429) NO cierra la sesión: la
 *   petición falla y el usuario puede reintentar.
 */
let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= renewTokens().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function renewTokens(): Promise<boolean> {
  const refresh = await secureStore.getRefreshToken();
  if (!refresh) return false;
  try {
    const env = await api.post<AuthEnvelope>(
      `${BASE}/refresh`,
      { refresh_token: refresh },
      { auth: false, skipRefresh: true },
    );
    await storeTokenPair(env.auth);
    return true;
  } catch (err) {
    const rejected =
      err instanceof ApiError &&
      (err.kind === 'unauthorized' || err.kind === 'forbidden' || err.kind === 'validation');
    if (rejected) {
      await secureStore.clearTokens();
      onSessionExpired();
    }
    return false;
  }
}

// Se ejecuta al importar el servicio (lo hace SessionProvider antes de cualquier
// petición): el cliente HTTP ya sabe leer el token y refrescar la sesión.
registerTokenProvider(secureStore.getAccessToken);
registerSessionRefresher(refreshSession);
