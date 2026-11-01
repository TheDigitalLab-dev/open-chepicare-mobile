import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { navigationRef } from '@/navigation/navigationRef';
import { E2E_WAIT, renderApp } from '@/testing/renderApp';
import { clearTokens } from '@/utils/secureStore';

afterEach(clearTokens);

it('explica que un enlace de recuperación inválido no sirve, sin atribuirlo a una sesión', async () => {
  renderApp();
  await waitFor(() => screen.getByRole('button', { name: 'Iniciar sesión' }), E2E_WAIT);
  const navigate = navigationRef.navigate as unknown as (
    name: string,
    params: Record<string, unknown>,
  ) => void;
  act(() =>
    navigate('Auth', {
      screen: 'ResetPassword',
      params: { token: 'qa-invalid-reset-token' },
    }),
  );
  await waitFor(() => screen.getByLabelText('Nueva contraseña'), E2E_WAIT);
  fireEvent.changeText(
    screen.getByLabelText('Nueva contraseña'),
    'InvalidQaPassword123!',
  );
  fireEvent.changeText(
    screen.getByLabelText('Confirmar contraseña'),
    'InvalidQaPassword123!',
  );
  fireEvent.press(screen.getByRole('button', { name: 'Restablecer contraseña' }));
  await waitFor(
    () =>
      expect(
        screen.getByText(
          'El enlace de recuperación no es válido o venció. Solicita uno nuevo.',
        ),
      ).toBeTruthy(),
    E2E_WAIT,
  );
  expect(screen.queryByText('Tu sesión expiró. Inicia sesión nuevamente.')).toBeNull();
}, 30000);
