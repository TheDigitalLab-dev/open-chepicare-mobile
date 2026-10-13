/**
 * Almacenamiento seguro de tokens de sesión (F4) — RNF-SEC-001.
 *
 * Los tokens viven SOLO aquí (`expo-secure-store` → Keystore/Keychain), nunca en
 * Redux, SQLite ni logs. El access token es un JWT corto (~30 min) y el refresh
 * es un valor opaco rotado en cada uso por el backend (`/auth/mobile/refresh`).
 */
import * as SecureStore from 'expo-secure-store';

import { SECURE_STORE_KEYS } from '@/config/storageKeys';
import { deleteSecureItem, getSecureItem } from './legacyStorage';

// Lecturas y borrados también cubren las claves `pawcare.*` de las versiones
// PawCare (ver `legacyStorage`): actualizar la app no cierra la sesión.
const ACCESS_KEY = SECURE_STORE_KEYS.accessToken;
const REFRESH_KEY = SECURE_STORE_KEYS.refreshToken;
const PUSH_TOKEN_KEY = SECURE_STORE_KEYS.pushToken;

export interface TokenPair {
  access: string;
  refresh: string;
}

export async function getAccessToken(): Promise<string | null> {
  return getSecureItem(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getSecureItem(REFRESH_KEY);
}

export async function setTokens({ access, refresh }: TokenPair): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, access),
    SecureStore.setItemAsync(REFRESH_KEY, refresh),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([deleteSecureItem(ACCESS_KEY), deleteSecureItem(REFRESH_KEY)]);
}

export async function hasSession(): Promise<boolean> {
  return (await getAccessToken()) !== null;
}

/** Token Expo registrado en el servidor (para darlo de baja al cerrar sesión). */
export async function getPushToken(): Promise<string | null> {
  return getSecureItem(PUSH_TOKEN_KEY);
}

export async function setPushToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
}

export async function clearPushToken(): Promise<void> {
  await deleteSecureItem(PUSH_TOKEN_KEY);
}

/**
 * Dueño de los datos locales (SQLite, alarmas) que hay en el teléfono:
 * "Owner:12" / "User:3". Si inicia sesión otra cuenta, se purgan antes.
 */
const LOCAL_DATA_OWNER_KEY = SECURE_STORE_KEYS.localDataOwner;

export async function getLocalDataOwner(): Promise<string | null> {
  return getSecureItem(LOCAL_DATA_OWNER_KEY);
}

export async function setLocalDataOwner(owner: string): Promise<void> {
  await SecureStore.setItemAsync(LOCAL_DATA_OWNER_KEY, owner);
}

export async function clearLocalDataOwner(): Promise<void> {
  await deleteSecureItem(LOCAL_DATA_OWNER_KEY);
}
