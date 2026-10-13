/**
 * E2E (app completa + backend real): mascotas e historia clínica del
 * propietario. Lista (solo las suyas), ficha, perfil médico, vacunas,
 * consultas, detalle y exámenes de laboratorio con sus resultados (JSON: antes
 * rompían la pantalla).
 */
import { fireEvent, screen } from '@testing-library/react-native';

import { findText, loginThroughUi, pressButton, renderApp } from '@/testing/renderApp';
import * as medicalService from '@/services/medical';
import * as secureStore from '@/utils/secureStore';

afterEach(async () => {
  await secureStore.clearTokens();
});

it('recorre mascotas, perfil médico, consultas y exámenes de laboratorio', async () => {
  renderApp();
  await loginThroughUi('owner1@example.com');

  fireEvent.press(screen.getAllByText('Mascotas').at(-1)!);
  await findText('Max');
  expect(screen.getByText('Luna')).toBeTruthy();
  // Rocky es de owner2: nunca aparece en la lista de owner1.
  expect(screen.queryByText('Rocky')).toBeNull();

  fireEvent.press(screen.getByText('Max'));
  await pressButton('Tratamientos');
  await findText(/Tratamientos/);
  fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

  // Perfil médico
  await pressButton('Perfil médico');
  await findText(/Perfil médico/);
  fireEvent.press(screen.getByRole('button', { name: 'Volver' }));

  // Consultas → detalle → exámenes
  const consultations = await medicalService.listConsultations(1);
  const withExams = consultations.find((c) => c.diagnosis === 'Gastroenteritis leve')!;
  await pressButton('Consultas');
  fireEvent.press(await findText('Gastroenteritis leve'));
  await findText('Diagnóstico');
  await pressButton(`Ver exámenes de laboratorio (${withExams.lab_exams.length})`);
  await findText('Hemograma completo (CBC)');
  await findText(/Globulos rojos: 6\.8 x10\^12\/L/);
  expect(screen.getByText('Completado')).toBeTruthy();
}, 120000);
