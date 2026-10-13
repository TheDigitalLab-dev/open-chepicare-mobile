/**
 * E2E (app completa + backend real): acceso del propietario.
 * Login inválido, login correcto → panel del propietario, cierre de sesión.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { E2E_WAIT, findText, renderApp } from '@/testing/renderApp';
import * as secureStore from '@/utils/secureStore';

afterEach(async () => {
  await secureStore.clearTokens();
});

async function openLogin() {
  renderApp();
  fireEvent.press(
    await waitFor(() => screen.getByRole('button', { name: 'Iniciar sesión' }), E2E_WAIT),
  );
  await waitFor(() => screen.getByLabelText('Correo o usuario'), E2E_WAIT);
}

async function login(email: string, password: string) {
  fireEvent.changeText(screen.getByLabelText('Correo o usuario'), email);
  fireEvent.changeText(screen.getByLabelText('Contraseña'), password);
  fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));
}

describe('acceso del propietario', () => {
  it('credenciales inválidas: muestra el error y no entra', async () => {
    await openLogin();
    expect(screen.getByLabelText('Correo o usuario').props.keyboardType).toBe(
      'email-address',
    );
    await login('owner1@example.com', 'contraseña-incorrecta');
    await findText('Correo/usuario o contraseña incorrectos.');
    expect(await secureStore.getAccessToken()).toBeNull();
  }, 60000);

  it('login correcto abre el panel del propietario', async () => {
    await openLogin();
    await login('owner1@example.com', 'password123');
    await findText(/Juan/);
    expect(await secureStore.getAccessToken()).not.toBeNull();
  }, 60000);
});
