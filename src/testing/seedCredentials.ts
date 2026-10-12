/**
 * Credenciales sembradas del backend (SOLO tests de integración).
 *
 * El admin del seed cambió de contraseña entre ramas del backend: `admin12345`
 * (main) y `password123` (rama feat/voice-dictation-mcp, que además migra la
 * anterior). Se prueban ambas en orden contra el backend REAL: no se simula
 * nada, solo se elige la credencial que el servidor en ejecución acepta.
 */
import { ApiError } from '@/types/api';
import type { AuthUser } from '@/types/models';
import * as authService from '@/services/auth';

const BASE = () => process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export const ADMIN_LOGIN = 'admin@pawcare.com';
const ADMIN_PASSWORDS = ['admin12345', 'password123'];

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
  for (const password of ADMIN_PASSWORDS) {
    const res = await fetch(`${BASE()}/auth/mobile/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ login: ADMIN_LOGIN, password }),
    });
    if (res.ok) {
      const body = (await res.json()) as { auth: { access_token: string } };
      return body.auth.access_token;
    }
    if (res.status !== 401) throw new Error(`login admin falló (${res.status})`);
  }
  throw new Error('login admin falló: ninguna credencial sembrada fue aceptada');
}
