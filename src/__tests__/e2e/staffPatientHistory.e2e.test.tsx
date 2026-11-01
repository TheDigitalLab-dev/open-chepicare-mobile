import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { navigationRef } from '@/navigation/navigationRef';
import { E2E_WAIT, findText, loginThroughUi, renderApp } from '@/testing/renderApp';
import { getAdminPet, getAdminPatientHistory, listAdminPets } from '@/services/admin';
import { clearTokens } from '@/utils/secureStore';

afterEach(clearTokens);

it('muestra tutor y contacto, y abre el historial real del paciente desde su ficha', async () => {
  renderApp();
  await loginThroughUi('admin@chepicare.com');
  const pet = await getAdminPet(
    (await listAdminPets()).find((item) => item.name === 'Max')!.id,
  );
  expect(pet.proprietary?.full_name).toBeTruthy();
  const navigate = navigationRef.navigate as unknown as (
    name: string,
    params: Record<string, unknown>,
  ) => void;
  act(() =>
    navigate('PatientsTab', { screen: 'AdminPetDetail', params: { id: pet.id } }),
  );
  await findText(pet.proprietary!.full_name!);
  expect(screen.getByText(pet.proprietary!.email)).toBeTruthy();
  if (pet.proprietary!.phone)
    expect(screen.getByText(pet.proprietary!.phone)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Historia médica' }));
  await waitFor(() => expect(screen.getByText('CONSULTAS')).toBeTruthy(), E2E_WAIT);
  expect(screen.getByText(pet.proprietary!.full_name!)).toBeTruthy();
  expect(screen.getByText(pet.proprietary!.email)).toBeTruthy();
  if (pet.proprietary!.phone)
    expect(screen.getByText(pet.proprietary!.phone)).toBeTruthy();
  if (pet.proprietary!.identity_document)
    expect(screen.getByText(pet.proprietary!.identity_document)).toBeTruthy();
  expect(screen.getByText('VACUNAS')).toBeTruthy();
  expect(screen.getByText('DESPARASITACIONES')).toBeTruthy();
  expect(screen.getByText('INFORMES')).toBeTruthy();
  const report = (await getAdminPatientHistory(pet.id)).reports[0]!;
  expect(report).toBeDefined();
  fireEvent.press(screen.getByText(report.title));
  await findText(`${pet.name} — ${report.title}`);
  expect(screen.getByText(`Tutor: ${pet.proprietary!.full_name}`)).toBeTruthy();
}, 120000);
