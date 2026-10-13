/**
 * E2E (app completa + backend real): ciclo completo de una cita del propietario
 * por pantallas — agendar con el asistente (horarios del servidor), ver el
 * detalle con su pago, confirmar, reprogramar y cancelar.
 */
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { Alert } from 'react-native';

import {
  E2E_WAIT,
  answerAlert,
  findText,
  loginThroughUi,
  pressButton,
  renderApp,
} from '@/testing/renderApp';
import * as appointmentsService from '@/services/appointments';
import * as petsService from '@/services/pets';
import * as secureStore from '@/utils/secureStore';
import { clinicHourKey, clinicMonth } from '@/utils/clinicTime';
import { formatDate, formatDateTime } from '@/utils/format';
import { shiftMonth } from '@/utils/schedule';

let createdId: number | null = null;

afterEach(async () => {
  // Una cita pendiente que quede ocupa el hueco en las siguientes ejecuciones.
  if (createdId !== null) {
    await appointmentsService
      .cancelAppointment(createdId, 'Limpieza e2e')
      .catch(() => undefined);
    createdId = null;
  }
  await secureStore.clearTokens();
});

it('agenda, confirma, reprograma y cancela una cita desde la app', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  renderApp();
  await loginThroughUi('owner1@example.com');

  // Datos reales para saber qué elegir en cada paso.
  const next = shiftMonth(clinicMonth(), 1);
  const [pets, services, days] = await Promise.all([
    petsService.listPets(),
    appointmentsService.listServices(),
    appointmentsService.getAvailableDays(next.month, next.year),
  ]);
  const day = days[2] ?? days[0]!;
  const before = new Set((await appointmentsService.listAppointments()).map((a) => a.id));

  fireEvent.press(screen.getAllByText('Citas').at(-1)!);
  await pressButton('Agendar cita');

  // 1. Mascota · 2. Servicio
  fireEvent.press(await findText(pets[0]!.name));
  await pressButton('Siguiente');
  fireEvent.press(await findText(services[0]!.name));
  await pressButton('Siguiente');

  // 3. Día: el mes actual no deja ir atrás; se avanza al siguiente.
  expect(await findText(/\d{4}$/)).toBeTruthy();
  await pressButton('Mes siguiente');
  fireEvent.press(await findText(formatDate(day)));
  await pressButton('Siguiente');

  // 4. Veterinario (agrupado: un solo renglón por veterinario)
  const vets = await appointmentsService.getAvailableVets(day);
  const vetName = `${vets[0]!.first_name} ${vets[0]!.last_name}`;
  await waitFor(() => expect(screen.getAllByText(vetName)).toHaveLength(1), E2E_WAIT);
  fireEvent.press(screen.getByText(vetName));
  await pressButton('Siguiente');

  // 5. Hora: solo horarios libres del servidor, y notas con teclado de texto.
  const slots = await appointmentsService.getAvailableTimeSlots(
    day,
    vets[0]!.id,
    services[0]!.id,
  );
  const first = slots[0]!.time;
  fireEvent.press(await findText(first!));
  const notes = screen.getByLabelText('Notas (opcional)');
  expect(notes.props.keyboardType).toBe('default');
  fireEvent.changeText(notes, 'Agendada desde el e2e');
  await pressButton('Confirmar');

  // De vuelta en la lista: la cita nueva aparece como pendiente.
  await waitFor(async () => {
    const now = await appointmentsService.listAppointments();
    const created = now.find((a) => !before.has(a.id));
    expect(created).toBeDefined();
    createdId = created!.id;
  }, E2E_WAIT);
  const created = await appointmentsService.getAppointment(createdId!);
  expect(clinicHourKey(created.scheduled_at, created.time_zone)).toBe(first);
  expect(created.notes).toBe('Agendada desde el e2e');

  const cardLabel = `${created.pet!.name}, ${formatDateTime(created.scheduled_at, created.time_zone)}, Pendiente`;
  await pressButton(cardLabel);

  // Detalle: el pago pendiente creado al agendar, con acceso a registrarlo.
  await findText('Detalle de cita');
  await findText(/^pagos$/i);
  expect(screen.queryByText(/\.0$/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Registrar pago' })).toBeTruthy();

  // Confirmar
  await pressButton('Confirmar');
  await findText('Confirmada');

  // Reprogramar: el asistente llega precargado; se cambia la hora.
  await pressButton('Reprogramar');
  await findText('Reprogramar cita');
  for (let i = 0; i < 4; i += 1) await pressButton('Siguiente');
  // Un horario libre AHORA (la propia cita ocupa el suyo según su duración).
  const freeNow = await appointmentsService.getAvailableTimeSlots(
    day,
    vets[0]!.id,
    services[0]!.id,
  );
  const second = freeNow.find((s) => s.time !== first)!.time;
  // Su horario actual se sigue ofreciendo al reprogramar.
  await findText(first);
  fireEvent.press(await findText(second));
  await pressButton('Guardar cambios');

  await waitFor(async () => {
    const moved = await appointmentsService.getAppointment(createdId!);
    expect(clinicHourKey(moved.scheduled_at, moved.time_zone)).toBe(second);
  }, E2E_WAIT);
  const moved = await appointmentsService.getAppointment(createdId!);
  // El detalle se recarga al volver: muestra la hora nueva.
  await findText(formatDateTime(moved.scheduled_at, moved.time_zone));

  // Cancelar (diálogo nativo de confirmación)
  await pressButton('Cancelar cita');
  await act(async () => answerAlert(alert, 'Sí, cancelar'));
  await findText('Cancelada');
  const cancelled = await appointmentsService.getAppointment(createdId!);
  expect(cancelled.status).toBe('cancelled');
  createdId = null;
  // Una cita cancelada ya no ofrece acciones.
  expect(screen.queryByRole('button', { name: 'Reprogramar' })).toBeNull();
  expect(within(screen.root).queryByRole('button', { name: 'Cancelar cita' })).toBeNull();
  alert.mockRestore();
}, 120000);
