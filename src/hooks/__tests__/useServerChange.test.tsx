/**
 * `useServerChange` contra el backend REAL: antes de que la app pase a otro
 * servidor explica el cambio y pide confirmación; al confirmar cierra la sesión
 * (revocándola en el servidor anterior) y da de baja el push de este teléfono
 * antes de seguir; al cancelar no cambia nada.
 *
 * El "otro servidor" de estas pruebas es el mismo backend alcanzado por otra
 * dirección (`localhost` ↔ `127.0.0.1`): para la app son dos URLs distintas y
 * todas las respuestas son reales.
 */
import { act, renderHook } from '@testing-library/react-native';

import { getApiBaseUrl, resetServerUrl, setServerUrl } from '@/config/serverConfig';
import { usePairing } from '@/hooks/usePairing';
import { useServerChange, type ServerChangeInfo } from '@/hooks/useServerChange';
import * as authService from '@/services/auth';
import { registerPushDevice } from '@/services/devices';
import { issuePairingCode } from '@/testing/pairingServer';
import * as secureStore from '@/utils/secureStore';

const BACKEND = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
/** El mismo backend con otra dirección (otro "servidor" para la app). */
const OTHER = BACKEND.replace('localhost', '127.0.0.1');
const UNREACHABLE = 'http://127.0.0.1:59999';

let seq = 0;
function pushToken(): string {
  seq += 1;
  return `ExponentPushToken[server-change-${Date.now()}-${seq}]`;
}

/** Abre sesión como el propietario y registra un token push real en el servidor. */
async function ownerWithPush(): Promise<string> {
  await authService.login('owner1@example.com', 'password123');
  const token = pushToken();
  await registerPushDevice({ expo_push_token: token, platform: 'android' });
  await secureStore.setPushToken(token);
  return token;
}

async function loginRaw(server: string): Promise<string> {
  const res = await fetch(`${server}/auth/mobile/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ login: 'owner1@example.com', password: 'password123' }),
  });
  const body = (await res.json()) as { auth: { access_token: string } };
  return body.auth.access_token;
}

/** ¿Sigue registrado el token push para el propietario? (PATCH → 404 si no). */
async function pushStillRegistered(token: string): Promise<boolean> {
  const access = await loginRaw(BACKEND);
  const res = await fetch(`${BACKEND}/auth/mobile/devices`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${access}`,
    },
    body: JSON.stringify({ expo_push_token: token, disabled_categories: [] }),
  });
  return res.ok;
}

async function refreshAccepted(refresh: string): Promise<boolean> {
  const res = await fetch(`${BACKEND}/auth/mobile/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  return res.ok;
}

afterEach(async () => {
  await secureStore.clearTokens();
  await secureStore.clearPushToken();
  await resetServerUrl();
});

describe('useServerChange', () => {
  it('a la misma URL (aunque se escriba distinto) sigue sin preguntar', async () => {
    const proceed = jest.fn();
    const { result } = renderHook(() => useServerChange());

    await act(() => result.current.request(`${BACKEND}/`, proceed));
    await act(() => result.current.request(` ${BACKEND} `, proceed));

    expect(result.current.pending).toBeNull();
    expect(proceed).toHaveBeenCalledTimes(2);
    expect(proceed).toHaveBeenCalledWith(null);
  });

  it('sin servidor configurado (primer arranque) no hay nada que explicar', async () => {
    await setServerUrl('');
    const proceed = jest.fn();
    const { result } = renderHook(() => useServerChange());

    await act(() => result.current.request(BACKEND, proceed));

    expect(result.current.pending).toBeNull();
    expect(proceed).toHaveBeenCalledWith(null);
  });

  it('a otra URL explica el cambio (servidor actual, nuevo y clínica) y espera', async () => {
    await ownerWithPush();
    const proceed = jest.fn();
    const { result } = renderHook(() => useServerChange());

    await act(() => result.current.request(`${OTHER}/`, proceed));

    expect(proceed).not.toHaveBeenCalled();
    const pending = result.current.pending!;
    expect(pending.currentUrl).toBe(BACKEND);
    expect(pending.targetUrl).toBe(OTHER);
    expect(pending.hasSession).toBe(true);
    // El login aplicó la configuración de la clínica del servidor actual.
    expect(pending.currentClinicName?.length).toBeGreaterThan(0);

    // Mientras se pregunta, otras lecturas (la cámara sigue viendo el QR) se ignoran.
    await act(() => result.current.request(UNREACHABLE, proceed));
    expect(result.current.pending!.targetUrl).toBe(OTHER);
    expect(proceed).not.toHaveBeenCalled();
  }, 30000);

  it('al cancelar no cambia nada: servidor, sesión y push intactos', async () => {
    const token = await ownerWithPush();
    const refresh = await secureStore.getRefreshToken();
    const proceed = jest.fn();
    const { result } = renderHook(() => useServerChange());

    await act(() => result.current.request(OTHER, proceed));
    act(() => result.current.cancel());

    expect(result.current.pending).toBeNull();
    expect(proceed).not.toHaveBeenCalled();
    expect(getApiBaseUrl()).toBe(BACKEND);
    expect(await secureStore.getRefreshToken()).toBe(refresh);
    expect(await secureStore.getPushToken()).toBe(token);
    // La sesión sigue viva en el servidor y el push sigue registrado.
    const me = await authService.fetchCurrentUser();
    expect(me.email).toBe('owner1@example.com');
    expect(await pushStillRegistered(token)).toBe(true);

    // Cancelado, la siguiente petición vuelve a preguntar.
    await act(() => result.current.request(OTHER, proceed));
    expect(result.current.pending?.targetUrl).toBe(OTHER);
  }, 30000);

  it('al confirmar cierra la sesión, revoca el refresh y da de baja el push antes de seguir', async () => {
    const token = await ownerWithPush();
    const refresh = (await secureStore.getRefreshToken())!;
    const seen: { server: string; access: string | null; push: string | null }[] = [];
    const proceed = jest.fn(async (info: ServerChangeInfo | null) => {
      // Al seguir, la app aún apunta al servidor anterior, sin sesión ni push.
      seen.push({
        server: getApiBaseUrl(),
        access: await secureStore.getAccessToken(),
        push: await secureStore.getPushToken(),
      });
      await setServerUrl(info!.targetUrl);
    });
    const { result } = renderHook(() => useServerChange());

    await act(() => result.current.request(OTHER, proceed));
    await act(() => result.current.confirm());

    expect(result.current.pending).toBeNull();
    expect(result.current.leaving).toBe(false);
    expect(proceed).toHaveBeenCalledTimes(1);
    expect(proceed).toHaveBeenCalledWith(
      expect.objectContaining({ targetUrl: OTHER, hasSession: true }),
    );
    expect(seen).toEqual([{ server: BACKEND, access: null, push: null }]);
    expect(getApiBaseUrl()).toBe(OTHER);
    expect(await secureStore.getRefreshToken()).toBeNull();
    // Revocado de verdad en el servidor anterior y sin push registrado allí.
    expect(await refreshAccepted(refresh)).toBe(false);
    expect(await pushStillRegistered(token)).toBe(false);
  }, 30000);

  it('sin sesión abierta lo dice y al confirmar sigue sin más', async () => {
    const proceed = jest.fn();
    const { result } = renderHook(() => useServerChange());

    await act(() => result.current.request(OTHER, proceed));
    expect(result.current.pending).toMatchObject({ hasSession: false, targetUrl: OTHER });

    await act(() => result.current.confirm());
    expect(proceed).toHaveBeenCalledWith(expect.objectContaining({ hasSession: false }));
  });

  it('si el servidor anterior no responde, igual cierra la sesión local y sigue', async () => {
    await setServerUrl(UNREACHABLE);
    await secureStore.setTokens({ access: 'access-viejo', refresh: 'refresh-viejo' });
    await secureStore.setPushToken(pushToken());
    const proceed = jest.fn();
    const { result } = renderHook(() => useServerChange());

    await act(() => result.current.request(BACKEND, proceed));
    expect(result.current.pending?.currentUrl).toBe(UNREACHABLE);
    await act(() => result.current.confirm());

    expect(proceed).toHaveBeenCalledTimes(1);
    expect(await secureStore.getAccessToken()).toBeNull();
    expect(await secureStore.getRefreshToken()).toBeNull();
    expect(await secureStore.getPushToken()).toBeNull();
  }, 30000);

  it('con un QR de otro servidor: confirmar cierra la sesión anterior y canjea el código', async () => {
    // El propietario usa la app contra OTHER; el QR del veterinario apunta a BACKEND.
    await authService.login('vet@pawcare.com', 'password123');
    const issued = await issuePairingCode((await secureStore.getAccessToken())!);
    await secureStore.clearTokens();
    await setServerUrl(OTHER);
    await ownerWithPush();
    const ownerRefresh = (await secureStore.getRefreshToken())!;

    const onPaired = jest.fn();
    const { result } = renderHook(() => ({
      change: useServerChange(),
      pairing: usePairing({ onPaired }),
    }));

    await act(() =>
      result.current.change.request(issued.server_url, () =>
        result.current.pairing.pair(issued.qr_payload),
      ),
    );
    expect(result.current.change.pending).toMatchObject({
      currentUrl: OTHER,
      targetUrl: BACKEND,
      hasSession: true,
    });
    expect(result.current.pairing.status).toBe('idle');

    await act(() => result.current.change.confirm());

    expect(result.current.pairing.status).toBe('paired');
    expect(onPaired.mock.calls[0][0].user.email).toBe('vet@pawcare.com');
    expect(getApiBaseUrl()).toBe(BACKEND);
    expect(await refreshAccepted(ownerRefresh)).toBe(false);
  }, 45000);
});
