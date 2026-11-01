/**
 * Credenciales sembradas del backend (SOLO tests de integración).
 *
 * El seed actual del admin usa `password123`; BD de desarrollo anteriores aún
 * pueden tener `admin12345` (hasta volver a correr `db:seed`). Se prueban en ese
 * orden contra el backend REAL: no se simula nada, solo se elige la credencial
 * que el servidor en ejecución acepta.
 */
import { ApiError, type AuthTokenPair } from '@/types/api';
import type { AuthUser } from '@/types/models';
import * as authService from '@/services/auth';

const BASE = () => process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export const ADMIN_LOGIN = 'admin@chepicare.com';
const ADMIN_PASSWORDS = ['password123', 'admin12345'];
const fixtureTokens = new Map<string, { token: string; expiresAt: number }>();

/** Inicia sesión como el admin del seed con el servicio real de la app. */
export async function loginSeedAdmin(): Promise<AuthUser> {
  let lastError: unknown;
  for (const password of ADMIN_PASSWORDS) {
    try {
      return await authService.login(ADMIN_LOGIN, password);
    } catch (e) {
      lastError = e;
      if (!(e instanceof ApiError) || e.status !== 401) throw e;
    }
  }
  throw lastError;
}

/**
 * Access token del admin del seed sin tocar la sesión de la app (para preparar
 * el servidor desde un test que corre con otro usuario).
 */
export async function seedAdminAccessToken(): Promise<string> {
  const base = BASE();
  const cached = fixtureTokens.get(base);
  if (cached && cached.expiresAt > Date.now()) return cached.token;
  for (const password of ADMIN_PASSWORDS) {
    const res = await fetch(`${base}/auth/mobile/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ login: ADMIN_LOGIN, password }),
    });
    if (res.ok) {
      const body = (await res.json()) as { auth: AuthTokenPair };
      // Reutiliza únicamente el JWT real hasta antes del vencimiento del servidor.
      fixtureTokens.set(base, {
        token: body.auth.access_token,
        expiresAt: Date.now() + Math.max(0, body.auth.expires_in - 30) * 1000,
      });
      return body.auth.access_token;
    }
    if (res.status !== 401) throw new Error(`login admin falló (${res.status})`);
  }
  throw new Error('login admin falló: ninguna credencial sembrada fue aceptada');
}
