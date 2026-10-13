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
 * - Al cambiar de servidor se descarta la de la clínica anterior (también la
 *   zona aprendida de sus citas) y se pide la del nuevo al endpoint público
 *   `/auth/mobile/capabilities`, sin esperar al siguiente inicio de sesión.
 * - Solo en el primer arranque sin red ni sesión previa no hay configuración:
 *   `clinicTime` usa entonces la zona del dispositivo y los formatos por
 *   defecto del backend (DD/MM/YYYY, 24 h).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getApiBaseUrl, subscribeServerUrl } from '@/config/serverConfig';
import { ASYNC_STORAGE_KEYS } from '@/config/storageKeys';
import type { ServerCapabilities } from '@/types/assistant';
import type { ClinicConfig } from '@/types/models';
import { setClinicConfig } from '@/utils/clinicTime';
import { getAsyncItem } from '@/utils/legacyStorage';
import { api } from './api';

export const CLINIC_CONFIG_STORAGE_KEY = ASYNC_STORAGE_KEYS.clinicConfig;

interface CachedClinicConfig {
  server: string;
  config: ClinicConfig;
}

let current: ClinicConfig | null = null;

function apply(config: ClinicConfig | null): void {
  current = config;
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
  apply(config);
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
  apply(null);
}

/**
 * Aplica la configuración guardada del servidor activo (arranque de la app,
 * antes de validar la sesión con la red). Devuelve `null` si no hay, es de
 * otro servidor o está dañada.
 */
export async function restoreClinicConfig(): Promise<ClinicConfig | null> {
  try {
    const raw = await getAsyncItem(CLINIC_CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as Partial<CachedClinicConfig>;
    if (cached.server !== getApiBaseUrl() || !isClinicConfig(cached.config)) return null;
    apply(cached.config);
    return cached.config;
  } catch {
    return null;
  }
}

let lastRefresh: Promise<ClinicConfig | null> = Promise.resolve(null);

/**
 * Pide la configuración de la clínica al servidor activo con el endpoint
 * público `/auth/mobile/capabilities` (sin sesión: no se envían credenciales)
 * y la aplica. Si mientras tanto se cambió de servidor, la respuesta se
 * descarta. No lanza: sin red devuelve `null` y no toca nada.
 */
export function refreshClinicConfig(): Promise<ClinicConfig | null> {
  const server = getApiBaseUrl();
  lastRefresh = (async () => {
    try {
      const { clinic } = await api.get<Pick<ServerCapabilities, 'clinic'>>(
        '/auth/mobile/capabilities',
        { auth: false },
      );
      if (server !== getApiBaseUrl() || !isClinicConfig(clinic)) return null;
      await applyClinicConfig(clinic);
      return clinic;
    } catch {
      return null;
    }
  })();
  return lastRefresh;
}

/** Espera a la última petición de configuración en curso (arranque y tests). */
export async function clinicConfigSettled(): Promise<void> {
  await lastRefresh;
}

// La configuración es de una clínica (un servidor): al cambiar de servidor se
// descarta YA (incluida la zona aprendida de las citas, que no tiene servidor
// asociado) y se pide la del nuevo. Guardar otra vez la misma URL no es un
// cambio.
let activeServer = getApiBaseUrl();
subscribeServerUrl(() => {
  const server = getApiBaseUrl();
  if (server === activeServer) return;
  activeServer = server;
  forgetClinicConfig();
  void refreshClinicConfig();
});
