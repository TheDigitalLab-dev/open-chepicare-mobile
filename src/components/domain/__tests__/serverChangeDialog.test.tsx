/**
 * Diálogo de cambio de servidor: muestra ambos servidores y la explicación, y
 * sus botones solo avisan (la lógica vive en `useServerChange`).
 */
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ServerChangeDialog } from '@/components/domain';
import { ThemeProvider } from '@/theme';

const change = {
  currentUrl: 'https://clinica-a.example.com',
  targetUrl: 'https://clinica-b.example.com',
  currentClinicName: 'Clínica Huellitas',
  hasSession: true,
};

function renderDialog(props: Partial<Parameters<typeof ServerChangeDialog>[0]> = {}) {
  const onCancel = jest.fn();
  const onConfirm = jest.fn();
  render(
    <ThemeProvider>
      <ServerChangeDialog
        change={change}
        leaving={false}
        onCancel={onCancel}
        onConfirm={onConfirm}
        {...props}
      />
    </ThemeProvider>,
  );
  return { onCancel, onConfirm };
}

describe('ServerChangeDialog', () => {
  it('explica el cambio y deja elegir', () => {
    const { onCancel, onConfirm } = renderDialog();

    expect(screen.getByRole('header', { name: '¿Cambiar de servidor?' })).toBeTruthy();
    expect(
      screen.getByText('Clínica Huellitas (https://clinica-a.example.com)'),
    ).toBeTruthy();
    expect(screen.getByText('https://clinica-b.example.com')).toBeTruthy();
    expect(screen.getByText(/se cerrará tu sesión en este teléfono/)).toBeTruthy();
    expect(screen.getByText('Hazlo solo si te lo indicó tu clínica.')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    fireEvent.press(
      screen.getByRole('button', {
        name: 'Cambiar de servidor y cerrar la sesión actual',
      }),
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('mientras cierra la sesión no se puede cancelar', () => {
    const { onCancel } = renderDialog({ leaving: true });
    fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('sin cambio pendiente no muestra nada', () => {
    renderDialog({ change: null });
    expect(screen.queryByText('¿Cambiar de servidor?')).toBeNull();
  });
});
