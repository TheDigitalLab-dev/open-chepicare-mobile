/**
 * Migración transparente de las claves locales `pawcare.*` → `chepicare.*`.
 *
 * Regla única para SecureStore y AsyncStorage: se lee la clave nueva; si no
 * existe, la vieja, que se copia a la nueva y solo entonces se borra. Borrar
 * elimina ambas (al cerrar sesión, un token viejo no puede "resucitar").
 * `migrateLegacyStorage()` lo aplica a todas las claves al arrancar la app,
 * antes de que nada lea o escriba; la lectura perezosa cubre lo que no se haya
 * podido migrar entonces (p. ej. Keystore no disponible en ese momento).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import {
  ASYNC_STORAGE_KEYS,
  LEGACY_STORAGE_KEY_PREFIX,
  SECURE_STORE_KEYS,
  STORAGE_KEY_PREFIX,
} from '@/config/storageKeys';

/** Clave `pawcare.*` que usaban las versiones PawCare para una `chepicare.*`. */
export function legacyKeyOf(key: string): string {
  if (!key.startsWith(STORAGE_KEY_PREFIX)) {
    throw new Error(`Clave de almacenamiento sin prefijo ${STORAGE_KEY_PREFIX}: ${key}`);
  }
  return LEGACY_STORAGE_KEY_PREFIX + key.slice(STORAGE_KEY_PREFIX.length);
}

interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

const secure: KeyValueStore = {
  get: (key) => SecureStore.getItemAsync(key),
  set: (key, value) => SecureStore.setItemAsync(key, value),
  remove: (key) => SecureStore.deleteItemAsync(key),
};

const async: KeyValueStore = {
  get: (key) => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, value),
  remove: (key) => AsyncStorage.removeItem(key),
};

async function read(store: KeyValueStore, key: string): Promise<string | null> {
  const current = await store.get(key);
  if (current !== null) return current;
  const legacyKey = legacyKeyOf(key);
  const legacy = await store.get(legacyKey);
  if (legacy === null) return null;
  // Primero se escribe la nueva; si falla, la vieja sigue intacta.
  await store.set(key, legacy);
  await store.remove(legacyKey);
  return legacy;
}

async function remove(store: KeyValueStore, key: string): Promise<void> {
  await Promise.all([store.remove(key), store.remove(legacyKeyOf(key))]);
}

/** Migra una clave: copia la vieja si la nueva falta y borra la vieja. */
async function migrate(store: KeyValueStore, key: string): Promise<void> {
  const legacyKey = legacyKeyOf(key);
  if ((await store.get(legacyKey)) === null) return;
  if ((await store.get(key)) === null) {
    await read(store, key);
  } else {
    await store.remove(legacyKey);
  }
}

export function getSecureItem(key: string): Promise<string | null> {
  return read(secure, key);
}

export function deleteSecureItem(key: string): Promise<void> {
  return remove(secure, key);
}

export function getAsyncItem(key: string): Promise<string | null> {
  return read(async, key);
}

export function removeAsyncItem(key: string): Promise<void> {
  return remove(async, key);
}

/**
 * Migra todas las claves conocidas. No lanza: si una clave falla se deja como
 * está (la vieja sigue legible) y se reintenta en la próxima lectura/arranque.
 */
export async function migrateLegacyStorage(): Promise<void> {
  // Cada clave es independiente: se migran a la vez y un fallo no frena al resto.
  await Promise.all(
    [
      ...Object.values(SECURE_STORE_KEYS).map((key) => migrate(secure, key)),
      ...Object.values(ASYNC_STORAGE_KEYS).map((key) => migrate(async, key)),
    ].map((job) =>
      job.catch(() => {
        // Sin persistencia disponible ahora: la lectura perezosa lo completa.
      }),
    ),
  );
}
