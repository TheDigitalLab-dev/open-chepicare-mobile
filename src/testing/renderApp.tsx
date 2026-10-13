/**
 * Monta la app COMPLETA (los mismos proveedores y navegador que `App.tsx`) para
 * los recorridos e2e con React Native Testing Library contra el backend real.
 * Sin emulador: es el árbol de React Native de verdad en el entorno de Jest.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/theme';
import { SessionProvider } from '@/session/SessionProvider';
import { AssistantProvider } from '@/session/AssistantProvider';
import { RootNavigator } from '@/navigation/RootNavigator';

/** Pantalla de un teléfono de 390 × 844 (sin muescas). */
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** Plazo de las esperas: cada pantalla pide datos reales al backend. */
export const E2E_WAIT = { timeout: 15000 };

export function renderApp() {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ThemeProvider initialPreference="light">
        <SessionProvider>
          <AssistantProvider>
            <RootNavigator />
          </AssistantProvider>
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

/** Espera a que aparezca un texto (exacto o regex) en pantalla. */
export async function findText(text: string | RegExp) {
  return waitFor(() => screen.getAllByText(text)[0]!, E2E_WAIT);
}

/** Inicia sesión desde la pantalla de acceso (la app arranca en Auth). */
export async function loginThroughUi(email: string, password = 'password123') {
  fireEvent.press(
    await waitFor(() => screen.getByRole('button', { name: 'Iniciar sesión' }), E2E_WAIT),
  );
  await waitFor(() => screen.getByLabelText('Correo o usuario'), E2E_WAIT);
  fireEvent.changeText(screen.getByLabelText('Correo o usuario'), email);
  fireEvent.changeText(screen.getByLabelText('Contraseña'), password);
  fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));
  // Panel del propietario montado.
  await waitFor(() => screen.getByText(/^Hola,/), E2E_WAIT);
}

/** Pulsa el botón accesible con ese nombre cuando aparezca. */
export async function pressButton(name: string | RegExp) {
  const button = await waitFor(
    () => screen.getAllByRole('button', { name })[0]!,
    E2E_WAIT,
  );
  fireEvent.press(button);
}

/**
 * Responde a un `Alert.alert` nativo (diálogo del sistema) pulsando el botón
 * con ese texto: es el único "toque" que no pasa por el árbol de React.
 */
export function answerAlert(spy: jest.SpyInstance, buttonText: string) {
  const call = spy.mock.calls.at(-1) as [
    string,
    string,
    { text: string; onPress?: () => void }[],
  ];
  const button = call[2].find((b) => b.text === buttonText);
  if (!button?.onPress) throw new Error(`El diálogo no tiene el botón "${buttonText}"`);
  button.onPress();
}
