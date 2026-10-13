/**
 * Configuración del servidor en TIEMPO DE EJECUCIÓN.
 *
 * Pawcare es open source y self-hosted: cada quien puede correr su propio
 * backend (`../open-chepicare-web`) en su propio dominio/IP. Esta app permite elegir a qué
 * servidor conectarse y verificar que responde, sin recompilar.
 *
 * La URL activa vive en memoria (acceso síncrono para el cliente HTTP) y se
 * persiste en almacenamiento seguro (Keystore/Keychain): junto con los tokens
 * define A QUIÉN se le entregan las credenciales, así que no debe poder
 * alterarse desde un almacenamiento sin cifrar. `loadServerUrl()` la restaura
 * al arrancar la app y migra el valor de versiones anteriores (AsyncStorage).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { config } from './env';

const STORAGE_KEY = 'pawcare.server_url';

/** URL base activa (en memoria). Arranca con el default del build. */
let currentBaseUrl: string = config.apiBaseUrl;

// Suscriptores del cambio de servidor (p. ej. el gate de primer arranque).
const listeners = new Set<() => void>();
function emitChange(): void {
  for (const listener of listeners) listener();
}

/** Suscribe a cambios de la URL activa. Devuelve la función para desuscribir. */
export function subscribeServerUrl(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Normaliza una URL de servidor: añade esquema si falta y quita "/" finales. */
export function normalizeServerUrl(raw: string): string {
  let url = raw.trim();
  if (url.length === 0) return '';
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url.replace(/\/+$/, '');
}

/** URL base activa que usa el cliente HTTP (síncrono). */
export function getApiBaseUrl(): string {
  return currentBaseUrl;
}

/** URL por defecto del build (para "restablecer"). */
export function getDefaultApiBaseUrl(): string {
  return config.apiBaseUrl;
}

/** Restaura la URL guardada al arrancar la app. Idempotente y a prueba de fallos. */
export async function loadServerUrl(): Promise<void> {
  try {
    let saved = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!saved) {
      // Migración: versiones anteriores guardaban la URL en AsyncStorage.
      const legacy = await AsyncStorage.getItem(STORAGE_KEY);
      if (legacy && legacy.length > 0) {
        await SecureStore.setItemAsync(STORAGE_KEY, legacy);
        await AsyncStorage.removeItem(STORAGE_KEY);
        saved = legacy;
      }
    }
    if (saved && saved.length > 0) {
      currentBaseUrl = saved;
      emitChange();
    }
  } catch {
    // Sin persistencia disponible: se mantiene el default del build.
  }
}

/** Guarda y activa una nueva URL de servidor. Devuelve la URL normalizada. */
export async function setServerUrl(raw: string): Promise<string> {
  const url = normalizeServerUrl(raw);
  currentBaseUrl = url;
  emitChange();
  await SecureStore.setItemAsync(STORAGE_KEY, url);
  return url;
}

/** Vuelve al servidor por defecto del build y borra el guardado. */
export async function resetServerUrl(): Promise<void> {
  currentBaseUrl = config.apiBaseUrl;
  emitChange();
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEY),
    AsyncStorage.removeItem(STORAGE_KEY),
  ]);
}

export interface ServerHealth {
  ok: boolean;
  /** Latencia en ms si respondió; null si falló. */
  latencyMs: number | null;
}

/**
 * Comprueba si un servidor Pawcare responde en `<url>/up` (health check de
 * Rails). No lanza: devuelve `ok: false` ante cualquier fallo o timeout.
 */
export async function checkServerHealth(
  raw: string,
  timeoutMs = 6000,
): Promise<ServerHealth> {
  const url = normalizeServerUrl(raw);
  if (url.length === 0) return { ok: false, latencyMs: null };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(`${url}/up`, {
      method: 'GET',
      headers: { Accept: 'text/html,application/json' },
      signal: controller.signal,
    });
    return { ok: res.ok, latencyMs: res.ok ? Date.now() - start : null };
  } catch {
    return { ok: false, latencyMs: null };
  } finally {
    clearTimeout(timer);
  }
}
