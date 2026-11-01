import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { navigationRef } from '@/navigation/navigationRef';
import { E2E_WAIT, loginThroughUi, renderApp } from '@/testing/renderApp';
import { listAdminConsultations } from '@/services/admin';
import * as secureStore from '@/utils/secureStore';

// Adaptador nativo: Expo libera el objeto compartido al desmontar su hook.
// La API Rails y la lógica de grabación de la app siguen siendo reales.
jest.mock('expo-audio', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    RecordingPresets: { HIGH_QUALITY: {} },
    useAudioRecorder: () => {
      const lifetime = React.useRef({ released: false });
      React.useEffect(() => {
        const state = lifetime.current;
        state.released = false;
        return () => {
          state.released = true;
        };
      }, []);
      return React.useMemo(
        () => ({
          get isRecording() {
            if (lifetime.current.released)
              throw new Error('Cannot use shared object that was already released');
            return false;
          },
          stop: async () => undefined,
        }),
        [],
      );
    },
    useAudioRecorderState: () => ({ isRecording: false, durationMillis: 0 }),
  };
});

afterEach(async () => secureStore.clearTokens());

it('identifica paciente y tutor en lista y detalle de consultas con datos reales', async () => {
  renderApp();
  await loginThroughUi('admin@chepicare.com');
  const page = await listAdminConsultations();
  const consultation = page.items.find((item) => item.pet.proprietary)!;
  expect(consultation).toBeDefined();
  const title = `${consultation.pet.name} — ${consultation.anamnesis?.trim() || consultation.diagnosis?.trim() || 'Consulta'}`;
  const owner = `Tutor: ${consultation.pet.proprietary!.full_name}`;
  const navigate = navigationRef.navigate as unknown as (
    name: string,
    params: Record<string, unknown>,
  ) => void;
  act(() => navigate('MoreTab', { screen: 'AdminConsultationsList' }));
  await waitFor(
    () => expect(screen.getAllByText(title).length).toBeGreaterThan(0),
    E2E_WAIT,
  );
  expect(screen.getAllByText(new RegExp(owner)).length).toBeGreaterThan(0);
  fireEvent.press(screen.getAllByText(title)[0]!);
  await waitFor(() => expect(screen.getByText(owner)).toBeTruthy(), E2E_WAIT);
  expect(screen.getByText(title)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Volver' }));
  await waitFor(() => expect(screen.getByText('Consultas')).toBeTruthy(), E2E_WAIT);
}, 120000);
