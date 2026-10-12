/**
 * `usePairing` contra el backend REAL: escanear el QR que genera el Perfil web
 * configura el servidor y abre la sesión del usuario que lo generó.
 */
import { act, renderHook } from '@testing-library/react-native';

import { getApiBaseUrl, resetServerUrl } from '@/config/serverConfig';
import { usePairing } from '@/hooks/usePairing';
import * as authService from '@/services/auth';
import * as secureStore from '@/utils/secureStore';
import { issuePairingCode } from '@/testing/pairingServer';

const BACKEND = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function freshQr(): Promise<string> {
  await authService.login('vet@pawcare.com', 'password123');
  const issued = await issuePairingCode((await secureStore.getAccessToken())!);
  await secureStore.clearTokens();
  return issued.qr_payload;
}

afterEach(async () => {
  await secureStore.clearTokens();
  await resetServerUrl();
});

describe('usePairing', () => {
  it('canjea el QR, avisa con el usuario y deja el servidor configurado', async () => {
    const qr = await freshQr();
    const onPaired = jest.fn();
    const { result } = renderHook(() => usePairing({ onPaired }));
    expect(result.current.status).toBe('idle');

    await act(() => result.current.pair(qr));

    expect(result.current.status).toBe('paired');
    expect(result.current.error).toBeNull();
    expect(onPaired).toHaveBeenCalledTimes(1);
    expect(onPaired.mock.calls[0][0].user.email).toBe('vet@pawcare.com');
    expect(result.current.serverName?.length).toBeGreaterThan(0);
    expect(getApiBaseUrl()).toBe(BACKEND);

    // Escaneos repetidos del mismo QR (la cámara sigue viéndolo) se ignoran.
    await act(() => result.current.pair(qr));
    expect(onPaired).toHaveBeenCalledTimes(1);
  }, 30000);

  it('un QR ajeno muestra el motivo y permite reintentar', async () => {
    const onPaired = jest.fn();
    const { result } = renderHook(() => usePairing({ onPaired }));

    await act(() => result.current.pair('https://otra-cosa.example.com'));
    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatch(/no es un código de PawCare/i);

    act(() => result.current.reset());
    expect(result.current.status).toBe('idle');
    expect(onPaired).not.toHaveBeenCalled();
  });

  it('un código ya canjeado informa el error del servidor', async () => {
    const qr = await freshQr();
    const first = renderHook(() => usePairing({ onPaired: () => {} }));
    await act(() => first.result.current.pair(qr));
    await secureStore.clearTokens();

    const { result } = renderHook(() => usePairing({ onPaired: () => {} }));
    await act(() => result.current.pair(qr));
    expect(result.current.status).toBe('error');
    expect(result.current.error).toMatch(/inválido o vencido/i);
  }, 30000);
});
