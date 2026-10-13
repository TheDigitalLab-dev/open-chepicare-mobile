/**
 * Cambio del servidor guardado de la app.
 *
 * La URL del servidor decide a quién se le entregan credenciales y de quién
 * llegan las notificaciones, así que pasar a otro servidor no es silencioso:
 * `describeServerChange` reúne lo que se le explica al usuario y, si confirma,
 * `leaveCurrentServer` cierra la sesión y da de baja el push en el servidor
 * ANTERIOR (la app todavía apunta a él) antes de que el flujo que pidió el
 * cambio (guardar, restablecer o canjear un QR) apunte al nuevo.
 */
import { getApiBaseUrl, normalizeServerUrl } from '@/config/serverConfig';
import type { ServerChangeInfo } from '@/types/serverChange';
import * as secureStore from '@/utils/secureStore';
import { logout } from './auth';
import { getClinicConfig } from './clinicConfig';
import { unregisterThisDevice } from './pushNotifications';

/**
 * ¿Pasar a `target` cambia el servidor actual? La misma URL escrita distinto
 * (espacios, "/" final) no es un cambio, y sin servidor configurado (primer
 * arranque) tampoco: no hay sesión ni notificaciones que perder.
 */
export function isServerChange(target: string, current = getApiBaseUrl()): boolean {
  const from = normalizeServerUrl(current);
  if (from.length === 0) return false;
  return normalizeServerUrl(target) !== from;
}

/** Lo que se le explica al usuario antes de cambiar a `target`. */
export async function describeServerChange(target: string): Promise<ServerChangeInfo> {
  return {
    currentUrl: normalizeServerUrl(getApiBaseUrl()),
    targetUrl: normalizeServerUrl(target),
    // La configuración aplicada siempre es la del servidor activo.
    currentClinicName: getClinicConfig()?.name || null,
    hasSession: await secureStore.hasSession(),
  };
}

/**
 * Sale del servidor actual: da de baja el push de este teléfono y revoca la
 * sesión en ese servidor. Sin red hacia él no bloquea: los tokens locales se
 * borran igual (el refresh vencerá solo y el servidor desactiva los tokens
 * push inválidos al enviar). No lanza.
 */
export async function leaveCurrentServer(): Promise<void> {
  await unregisterThisDevice();
  try {
    await logout();
  } catch {
    // `logout` ya borró los tokens locales aunque el servidor no respondiera.
  }
}
