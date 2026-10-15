/**
 * Emparejamiento de la app con un servidor ChepiCare por código QR.
 *
 * La web genera (Perfil del personal o «Mi Perfil» del propietario) un QR
 * `pawcare://pair?v=1&server=<URL>&code=<token>&account=<staff|owner>` (o
 * `chepicare://pair?...`: se aceptan los dos esquemas, ver `deepLinks`) con un
 * token de un solo uso y 10 min de vida, nunca credenciales permanentes. La
 * app:
 *   1. valida el contenido (`parsePairingUri`),
 *   2. apunta al servidor del QR (`setServerUrl`, persistido en almacenamiento
 *      seguro),
 *   3. canjea el token en `POST /auth/mobile/pair` por una sesión de la cuenta
 *      que lo generó (personal o propietario, según `account_type`) y registra
 *      el dispositivo para push en el mismo paso.
 * Si el canje falla, la app vuelve al servidor y la sesión que tenía.
 */
import { DEEP_LINK_PREFIXES } from '@/config/deepLinks';
import {
  getApiBaseUrl,
  getDefaultApiBaseUrl,
  normalizeServerUrl,
  resetServerUrl,
  setServerUrl,
} from '@/config/serverConfig';
import type { AuthUser } from '@/types/models';
import type {
  PairEnvelope,
  PairingAccountType,
  PairingDevice,
  PairingPayload,
  PairingResult,
} from '@/types/pairing';
import * as secureStore from '@/utils/secureStore';
import { api } from './api';
import { startSession } from './auth';

const PAIR_PREFIXES = DEEP_LINK_PREFIXES.map((prefix) => `${prefix}pair`);
const SUPPORTED_VERSION = '1';
const ACCOUNT_TYPES: readonly PairingAccountType[] = ['staff', 'owner'];

function isAccountType(value: string | undefined): value is PairingAccountType {
  return ACCOUNT_TYPES.some((type) => type === value);
}

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
 * Servidor del QR: http(s), host (nombre, IPv4 o IPv6 entre corchetes), puerto
 * y ruta base opcionales. Sin credenciales (`https://clinica.com@evil.com` es
 * evil.com), sin query ni fragmento (romperían la URL de cada petición).
 */
const SERVER_URL =
  /^https?:\/\/(?:[a-z\d](?:[a-z\d-]*[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]*[a-z\d])?)*|\[[\da-f:.]+\])(?::\d{1,5})?(?:\/[\w\-.~%!$&'()*+,;=:]*)*\/?$/i;

/**
 * Valida el texto de un QR y devuelve servidor, código y (si lo trae) el tipo
 * de cuenta. Un `account` ausente o desconocido no invalida el QR: es
 * informativo y la sesión la decide el canje. Lanza
 * `PairingUriError` con un mensaje para el usuario si no es válido.
 */
export function parsePairingUri(raw: string): PairingPayload {
  const text = raw.trim();
  const prefix = PAIR_PREFIXES.find((p) => text.toLowerCase().startsWith(p));
  if (!prefix) {
    throw new PairingUriError('Este QR no es un código de ChepiCare.');
  }
  const rest = text.slice(prefix.length).replace(/^\/+/, '');
  if (rest.length > 0 && !rest.startsWith('?')) {
    throw new PairingUriError('Este QR no es un código de ChepiCare.');
  }
  const query = parseQuery(rest.slice(1));

  if (query.v !== SUPPORTED_VERSION) {
    throw new PairingUriError(
      'Versión de código no compatible. Actualiza la app o genera un código nuevo.',
    );
  }
  const server = query.server ?? '';
  if (!SERVER_URL.test(server)) {
    throw new PairingUriError('El QR no trae un servidor válido.');
  }
  const code = query.code ?? '';
  if (code.length === 0) {
    throw new PairingUriError('El QR no trae el código de emparejamiento.');
  }
  const payload: PairingPayload = { server: normalizeServerUrl(server), code };
  if (isAccountType(query.account)) payload.account = query.account;
  return payload;
}

/**
 * Tipo de cuenta de la sesión canjeada. Se deriva del usuario (como el árbol
 * de navegación, también al restaurar la sesión con `/me`), así la app nunca
 * anuncia un modo distinto del que abre. El servidor actual envía el mismo
 * valor en `account_type`; los anteriores no lo envían.
 */
function accountTypeOf(user: AuthUser): PairingAccountType {
  return user.type === 'Owner' ? 'owner' : 'staff';
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
  return {
    user,
    accountType: accountTypeOf(user),
    serverName: env.server.name,
    serverUrl,
  };
}
