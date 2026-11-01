import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { navigationRef } from '@/navigation/navigationRef';
import {
  E2E_WAIT,
  findText,
  loginThroughUi,
  pressButton,
  renderApp,
} from '@/testing/renderApp';
import * as admin from '@/services/admin';
import * as auth from '@/services/auth';
import { clearTokens } from '@/utils/secureStore';
import { cleanupClinicalConsultation } from '@/testing/medicalData';

let created: number | undefined;
afterEach(async () => {
  if (created !== undefined) {
    await auth.login('vet@chepicare.com', 'password123');
    await cleanupClinicalConsultation(created);
  }
  await clearTokens();
});

it('registra desde la app los datos clínicos y los cuatro bloques de la web', async () => {
  renderApp();
  await loginThroughUi('vet@chepicare.com');
  const navigate = navigationRef.navigate as unknown as (
    name: string,
    params: Record<string, unknown>,
  ) => void;
  act(() => navigate('MoreTab', { screen: 'AdminConsultationForm' }));
  const motivo = `Control clínico ${Date.now()}`;
  fireEvent.changeText(
    await waitFor(() => screen.getByLabelText('Buscar paciente por nombre'), E2E_WAIT),
    'Max',
  );
  await pressButton('Max');
  fireEvent.changeText(screen.getByLabelText('Motivo de consulta / Anamnesis'), motivo);
  fireEvent.changeText(screen.getByLabelText('Diagnóstico'), 'Control');
  fireEvent.changeText(screen.getByLabelText('Frecuencia cardíaca (lpm)'), '80');
  fireEvent.changeText(screen.getByLabelText('Frecuencia respiratoria (rpm)'), '20');
  await pressButton('Receta');
  await pressButton('Añadir medicamento');
  fireEvent.changeText(screen.getByLabelText('Medicamento'), 'Medicación de integración');
  fireEvent.changeText(screen.getByLabelText('Dosis del medicamento'), '1 ml');
  fireEvent.changeText(screen.getByLabelText('Frecuencia'), 'Cada 12 horas');
  await pressButton('Exámenes');
  await pressButton('Solicitar examen');
  fireEvent.changeText(
    screen.getByLabelText('Nombre del examen'),
    'Hemograma de integración',
  );
  await pressButton('Vacunas');
  await pressButton('Registrar vacuna');
  fireEvent.changeText(
    screen.getByLabelText('Nombre de la vacuna'),
    'Vacuna de integración',
  );
  await pressButton('Desparasitación');
  await pressButton('Registrar desparasitación');
  fireEvent.changeText(
    screen.getByLabelText('Desparasitante'),
    'Desparasitante de integración',
  );
  await pressButton('Ambos');
  await pressButton('Registrar consulta');
  await waitFor(async () => {
    const consultation = (await admin.listAdminConsultations()).items.find(
      (item) => item.anamnesis === motivo,
    );
    expect(consultation).toBeDefined();
    created = consultation!.id;
  }, E2E_WAIT);
  await findText(`Max — ${motivo}`);
  const detail = await admin.getAdminConsultation(created!);
  expect(detail.heart_rate).toBe(80);
  expect(detail.respiratory_rate).toBe(20);
  expect(detail.prescriptions).toHaveLength(1);
  expect(detail.lab_exams[0]!.status).toBe('pending');
  expect(detail.vaccinations_in_consultation).toHaveLength(1);
  expect(detail.dewormings_in_consultation![0]!.parasite_type).toBe('both');
}, 60000);
