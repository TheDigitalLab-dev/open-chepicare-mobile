/**
 * Ciclo de sesión de la app (SessionProvider) contra el backend REAL: cierre de
 * sesión robusto, restauración al arrancar y teléfono compartido entre
 * propietarios. Solo el módulo nativo de alarmas (expo-notifications) es shim.
 */
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';

import { SessionProvider, useSession } from '@/session/SessionProvider';
import * as authService from '@/services/auth';
import { resetServerUrl, setServerUrl } from '@/config/serverConfig';
import * as secureStore from '@/utils/secureStore';

const PASSWORD = 'password123';
const UNREACHABLE = 'http://127.0.0.1:9';

const wrapper = ({ children }: { children: ReactNode }) => (
  <SessionProvider>{children}</SessionProvider>
);

async function renderSession() {
  const hook = renderHook(() => useSession(), { wrapper });
  await waitFor(() => expect(hook.result.current.status).toBe('ready'));
  return hook;
}

const purges = () =>
  (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mock.calls.length;

beforeEach(async () => {
  jest.clearAllMocks();
  await secureStore.clearTokens();
  await secureStore.clearLocalDataOwner();
});

afterEach(async () => {
  await resetServerUrl();
  await secureStore.clearTokens();
});

describe('SessionProvider', () => {
  it('signOut con el access vencido vuelve a público y purga los datos locales', async () => {
    const { result } = await renderSession();
    await act(() => result.current.signIn('owner1@example.com', PASSWORD));
    expect(result.current.role).toBe('owner');

    const refresh = await secureStore.getRefreshToken();
    await secureStore.setTokens({ access: 'token-vencido', refresh: refresh! });

    await act(() => result.current.signOut());

    expect(result.current.role).toBe('public');
    expect(result.current.user).toBeNull();
    expect(await secureStore.getAccessToken()).toBeNull();
    expect(purges()).toBeGreaterThan(0);
  }, 30000);

  it('signOut sin conexión también cierra la sesión local', async () => {
    const { result } = await renderSession();
    await act(() => result.current.signIn('owner1@example.com', PASSWORD));
    await setServerUrl(UNREACHABLE);

    await act(() => result.current.signOut());

    expect(result.current.role).toBe('public');
    expect(await secureStore.getAccessToken()).toBeNull();
  }, 30000);

  it('al arrancar sin conexión NO borra la sesión guardada', async () => {
    await authService.login('owner1@example.com', PASSWORD);
    await setServerUrl(UNREACHABLE);

    const { result } = await renderSession();

    expect(result.current.role).toBe('public');
    expect(await secureStore.getAccessToken()).not.toBeNull();
    expect(await secureStore.getRefreshToken()).not.toBeNull();

    // Con red, el siguiente arranque restaura la sesión del propietario.
    await resetServerUrl();
    const second = await renderSession();
    expect(second.result.current.role).toBe('owner');
    expect(second.result.current.user?.email).toBe('owner1@example.com');
  }, 30000);

  it('al arrancar con la sesión revocada borra tokens y datos locales', async () => {
    await secureStore.setTokens({ access: 'token-vencido', refresh: 'refresh-revocado' });

    const { result } = await renderSession();

    expect(result.current.role).toBe('public');
    expect(await secureStore.getAccessToken()).toBeNull();
    expect(await secureStore.getRefreshToken()).toBeNull();
    expect(purges()).toBeGreaterThan(0);
  }, 30000);

  it('otro propietario en el mismo teléfono no hereda los datos locales del anterior', async () => {
    // owner1 deja su sesión guardada (p. ej. el arranque sin red no la borró).
    const first = await renderSession();
    await act(() => first.result.current.signIn('owner1@example.com', PASSWORD));
    first.unmount();
    jest.clearAllMocks();

    const { result } = await renderSession();
    await act(() => result.current.signIn('owner1@example.com', PASSWORD));
    // El mismo propietario conserva sus datos locales.
    expect(purges()).toBe(0);

    await act(() => result.current.signIn('owner2@example.com', PASSWORD));
    expect(result.current.user?.email).toBe('owner2@example.com');
    expect(purges()).toBeGreaterThan(0);
  }, 30000);

  it('emparejar otra cuenta con sesión abierta: el fin de la sesión vieja no pisa la nueva', async () => {
    // Al canjear un QR de otro servidor con sesión abierta, el escáner se
    // desmonta a mitad del canje (el árbol se monta de nuevo para el servidor
    // nuevo) y llama a endSession() mientras el canje guarda la sesión nueva.
    const { result } = await renderSession();
    await act(() => result.current.signIn('owner1@example.com', PASSWORD));
    await secureStore.clearTokens(); // la sesión vieja ya se cerró en su servidor

    await act(async () => {
      const ending = result.current.endSession();
      // El canje abre la sesión nueva (tokens reales) mientras tanto.
      const user = await authService.login('vet@chepicare.com', PASSWORD);
      await Promise.all([ending, result.current.adoptSession(user)]);
    });
    expect(result.current.role).toBe('admin');
    expect(result.current.user?.email).toBe('vet@chepicare.com');
    expect(await secureStore.getAccessToken()).not.toBeNull();

    // Si endSession llega DESPUÉS de guardar la sesión nueva, tampoco la pisa.
    await act(() => result.current.endSession());
    expect(result.current.role).toBe('admin');
  }, 30000);

  it('endSession sin sesión nueva en curso sí vuelve a público', async () => {
    const { result } = await renderSession();
    await act(() => result.current.signIn('owner1@example.com', PASSWORD));
    await secureStore.clearTokens();
    await act(() => result.current.endSession());
    expect(result.current.role).toBe('public');
  }, 30000);
});
