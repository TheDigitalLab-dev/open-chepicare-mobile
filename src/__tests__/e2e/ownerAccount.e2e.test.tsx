/**
 * E2E (app completa + backend real): acceso del propietario.
 * Login inválido, login correcto → panel del propietario, registro (con
 * correo repetido y alta correcta) y cierre de sesión desde el perfil.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import {
  E2E_WAIT,
  answerAlert,
  findText,
  loginThroughUi,
  pressButton,
  renderApp,
} from '@/testing/renderApp';
import * as authService from '@/services/auth';
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

describe('registro de propietario', () => {
  it('correo repetido se explica en el campo; un alta correcta entra al panel', async () => {
    renderApp();
    await pressButton('Crear cuenta');
    await waitFor(() => screen.getByLabelText('Nombre'), E2E_WAIT);

    const suffix = `${Date.now()}`.slice(-8);
    const fill = (label: string, value: string) =>
      fireEvent.changeText(screen.getByLabelText(label), value);
    fill('Nombre', 'Ana');
    fill('Apellido', 'E2E');
    fill('Documento de identidad', `V-${suffix}`);
    fill('Correo', 'owner1@example.com');
    fill('Teléfono', '04141234567');
    fill('Usuario', `anae2e${suffix}`);
    fill('Contraseña', 'password123');
    fill('Confirmar contraseña', 'password123');

    // Teclados correctos.
    expect(screen.getByLabelText('Correo').props.keyboardType).toBe('email-address');
    expect(screen.getByLabelText('Teléfono').props.keyboardType).toBe('phone-pad');
    expect(screen.getByLabelText('Documento de identidad').props.keyboardType).toBe(
      'default',
    );

    await pressButton('Crear cuenta');
    await findText('ya está en uso');
    expect(await secureStore.getAccessToken()).toBeNull();

    fill('Correo', `ana.e2e.${suffix}@example.com`);
    await pressButton('Crear cuenta');
    await findText('Hola, Ana');
    expect(await secureStore.getAccessToken()).not.toBeNull();
  }, 60000);
});

describe('cierre de sesión', () => {
  it('desde el perfil vuelve al acceso y el servidor revoca la sesión', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    renderApp();
    await loginThroughUi('owner1@example.com');
    const refresh = await secureStore.getRefreshToken();

    fireEvent.press(screen.getAllByText('Perfil').at(-1)!);
    await pressButton('Cerrar sesión');
    await act(async () => answerAlert(alert, 'Cerrar sesión'));

    await waitFor(() => screen.getByLabelText('Correo o usuario'), E2E_WAIT).catch(
      async () => findText('Iniciar sesión'),
    );
    expect(await secureStore.getAccessToken()).toBeNull();
    // El refresh quedó revocado en el servidor.
    await secureStore.setTokens({ access: 'token-vencido', refresh: refresh! });
    await expect(authService.fetchCurrentUser()).rejects.toMatchObject({
      kind: 'unauthorized',
    });
    alert.mockRestore();
  }, 60000);
});
