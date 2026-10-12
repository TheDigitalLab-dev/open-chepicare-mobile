/**
 * Configuración de la clínica para toda sesión Bearer (`clinic` de
 * `/auth/mobile/me`, login, register y refresh): zona IANA, `date_format`,
 * `time_format`, idioma y reglas de agenda. Sin datos sensibles.
 *
 * - El servicio de auth la aplica en cada respuesta que la trae, así que está
 *   lista antes de mostrar cualquier pantalla de la sesión (mes inicial del
 *   asistente de citas, "hoy", horas de las citas, recordatorios).
 * - Local-first: se guarda en AsyncStorage junto con el servidor que la envió,
 *   y `restoreClinicConfig()` la aplica al arrancar, sin red ni sesión.
 * - No es un dato personal: cerrar sesión no la borra (la siguiente sesión del
 *   mismo servidor la vuelve a traer).
 * - Solo en el primer arranque sin red ni sesión previa no hay configuración:
 *   `clinicTime` usa entonces la zona del dispositivo y los formatos por
 *   defecto del backend (DD/MM/YYYY, 24 h).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getApiBaseUrl, subscribeServerUrl } from '@/config/serverConfig';
import type { ClinicConfig } from '@/types/models';
import { setClinicConfig } from '@/utils/clinicTime';

export const CLINIC_CONFIG_STORAGE_KEY = 'pawcare.clinic_config';

interface CachedClinicConfig {
  server: string;
  config: ClinicConfig;
}

let current: ClinicConfig | null = null;
let currentServer: string | null = null;

function apply(config: ClinicConfig | null, server: string | null): void {
  current = config;
  currentServer = server;
  setClinicConfig(config);
}

/** Configuración aplicada (`null` si todavía no hay ninguna). */
export function getClinicConfig(): ClinicConfig | null {
  return current;
}

function isClinicConfig(value: unknown): value is ClinicConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ClinicConfig).time_zone === 'string'
  );
}

/**
 * Aplica y guarda la configuración que trae una respuesta del backend. Una
 * respuesta sin `clinic` (backend anterior) no borra la conocida. Un fallo al
 * guardar no rompe el inicio de sesión: la configuración queda en memoria.
 */
export async function applyClinicConfig(
  config: ClinicConfig | null | undefined,
): Promise<void> {
  if (!isClinicConfig(config)) return;
  const server = getApiBaseUrl();
  apply(config, server);
  try {
    const cached: CachedClinicConfig = { server, config };
    await AsyncStorage.setItem(CLINIC_CONFIG_STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // Sin persistencia: se volverá a traer en el próximo inicio con red.
  }
}

/**
 * Olvida la configuración en memoria (no la guardada): al cambiar de servidor,
 * o al simular un arranque en frío en los tests.
 */
export function forgetClinicConfig(): void {
  apply(null, null);
}

/**
 * Aplica la configuración guardada del servidor activo (arranque de la app,
 * antes de validar la sesión con la red). Devuelve `null` si no hay, es de
 * otro servidor o está dañada.
 */
export async function restoreClinicConfig(): Promise<ClinicConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(CLINIC_CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as Partial<CachedClinicConfig>;
    if (cached.server !== getApiBaseUrl() || !isClinicConfig(cached.config)) return null;
    apply(cached.config, cached.server);
    return cached.config;
  } catch {
    return null;
  }
}

// La configuración es de una clínica (un servidor): al cambiar de servidor deja
// de valer hasta que el nuevo la envíe.
subscribeServerUrl(() => {
  if (currentServer !== null && currentServer !== getApiBaseUrl()) forgetClinicConfig();
});
