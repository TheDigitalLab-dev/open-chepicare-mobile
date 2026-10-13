/**
 * Integración REAL del registro del dispositivo para push (`/auth/mobile/devices`).
 */
import { randomUUID } from 'node:crypto';

import * as authService from '@/services/auth';
import * as devices from '@/services/devices';
import { NOTIFICATION_CATEGORIES } from '@/services/notificationPrefs';
import * as secureStore from '@/utils/secureStore';

beforeAll(async () => {
  await authService.login('vet@chepicare.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

const pushToken = () => `ExponentPushToken[qa-${randomUUID()}]`;

describe('devices: registro push (real)', () => {
  it('registra el token Expo, lo actualiza (upsert) y lo da de baja', async () => {
    const token = pushToken();
    const device = await devices.registerPushDevice({
      expo_push_token: token,
      platform: 'android',
      disabled_categories: ['campanas'],
    });
    expect(device.expo_push_token).toBe(token);
    expect(device.platform).toBe('android');
    expect(device.disabled_categories).toEqual(['campanas']);

    // Re-registrar el mismo token no duplica: actualiza el mismo dispositivo.
    const again = await devices.registerPushDevice({
      expo_push_token: token,
      platform: 'android',
      disabled_categories: [],
    });
    expect(again.id).toBe(device.id);
    expect(again.disabled_categories).toEqual([]);

    await expect(devices.unregisterPushDevice(token)).resolves.toBeUndefined();
  });

  it('rechaza un token vacío con un error legible', async () => {
    await expect(
      devices.registerPushDevice({ expo_push_token: '  ', platform: 'ios' }),
    ).rejects.toMatchObject({ kind: 'validation' });
  });

  it('la categoría del asistente existe en las preferencias de la app', () => {
    expect(NOTIFICATION_CATEGORIES.map((c) => c.key)).toContain('asistente');
  });
});
