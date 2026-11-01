import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { navigationRef } from '@/navigation/navigationRef';
import { E2E_WAIT, loginThroughUi, pressButton, renderApp } from '@/testing/renderApp';
import { fetchAllPages } from '@/services/pagination';
import { api } from '@/services/api';
import type { StaffVaccination } from '@/types/models';
import { clearTokens } from '@/utils/secureStore';

let created: number | undefined;
afterEach(async () => {
  if (created !== undefined) await api.delete(`/admin/vaccinations/${created}`);
  await clearTokens();
});

it('registra una vacuna independiente con el tipo que exige el controlador', async () => {
  renderApp();
  await loginThroughUi('vet@chepicare.com');
  const navigate = navigationRef.navigate as unknown as (
    name: string,
    params: Record<string, unknown>,
  ) => void;
  act(() => navigate('MoreTab', { screen: 'AdminVaccinationForm' }));
  const name = `Vacuna integración ${Date.now()}`;
  fireEvent.changeText(
    await waitFor(() => screen.getByLabelText('Buscar paciente por nombre'), E2E_WAIT),
    'Max',
  );
  await pressButton('Max');
  await pressButton('Antirrábica');
  fireEvent.changeText(screen.getByLabelText('Nombre de la vacuna'), name);
  await pressButton('Registrar vacuna');
  await waitFor(async () => {
    const found = (
      await fetchAllPages<'vaccinations', StaffVaccination>(
        '/admin/vaccinations-list',
        'vaccinations',
        { pet_id: 1 },
      )
    ).find((record) => record.vaccine_name === name);
    expect(found).toBeDefined();
    created = found!.id;
    expect(found!.vaccine_type).toBe('rabies');
  }, E2E_WAIT);
}, 30000);
