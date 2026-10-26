/**
 * La sesión, el token push y el dueño de los datos locales se guardan en
 * SecureStore con claves `chepicare.*`; al cerrar sesión no queda ningún token
 * que pueda reabrirla.
 */
import * as SecureStore from 'expo-secure-store';

import * as secureStore from '@/utils/secureStore';

beforeEach(async () => {
  await secureStore.clearTokens();
  await secureStore.clearPushToken();
  await secureStore.clearLocalDataOwner();
});

describe('secureStore', () => {
  it('guarda la sesión con claves chepicare.*', async () => {
    await secureStore.setTokens({ access: 'a', refresh: 'r' });
    expect(await SecureStore.getItemAsync('chepicare.access_token')).toBe('a');
    expect(await SecureStore.getItemAsync('chepicare.refresh_token')).toBe('r');
    expect(await secureStore.hasSession()).toBe(true);
  });

  it('cerrar sesión borra los tokens', async () => {
    await secureStore.setTokens({ access: 'a', refresh: 'r' });

    await secureStore.clearTokens();

    expect(await secureStore.hasSession()).toBe(false);
    expect(await secureStore.getRefreshToken()).toBeNull();
    expect(await SecureStore.getItemAsync('chepicare.access_token')).toBeNull();
  });

  it('guarda y borra el token push y el dueño de los datos locales', async () => {
    await secureStore.setPushToken('ExponentPushToken[x]');
    await secureStore.setLocalDataOwner('Owner:7');
    expect(await SecureStore.getItemAsync('chepicare.expo_push_token')).toBe(
      'ExponentPushToken[x]',
    );
    expect(await SecureStore.getItemAsync('chepicare.local_data_owner')).toBe('Owner:7');

    await secureStore.clearPushToken();
    await secureStore.clearLocalDataOwner();
    expect(await secureStore.getPushToken()).toBeNull();
    expect(await secureStore.getLocalDataOwner()).toBeNull();
  });
});
