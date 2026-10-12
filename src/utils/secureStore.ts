/**
 * Almacenamiento seguro de tokens de sesión (F4) — RNF-SEC-001.
 *
 * Los tokens viven SOLO aquí (`expo-secure-store` → Keystore/Keychain), nunca en
 * Redux, SQLite ni logs. El access token es un JWT corto (~30 min) y el refresh
 * es un valor opaco rotado en cada uso por el backend (`/auth/mobile/refresh`).
 */
import * as SecureStore from 'expo-secure-store';

// Las claves de SecureStore deben ser alfanuméricas + ".", "-", "_".
const ACCESS_KEY = 'pawcare.access_token';
const REFRESH_KEY = 'pawcare.refresh_token';
const PUSH_TOKEN_KEY = 'pawcare.expo_push_token';

export interface TokenPair {
  access: string;
  refresh: string;
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function setTokens({ access, refresh }: TokenPair): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, access),
    SecureStore.setItemAsync(REFRESH_KEY, refresh),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

export async function hasSession(): Promise<boolean> {
  return (await getAccessToken()) !== null;
}

/** Token Expo registrado en el servidor (para darlo de baja al cerrar sesión). */
export async function getPushToken(): Promise<string | null> {
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

export async function setPushToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
}

export async function clearPushToken(): Promise<void> {
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}
