/**
 * Claves de almacenamiento local de la app (una sola fuente de verdad).
 *
 * Las claves de SecureStore deben ser alfanuméricas + ".", "-", "_".
 */

/** Keystore/Keychain (`expo-secure-store`): credenciales y a quién se entregan. */
export const SECURE_STORE_KEYS = {
  accessToken: 'chepicare.access_token',
  refreshToken: 'chepicare.refresh_token',
  pushToken: 'chepicare.expo_push_token',
  localDataOwner: 'chepicare.local_data_owner',
  serverUrl: 'chepicare.server_url',
} as const;

/** AsyncStorage: datos no sensibles (preferencias y caché de la clínica). */
export const ASYNC_STORAGE_KEYS = {
  themePreference: 'chepicare.theme_preference',
  clinicConfig: 'chepicare.clinic_config',
} as const;

export const STORAGE_KEY_PREFIX = 'chepicare.';
