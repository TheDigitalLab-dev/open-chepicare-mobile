/**
 * Emparejamiento por QR de un PROPIETARIO contra el backend REAL: el código lo
 * genera «Mi Perfil» del portal del propietario (`POST /profile/pairing-codes`
 * con su sesión) y la app lo canjea por una sesión de propietario, no de
 * personal. Cubre también que funciona con «Sin IA» (no depende del asistente),
 * que el asistente no se habilita para propietarios y que revocar el
 * dispositivo desde la web cierra la sesión del teléfono aunque la app ya haya
 * rotado su refresh token.
 */
import { randomUUID } from 'node:crypto';

import { getApiBaseUrl, resetServerUrl, setServerUrl } from '@/config/serverConfig';
import * as authService from '@/services/auth';
import * as pairing from '@/services/pairing';
import * as petsService from '@/services/pets';
import * as server from '@/services/server';
import * as secureStore from '@/utils/secureStore';
import {
  AI_SETUP_TIMEOUT,
  applyAiSettings,
  DEGRADED_AI,
  patchAiSettings,
} from '@/testing/aiServer';
import {
  issuePairingCode,
  listPairedDevices,
  revokePairedDevice,
} from '@/testing/pairingServer';

const BACKEND = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const OWNER = 'owner1@example.com';
const PASSWORD = 'password123';

/** Sesión «web» del propietario (la que genera el QR y revoca dispositivos). */
async function ownerWebToken(): Promise<string> {
  await authService.login(OWNER, PASSWORD);
  const token = (await secureStore.getAccessToken())!;
  await secureStore.clearTokens();
  return token;
}

const expired = jest.fn();
let restoreAi: () => Promise<void>;

beforeAll(async () => {
  // «Sin inteligencia artificial»: el emparejamiento no depende de la IA.
  restoreAi = await applyAiSettings({ agent_engine: 'none' });
}, AI_SETUP_TIMEOUT);

afterAll(async () => {
  await restoreAi();
});

beforeEach(() => {
  expired.mockClear();
  authService.setOnSessionExpired(expired);
});

afterEach(async () => {
  authService.setOnSessionExpired(() => {});
  await secureStore.clearTokens();
  await resetServerUrl();
});

describe('emparejamiento de un propietario (real)', () => {
  it('con «Sin IA» abre la sesión del propietario, registra el push y sirve sus datos', async () => {
    const web = await ownerWebToken();
    const issued = await issuePairingCode(web);
    expect(issued.account_type).toBe('owner');

    const payload = pairing.parsePairingUri(issued.qr_payload);
    expect(payload).toMatchObject({ server: BACKEND, account: 'owner' });

    await setServerUrl('http://127.0.0.1:59999');
    const deviceName = `QA propietario ${randomUUID().slice(0, 8)}`;
    const result = await pairing.redeemPairing(payload, {
      expo_push_token: `ExponentPushToken[qa-${randomUUID()}]`,
      platform: 'android',
      device_name: deviceName,
    });

    expect(result.accountType).toBe('owner');
    expect(result.user.type).toBe('Owner');
    expect(result.user.email).toBe(OWNER);
    expect(result.serverUrl).toBe(BACKEND);
    expect(getApiBaseUrl()).toBe(BACKEND);

    // La sesión es de propietario: /me y sus endpoints responden con SUS datos.
    expect((await authService.fetchCurrentUser()).type).toBe('Owner');
    const names = (await petsService.listPets()).map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(['Max', 'Luna']));

    // El servidor está en «Sin IA» y, en cualquier caso, un propietario no
    // tiene asistente.
    const caps = await server.getCapabilities();
    expect(caps.ai.enabled).toBe(false);
    expect(caps.user).toBeNull();

    const device = (await listPairedDevices(web)).find(
      (d) => d.device_name === deviceName,
    );
    expect(device).toMatchObject({
      account_type: 'owner',
      platform: 'android',
      push_enabled: true,
    });
  }, 30000);

  it('con la IA encendida el asistente sigue oculto para el propietario', async () => {
    await patchAiSettings(DEGRADED_AI);
    try {
      const issued = await issuePairingCode(await ownerWebToken());
      await pairing.redeemPairing(pairing.parsePairingUri(issued.qr_payload), {
        platform: 'ios',
      });

      const caps = await server.getCapabilities();
      expect(caps.ai.enabled).toBe(true);
      expect(server.assistantAvailability(caps)).toEqual({
        aiEnabled: true,
        canChat: false,
        canVoiceChat: false,
        canDictate: false,
      });
    } finally {
      await patchAiSettings({ agent_engine: 'none' });
    }
  }, 30000);

  it('revocar el dispositivo en la web cierra la sesión del teléfono aunque haya rotado el refresh', async () => {
    const web = await ownerWebToken();
    const deviceName = `QA revocar ${randomUUID().slice(0, 8)}`;
    const issued = await issuePairingCode(web);
    await pairing.redeemPairing(pairing.parsePairingUri(issued.qr_payload), {
      platform: 'android',
      device_name: deviceName,
    });

    // La app renueva su sesión (access vencido → refresh rotado).
    const firstRefresh = await secureStore.getRefreshToken();
    await secureStore.setTokens({ access: 'token-vencido', refresh: firstRefresh! });
    expect((await authService.fetchCurrentUser()).email).toBe(OWNER);
    const rotated = await secureStore.getRefreshToken();
    expect(rotated).not.toBe(firstRefresh);

    const device = (await listPairedDevices(web)).find(
      (d) => d.device_name === deviceName,
    );
    await revokePairedDevice(web, device!.id);

    // Al vencer el access, el refresh rotado ya no sirve: sesión cerrada.
    await secureStore.setTokens({ access: 'token-vencido', refresh: rotated! });
    await expect(authService.fetchCurrentUser()).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledTimes(1);
    expect(await secureStore.hasSession()).toBe(false);
  }, 30000);
});
