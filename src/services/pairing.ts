/**
 * Emparejamiento de la app con un servidor PawCare por código QR.
 *
 * La web genera (Perfil) un QR `pawcare://pair?v=1&server=<URL>&code=<token>`
 * con un token de un solo uso y 10 min de vida, nunca credenciales
 * permanentes. La app:
 *   1. valida el contenido (`parsePairingUri`),
 *   2. apunta al servidor del QR (`setServerUrl`, persistido en almacenamiento
 *      seguro),
 *   3. canjea el token en `POST /auth/mobile/pair` por una sesión del usuario
 *      que lo generó y registra el dispositivo para push en el mismo paso.
 * Si el canje falla, la app vuelve al servidor y la sesión que tenía.
 */
import {
  getApiBaseUrl,
  getDefaultApiBaseUrl,
  normalizeServerUrl,
  resetServerUrl,
  setServerUrl,
} from '@/config/serverConfig';
import type {
  PairEnvelope,
  PairingDevice,
  PairingPayload,
  PairingResult,
} from '@/types/pairing';
import * as secureStore from '@/utils/secureStore';
import { api } from './api';
import { startSession } from './auth';

const PREFIX = 'pawcare://pair';
const SUPPORTED_VERSION = '1';

/** El contenido escaneado no es un QR de emparejamiento válido. */
export class PairingUriError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PairingUriError';
  }
}

function parseQuery(query: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of query.split('&')) {
    if (part.length === 0) continue;
    const eq = part.indexOf('=');
    const key = eq === -1 ? part : part.slice(0, eq);
    const value = eq === -1 ? '' : part.slice(eq + 1);
    try {
      out[decodeURIComponent(key)] = decodeURIComponent(value);
    } catch {
      throw new PairingUriError('El código QR está dañado. Genera uno nuevo.');
    }
  }
  return out;
}

/**
 * Valida el texto de un QR y devuelve servidor y código. Lanza
 * `PairingUriError` con un mensaje para el usuario si no es válido.
 */
export function parsePairingUri(raw: string): PairingPayload {
  const text = raw.trim();
  if (!text.toLowerCase().startsWith(PREFIX)) {
    throw new PairingUriError('Este QR no es un código de PawCare.');
  }
  const rest = text.slice(PREFIX.length).replace(/^\/+/, '');
  if (rest.length > 0 && !rest.startsWith('?')) {
    throw new PairingUriError('Este QR no es un código de PawCare.');
  }
  const query = parseQuery(rest.slice(1));

  if (query.v !== SUPPORTED_VERSION) {
    throw new PairingUriError(
      'Versión de código no compatible. Actualiza la app o genera un código nuevo.',
    );
  }
  const server = query.server ?? '';
  if (!/^https?:\/\/[^\s/]+/i.test(server)) {
    throw new PairingUriError('El QR no trae un servidor válido.');
  }
  const code = query.code ?? '';
  if (code.length === 0) {
    throw new PairingUriError('El QR no trae el código de emparejamiento.');
  }
  return { server: normalizeServerUrl(server), code };
}

async function restoreServer(previous: string): Promise<void> {
  if (previous === getDefaultApiBaseUrl()) await resetServerUrl();
  else await setServerUrl(previous);
}

/**
 * Cierra (sin bloquear) la sesión anterior en su servidor: su refresh token no
 * debe seguir vivo después de emparejar el teléfono con otra cuenta/servidor.
 */
async function revokeSession(
  server: string,
  tokens: { access: string | null; refresh: string | null },
): Promise<void> {
  if (!server || !tokens.access || !tokens.refresh) return;
  try {
    await fetch(`${server}/auth/mobile/logout`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.access}`,
      },
      body: JSON.stringify({ refresh_token: tokens.refresh }),
    });
  } catch {
    // Sin red hacia el servidor anterior: el refresh vencerá solo.
  }
}

/**
 * Apunta la app al servidor del QR y canjea el código por una sesión. Lanza
 * `ApiError` (422 código inválido/vencido, 429 demasiados intentos, red) y en
 * ese caso deja la app como estaba.
 */
export async function redeemPairing(
  payload: PairingPayload,
  device: PairingDevice,
): Promise<PairingResult> {
  const previousServer = getApiBaseUrl();
  const previousTokens = {
    access: await secureStore.getAccessToken(),
    refresh: await secureStore.getRefreshToken(),
  };

  const serverUrl = await setServerUrl(payload.server);
  let env: PairEnvelope;
  try {
    env = await api.post<PairEnvelope>(
      '/auth/mobile/pair',
      { code: payload.code, device },
      { auth: false, skipRefresh: true },
    );
  } catch (e) {
    await restoreServer(previousServer);
    throw e;
  }

  const user = await startSession(env);
  void revokeSession(previousServer, previousTokens);
  return { user, serverName: env.server.name, serverUrl };
}
