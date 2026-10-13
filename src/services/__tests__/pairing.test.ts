/**
 * Emparejamiento por QR: validación del contenido escaneado y canje REAL del
 * código contra el backend (`POST /auth/mobile/pair`). El código lo genera el
 * mismo endpoint del Perfil web; nada se simula.
 */
import { randomUUID } from 'node:crypto';

import { getApiBaseUrl, resetServerUrl, setServerUrl } from '@/config/serverConfig';
import * as authService from '@/services/auth';
import * as pairing from '@/services/pairing';
import * as secureStore from '@/utils/secureStore';
import { issuePairingCode, listPairedDevices } from '@/testing/pairingServer';

const BACKEND = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

afterEach(async () => {
  await secureStore.clearTokens();
  await resetServerUrl();
});

describe('parsePairingUri', () => {
  it.each(['chepicare', 'pawcare'])(
    'extrae servidor y código de %s://pair?v=1',
    (scheme) => {
      const uri = `${scheme}://pair?v=1&server=${encodeURIComponent('https://clinica.example.com/')}&code=Zx3-_abc`;
      expect(pairing.parsePairingUri(uri)).toEqual({
        server: 'https://clinica.example.com',
        code: 'Zx3-_abc',
      });
    },
  );

  it('acepta el esquema sin distinguir mayúsculas (lectores de QR que lo cambian)', () => {
    const uri = 'ChepiCare://pair?v=1&server=https%3A%2F%2Fa.com&code=x';
    expect(pairing.parsePairingUri(uri)).toEqual({ server: 'https://a.com', code: 'x' });
  });

  it.each(['staff', 'owner'] as const)('lee el tipo de cuenta account=%s', (account) => {
    const uri = `chepicare://pair?v=1&server=https%3A%2F%2Fa.com&code=x&account=${account}`;
    expect(pairing.parsePairingUri(uri)).toEqual({
      server: 'https://a.com',
      code: 'x',
      account,
    });
  });

  it('sin account (QR de un servidor anterior) o con un valor desconocido no falla: decide el canje', () => {
    const base = 'pawcare://pair?v=1&server=https%3A%2F%2Fa.com&code=x';
    expect(pairing.parsePairingUri(base).account).toBeUndefined();
    expect(pairing.parsePairingUri(`${base}&account=root`).account).toBeUndefined();
  });

  it.each([
    ['https://clinica.example.com', 'no es un código de ChepiCare'],
    ['pawcare://reset_password/abc', 'no es un código de ChepiCare'],
    ['chepicare://reset_password/abc', 'no es un código de ChepiCare'],
    [
      'otraapp://pair?v=1&server=https%3A%2F%2Fa.com&code=x',
      'no es un código de ChepiCare',
    ],
    [
      'chepicare://pairing?v=1&server=https%3A%2F%2Fa.com&code=x',
      'no es un código de ChepiCare',
    ],
    ['pawcare://pair?v=2&server=https%3A%2F%2Fa.com&code=x', 'versión'],
    ['chepicare://pair?v=1&code=x', 'servidor'],
    ['pawcare://pair?v=1&server=ftp%3A%2F%2Fa.com&code=x', 'servidor'],
    ['pawcare://pair?v=1&server=https%3A%2F%2Fa.com', 'código'],
  ])('rechaza %s', (uri, fragment) => {
    expect(() => pairing.parsePairingUri(uri)).toThrow(pairing.PairingUriError);
    expect(() => pairing.parsePairingUri(uri)).toThrow(new RegExp(fragment, 'i'));
  });
});

describe('redeemPairing (real)', () => {
  async function freshQr(): Promise<string> {
    await authService.login('vet@chepicare.com', 'password123');
    const token = (await secureStore.getAccessToken())!;
    const issued = await issuePairingCode(token);
    await secureStore.clearTokens();
    return issued.qr_payload;
  }

  it('configura el servidor del QR, abre la sesión y registra el dispositivo', async () => {
    const qr = await freshQr();
    const payload = pairing.parsePairingUri(qr);
    expect(payload.server).toBe(BACKEND);
    expect(payload.account).toBe('staff');

    // La app estaba apuntando a otro servidor: el QR la reconfigura.
    await setServerUrl('http://127.0.0.1:59999');
    const deviceName = `QA ${randomUUID().slice(0, 8)}`;
    const result = await pairing.redeemPairing(payload, {
      expo_push_token: `ExponentPushToken[qa-${randomUUID()}]`,
      platform: 'android',
      device_name: deviceName,
    });

    expect(result.serverUrl).toBe(BACKEND);
    expect(result.serverName.length).toBeGreaterThan(0);
    expect(result.user.email).toBe('vet@chepicare.com');
    expect(result.user.type).toBe('User');
    expect(result.accountType).toBe('staff');
    expect(getApiBaseUrl()).toBe(BACKEND);

    // La sesión canjeada es real: /me responde con el usuario del QR.
    const me = await authService.fetchCurrentUser();
    expect(me.email).toBe('vet@chepicare.com');

    const devices = await listPairedDevices((await secureStore.getAccessToken())!);
    expect(devices.find((d) => d.device_name === deviceName)?.push_enabled).toBe(true);
  }, 30000);

  it('un código ya usado se rechaza y la app vuelve a su servidor anterior', async () => {
    const payload = pairing.parsePairingUri(await freshQr());
    await pairing.redeemPairing(payload, { platform: 'ios' });
    await secureStore.clearTokens();

    await setServerUrl('http://127.0.0.1:59999');
    await expect(
      pairing.redeemPairing(payload, { platform: 'ios' }),
    ).rejects.toMatchObject({
      kind: 'validation',
      message: expect.stringMatching(/inválido o vencido/),
    });
    expect(getApiBaseUrl()).toBe('http://127.0.0.1:59999');
    expect(await secureStore.hasSession()).toBe(false);
  }, 30000);
});
