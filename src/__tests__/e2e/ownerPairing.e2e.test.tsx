/**
 * E2E (app completa + backend real): emparejamiento por QR de un propietario.
 * El Perfil web emite el código; el teléfono recibe el deep link
 * `chepicare://pair?...` (lo que entrega el sistema al escanear el QR) y abre la
 * sesión del propietario con SUS datos.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { E2E_WAIT, findText, renderApp } from '@/testing/renderApp';
import { navigationRef } from '@/navigation/navigationRef';
import { resetServerUrl } from '@/config/serverConfig';
import * as authService from '@/services/auth';
import { issuePairingCode } from '@/testing/pairingServer';
import * as secureStore from '@/utils/secureStore';

afterEach(async () => {
  await secureStore.clearTokens();
  await resetServerUrl();
});

/** Params del deep link, igual que los extrae el `linking` de RootNavigator. */
async function ownerQrParams(email: string) {
  await authService.login(email, 'password123');
  const issued = await issuePairingCode((await secureStore.getAccessToken())!);
  await secureStore.clearTokens();
  expect(issued.account_type).toBe('owner');
  expect(issued.qr_payload).toMatch(/^chepicare:\/\/pair\?/);
  const url = new URL(issued.qr_payload.replace(/^chepicare:\/\//, 'https://qr.local/'));
  return Object.fromEntries(url.searchParams.entries()) as {
    v: string;
    server: string;
    code: string;
    account: string;
  };
}

it('el QR de owner2 abre su sesión y muestra solo sus mascotas', async () => {
  const params = await ownerQrParams('owner2@example.com');
  renderApp();
  await waitFor(() => screen.getByRole('button', { name: 'Iniciar sesión' }), E2E_WAIT);

  // chepicare://pair?v=…&server=…&code=…&account=owner
  await act(async () => {
    (navigationRef.navigate as unknown as (n: string, p: object) => void)('Auth', {
      screen: 'PairingScan',
      params,
    });
  });

  // Al canjear, la app adopta la sesión y monta el árbol del propietario.
  await findText(/^Hola, /);
  fireEvent.press(screen.getAllByText('Mascotas').at(-1)!);
  await findText('Rocky');
  expect(screen.queryByText('Max')).toBeNull();
  expect(await secureStore.getAccessToken()).not.toBeNull();
  const me = await authService.fetchCurrentUser();
  expect(me.email).toBe('owner2@example.com');
}, 60000);
