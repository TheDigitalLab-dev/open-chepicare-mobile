/**
 * Texto que explica un cambio de servidor antes de confirmarlo, en lenguaje
 * claro para propietarios y personal de la clínica.
 */
import type { ServerChangeInfo } from '@/types/serverChange';

export interface ServerChangeExplanation {
  /** Servidor actual (con el nombre de la clínica si se conoce). */
  current: string;
  /** Servidor al que se va a cambiar. */
  target: string;
  /** Qué es el servidor (ChepiCare open source, uno por clínica). */
  about: string;
  /** Qué pasa al confirmar (sesión y notificaciones). */
  consequence: string;
  /** Cuándo hacerlo. */
  advice: string;
}

export function serverChangeExplanation(info: ServerChangeInfo): ServerChangeExplanation {
  const current = info.currentClinicName
    ? `${info.currentClinicName} (${info.currentUrl})`
    : info.currentUrl;
  const target = info.targetUrl || 'Ninguno (tendrás que configurar uno)';
  const consequence = info.hasSession
    ? 'Al cambiar, se cerrará tu sesión en este teléfono y dejarás de recibir notificaciones del servidor anterior. Después podrás entrar con tu cuenta del servidor nuevo.'
    : 'No hay ninguna sesión abierta en este teléfono, así que no se cerrará nada; a partir de ahora la app usará el servidor nuevo.';
  return {
    current,
    target,
    about:
      'ChepiCare es de código abierto: cada clínica tiene su propio servidor, y ahí viven sus datos y tu cuenta.',
    consequence,
    advice: 'Hazlo solo si te lo indicó tu clínica.',
  };
}
