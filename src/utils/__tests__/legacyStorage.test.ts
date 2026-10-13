/**
 * ChepiCare pasó a llamarse ChepiCare: las claves locales pasan de `pawcare.*` a
 * `chepicare.*`. Quien actualiza la app no debe perder la sesión, el servidor
 * emparejado ni sus preferencias: se lee la clave nueva y, si no existe, la
 * vieja, que se copia a la nueva y se borra.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { ASYNC_STORAGE_KEYS, SECURE_STORE_KEYS } from '@/config/storageKeys';
import {
  getAsyncItem,
  getSecureItem,
  legacyKeyOf,
  migrateLegacyStorage,
  removeAsyncItem,
  deleteSecureItem,
} from '@/utils/legacyStorage';

const ACCESS = SECURE_STORE_KEYS.accessToken;
const THEME = ASYNC_STORAGE_KEYS.themePreference;

beforeEach(async () => {
  await AsyncStorage.clear();
  await Promise.all(
    Object.values(SECURE_STORE_KEYS).flatMap((key) => [
      SecureStore.deleteItemAsync(key),
      SecureStore.deleteItemAsync(legacyKeyOf(key)),
    ]),
  );
});

describe('claves de almacenamiento', () => {
  it('todas usan el prefijo chepicare. y su clave vieja es la pawcare. equivalente', () => {
    const keys = [
      ...Object.values(SECURE_STORE_KEYS),
      ...Object.values(ASYNC_STORAGE_KEYS),
    ];
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(key).toMatch(/^chepicare\.[a-z_]+$/);
      expect(legacyKeyOf(key)).toBe(key.replace(/^chepicare\./, 'pawcare.'));
    }
  });

  it('conserva los nombres exactos que escribían las versiones PawCare', () => {
    expect(Object.values(SECURE_STORE_KEYS).map(legacyKeyOf).sort()).toEqual([
      'pawcare.access_token',
      'pawcare.expo_push_token',
      'pawcare.local_data_owner',
      'pawcare.refresh_token',
      'pawcare.server_url',
    ]);
    expect(Object.values(ASYNC_STORAGE_KEYS).map(legacyKeyOf).sort()).toEqual([
      'pawcare.clinic_config',
      'pawcare.theme_preference',
    ]);
  });

  it('rechaza una clave que no es chepicare.*', () => {
    expect(() => legacyKeyOf('pawcare.access_token')).toThrow();
  });
});

describe('SecureStore', () => {
  it('lee la clave nueva si existe y no toca la vieja', async () => {
    await SecureStore.setItemAsync(ACCESS, 'nuevo');
    await SecureStore.setItemAsync('pawcare.access_token', 'viejo');
    expect(await getSecureItem(ACCESS)).toBe('nuevo');
  });

  it('si solo existe la vieja, la devuelve, la copia a la nueva y la borra', async () => {
    await SecureStore.setItemAsync('pawcare.access_token', 'viejo');
    expect(await getSecureItem(ACCESS)).toBe('viejo');
    expect(await SecureStore.getItemAsync(ACCESS)).toBe('viejo');
    expect(await SecureStore.getItemAsync('pawcare.access_token')).toBeNull();
  });

  it('devuelve null si no existe ninguna', async () => {
    expect(await getSecureItem(ACCESS)).toBeNull();
  });

  it('borrar elimina la nueva y la vieja (la vieja no puede resucitar)', async () => {
    await SecureStore.setItemAsync(ACCESS, 'nuevo');
    await SecureStore.setItemAsync('pawcare.access_token', 'viejo');
    await deleteSecureItem(ACCESS);
    expect(await getSecureItem(ACCESS)).toBeNull();
  });
});

describe('AsyncStorage', () => {
  it('si solo existe la vieja, la devuelve, la copia a la nueva y la borra', async () => {
    await AsyncStorage.setItem('pawcare.theme_preference', 'dark');
    expect(await getAsyncItem(THEME)).toBe('dark');
    expect(await AsyncStorage.getItem(THEME)).toBe('dark');
    expect(await AsyncStorage.getItem('pawcare.theme_preference')).toBeNull();
  });

  it('prefiere la nueva y borrar elimina ambas', async () => {
    await AsyncStorage.setItem(THEME, 'light');
    await AsyncStorage.setItem('pawcare.theme_preference', 'dark');
    expect(await getAsyncItem(THEME)).toBe('light');
    await removeAsyncItem(THEME);
    expect(await AsyncStorage.getItem(THEME)).toBeNull();
    expect(await AsyncStorage.getItem('pawcare.theme_preference')).toBeNull();
  });
});

describe('migrateLegacyStorage (arranque de la app)', () => {
  it('mueve todas las claves pawcare.* a chepicare.* sin perder valores', async () => {
    await SecureStore.setItemAsync('pawcare.access_token', 'a');
    await SecureStore.setItemAsync('pawcare.refresh_token', 'r');
    await SecureStore.setItemAsync('pawcare.server_url', 'https://clinica.example.com');
    await SecureStore.setItemAsync('pawcare.expo_push_token', 'ExponentPushToken[x]');
    await SecureStore.setItemAsync('pawcare.local_data_owner', 'Owner:1');
    await AsyncStorage.setItem('pawcare.theme_preference', 'dark');
    await AsyncStorage.setItem('pawcare.clinic_config', '{"server":"s"}');

    await migrateLegacyStorage();

    expect(await SecureStore.getItemAsync(SECURE_STORE_KEYS.accessToken)).toBe('a');
    expect(await SecureStore.getItemAsync(SECURE_STORE_KEYS.refreshToken)).toBe('r');
    expect(await SecureStore.getItemAsync(SECURE_STORE_KEYS.serverUrl)).toBe(
      'https://clinica.example.com',
    );
    expect(await SecureStore.getItemAsync(SECURE_STORE_KEYS.pushToken)).toBe(
      'ExponentPushToken[x]',
    );
    expect(await SecureStore.getItemAsync(SECURE_STORE_KEYS.localDataOwner)).toBe(
      'Owner:1',
    );
    expect(await AsyncStorage.getItem(THEME)).toBe('dark');
    expect(await AsyncStorage.getItem(ASYNC_STORAGE_KEYS.clinicConfig)).toBe(
      '{"server":"s"}',
    );
    for (const key of Object.values(SECURE_STORE_KEYS)) {
      expect(await SecureStore.getItemAsync(legacyKeyOf(key))).toBeNull();
    }
    for (const key of Object.values(ASYNC_STORAGE_KEYS)) {
      expect(await AsyncStorage.getItem(legacyKeyOf(key))).toBeNull();
    }
  });

  it('no pisa un valor nuevo con uno viejo y limpia el viejo', async () => {
    await SecureStore.setItemAsync(ACCESS, 'nuevo');
    await SecureStore.setItemAsync('pawcare.access_token', 'viejo');
    await migrateLegacyStorage();
    expect(await SecureStore.getItemAsync(ACCESS)).toBe('nuevo');
    expect(await SecureStore.getItemAsync('pawcare.access_token')).toBeNull();
  });

  it('es idempotente', async () => {
    await AsyncStorage.setItem('pawcare.theme_preference', 'light');
    await migrateLegacyStorage();
    await migrateLegacyStorage();
    expect(await AsyncStorage.getItem(THEME)).toBe('light');
  });

  it('si no puede escribir la nueva, conserva la vieja (no lanza ni pierde datos)', async () => {
    await SecureStore.setItemAsync('pawcare.refresh_token', 'r');
    const setItem = jest.mocked(SecureStore.setItemAsync);
    setItem.mockRejectedValueOnce(new Error('Keystore no disponible'));
    await expect(migrateLegacyStorage()).resolves.toBeUndefined();
    expect(await SecureStore.getItemAsync('pawcare.refresh_token')).toBe('r');
    // En el siguiente arranque (o lectura) se completa la migración.
    expect(await getSecureItem(SECURE_STORE_KEYS.refreshToken)).toBe('r');
    expect(await SecureStore.getItemAsync('pawcare.refresh_token')).toBeNull();
  });
});
