/**
 * Quien actualiza desde una versión PawCare (claves `pawcare.*`) sigue con su
 * sesión, su token push y el dueño de sus datos locales; al cerrar sesión no
 * queda ningún token viejo que pueda reabrirla.
 */
import * as SecureStore from 'expo-secure-store';

import * as secureStore from '@/utils/secureStore';

const LEGACY = {
  access: 'pawcare.access_token',
  refresh: 'pawcare.refresh_token',
  push: 'pawcare.expo_push_token',
  owner: 'pawcare.local_data_owner',
};

beforeEach(async () => {
  await secureStore.clearTokens();
  await secureStore.clearPushToken();
  await secureStore.clearLocalDataOwner();
});

describe('secureStore tras el cambio de nombre a ChepiCare', () => {
  it('guarda la sesión con claves chepicare.*', async () => {
    await secureStore.setTokens({ access: 'a', refresh: 'r' });
    expect(await SecureStore.getItemAsync('chepicare.access_token')).toBe('a');
    expect(await SecureStore.getItemAsync('chepicare.refresh_token')).toBe('r');
    expect(await secureStore.hasSession()).toBe(true);
  });

  it('mantiene abierta la sesión guardada por una versión PawCare', async () => {
    await SecureStore.setItemAsync(LEGACY.access, 'a-viejo');
    await SecureStore.setItemAsync(LEGACY.refresh, 'r-viejo');

    expect(await secureStore.hasSession()).toBe(true);
    expect(await secureStore.getAccessToken()).toBe('a-viejo');
    expect(await secureStore.getRefreshToken()).toBe('r-viejo');
    expect(await SecureStore.getItemAsync(LEGACY.access)).toBeNull();
    expect(await SecureStore.getItemAsync(LEGACY.refresh)).toBeNull();
  });

  it('cerrar sesión borra también los tokens de la versión PawCare', async () => {
    await SecureStore.setItemAsync(LEGACY.access, 'a-viejo');
    await SecureStore.setItemAsync(LEGACY.refresh, 'r-viejo');

    await secureStore.clearTokens();

    expect(await secureStore.hasSession()).toBe(false);
    expect(await secureStore.getRefreshToken()).toBeNull();
  });

  it('conserva el token push y el dueño de los datos locales de la versión PawCare', async () => {
    await SecureStore.setItemAsync(LEGACY.push, 'ExponentPushToken[viejo]');
    await SecureStore.setItemAsync(LEGACY.owner, 'Owner:7');

    expect(await secureStore.getPushToken()).toBe('ExponentPushToken[viejo]');
    expect(await secureStore.getLocalDataOwner()).toBe('Owner:7');

    await secureStore.clearPushToken();
    await secureStore.clearLocalDataOwner();
    expect(await secureStore.getPushToken()).toBeNull();
    expect(await secureStore.getLocalDataOwner()).toBeNull();
  });
});
