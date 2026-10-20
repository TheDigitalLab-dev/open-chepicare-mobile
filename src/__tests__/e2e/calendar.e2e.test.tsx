/**
 * E2E (app completa + backend real) del calendario:
 *  - el propietario ve una cita y un tratamiento y abre el detalle de la cita;
 *  - agenda una cita desde un día del calendario con la fecha precargada;
 *  - el veterinario entra en "Mis citas" y cambia a "Toda la clínica".
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import {
  E2E_WAIT,
  findText,
  loginThroughUi,
  pressButton,
  renderApp,
} from '@/testing/renderApp';
import * as appointmentsService from '@/services/appointments';
import * as authService from '@/services/auth';
import * as calendarService from '@/services/calendar';
import * as petsService from '@/services/pets';
import {
  WEEKDAY_NAMES,
  isDayInMonth,
  monthGridRange,
  weekdayIndex,
} from '@/utils/calendarGrid';
import { clinicMonth, clinicToday, formatDayLong } from '@/utils/clinicTime';
import { formatDate } from '@/utils/format';
import { shiftMonth } from '@/utils/schedule';
import * as secureStore from '@/utils/secureStore';

let createdId: number | null = null;

afterEach(async () => {
  if (createdId !== null) {
    await authService.login('owner1@example.com', 'password123');
    await appointmentsService
      .cancelAppointment(createdId, 'Prueba e2e calendario')
      .catch(() => undefined);
    createdId = null;
  }
  await secureStore.clearTokens();
});

/** Toca un día de la cuadrícula por su etiqueta accesible. */
async function pressDay(day: string) {
  const prefix = `${WEEKDAY_NAMES[weekdayIndex(day)]} ${formatDayLong(day)},`;
  const cell = await waitFor(
    () => screen.getAllByLabelText(new RegExp(`^${prefix}`)).at(-1)!,
    E2E_WAIT,
  );
  fireEvent.press(cell);
}

/** El asistente se monta encima del calendario: se toca el ÚLTIMO texto. */
async function pressLast(text: string) {
  await findText(text);
  fireEvent.press(screen.getAllByText(text).at(-1)!);
}

async function openOwnerCalendar() {
  fireEvent.press(screen.getAllByText('Citas').at(-1)!);
  await pressButton('Calendario');
  await findText('Mostrar citas canceladas');
}

it('el propietario ve su cita y su tratamiento y abre el detalle de la cita', async () => {
  renderApp();
  await loginThroughUi('owner1@example.com');
  const month = clinicMonth();
  const { events } = await calendarService.getOwnerCalendarEvents(monthGridRange(month));
  const appointment = events.find(
    (e) => e.type === 'appointment' && isDayInMonth(e.start_date, month),
  )!;
  const treatment = events.find(
    (e) => e.type === 'prescription' && isDayInMonth(e.start_date, month),
  )!;
  expect(appointment).toBeDefined();
  expect(treatment).toBeDefined();

  await openOwnerCalendar();
  await findText('Tratamientos'); // leyenda

  await pressDay(treatment.start_date);
  await findText(treatment.title);

  await pressDay(appointment.start_date);
  await findText(appointment.title);
  fireEvent.press(screen.getAllByText(appointment.title).at(-1)!);
  await findText('Detalle de cita');
}, 60000);

it('agenda una cita desde un día del calendario con la fecha precargada', async () => {
  renderApp();
  await loginThroughUi('owner1@example.com');

  // Primer día con agenda desde mañana (en este mes o el siguiente).
  const today = clinicToday();
  const current = clinicMonth();
  const next = shiftMonth(current, 1);
  const [thisMonthDays, nextMonthDays, pets, services] = await Promise.all([
    appointmentsService.getAvailableDays(current.month, current.year),
    appointmentsService.getAvailableDays(next.month, next.year),
    petsService.listPets(),
    appointmentsService.listServices(),
  ]);
  const inThisMonth = thisMonthDays.filter((d) => d > today);
  const day = inThisMonth.at(-1) ?? nextMonthDays[0]!;
  const before = new Set((await appointmentsService.listAppointments()).map((a) => a.id));

  await openOwnerCalendar();
  if (!isDayInMonth(day, current)) await pressButton('Mes siguiente');
  await pressDay(day);
  await pressButton('Nueva cita');
  await findText('Agendar cita');

  await pressLast(pets[0]!.name);
  await pressButton('Siguiente');
  await pressLast(services[0]!.name);
  await pressButton('Siguiente');

  // El día ya viene elegido: se puede seguir sin tocarlo.
  await waitFor(
    () => screen.getByRole('button', { name: formatDate(day), selected: true }),
    E2E_WAIT,
  );
  await pressButton('Siguiente');

  const vets = await appointmentsService.getAvailableVets(day);
  let picked: { vetName: string; time: string } | null = null;
  for (const vet of vets) {
    const slots = await appointmentsService.getAvailableTimeSlots(
      day,
      vet.id,
      services[0]!.id,
    );
    const free = slots.find((s) => s.available);
    if (free) {
      picked = { vetName: `${vet.first_name} ${vet.last_name}`, time: free.time };
      break;
    }
  }
  expect(picked).not.toBeNull();
  await pressLast(picked!.vetName);
  await pressButton('Siguiente');
  await pressLast(picked!.time);
  await pressButton('Confirmar');

  // De vuelta en el calendario (se recarga al volver): la cita nueva está en ese día.
  await waitFor(async () => {
    const now = await appointmentsService.listAppointments();
    const created = now.find((a) => !before.has(a.id));
    expect(created).toBeDefined();
    createdId = created!.id;
  }, E2E_WAIT);
  await findText('Mostrar citas canceladas');
  const created = await appointmentsService.getAppointment(createdId!);
  const title = `${created.service?.name ?? services[0]!.name} · ${created.pet?.name ?? pets[0]!.name}`;
  await findText(title);
}, 90000);

it('el veterinario entra en "Mis citas" y cambia a "Toda la clínica"', async () => {
  const vet = await authService.login('vet@chepicare.com', 'password123');
  const month = clinicMonth();
  const all = await calendarService.getStaffCalendarEvents({
    ...monthGridRange(month),
    vetId: 'all',
    types: ['appointment'],
  });
  const mine = await calendarService.getStaffCalendarEvents({
    ...monthGridRange(month),
    types: ['appointment'],
  });
  // Una cita de otro veterinario cuyo título no coincide con ninguna propia ese día.
  const others = all.events.find(
    (e) =>
      e.type === 'appointment' &&
      e.details.assigned_to?.id !== vet.id &&
      isDayInMonth(e.start_date, month) &&
      !mine.events.some((m) => m.start_date === e.start_date && m.title === e.title),
  )!;
  expect(others).toBeDefined();
  await secureStore.clearTokens();

  renderApp();
  await loginThroughUi('vet@chepicare.com');
  fireEvent.press(await findText('Agenda'));
  await pressButton('Calendario');

  await waitFor(
    () => screen.getByRole('button', { name: 'Mis citas', selected: true }),
    E2E_WAIT,
  );
  await pressDay(others.start_date);
  await waitFor(() => expect(screen.queryByText(others.title)).toBeNull(), E2E_WAIT);

  await pressButton('Toda la clínica');
  await waitFor(
    () => screen.getByRole('button', { name: 'Toda la clínica', selected: true }),
    E2E_WAIT,
  );
  await findText(others.title);
}, 60000);
