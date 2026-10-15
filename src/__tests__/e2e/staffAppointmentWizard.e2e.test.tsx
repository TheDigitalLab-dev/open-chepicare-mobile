/**
 * E2E (app completa + backend real): el personal agenda una cita para el MES
 * SIGUIENTE desde la agenda. Antes el asistente solo pedía los días del mes en
 * curso: a fin de mes quedaban 1–2 días y no había forma de pasar al otro.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import {
  E2E_WAIT,
  findText,
  loginThroughUi,
  pressButton,
  renderApp,
} from '@/testing/renderApp';
import * as adminService from '@/services/admin';
import * as authService from '@/services/auth';
import * as secureStore from '@/utils/secureStore';
import { clinicMonth } from '@/utils/clinicTime';
import { formatDate } from '@/utils/format';
import { shiftMonth } from '@/utils/schedule';

let createdId: number | null = null;

/** La agenda sigue montada debajo del asistente: se toca el ÚLTIMO texto (el del asistente). */
async function pressLast(text: string) {
  await findText(text);
  fireEvent.press(screen.getAllByText(text).at(-1)!);
}

afterEach(async () => {
  if (createdId !== null) {
    await authService.login('admin@chepicare.com', 'password123');
    await adminService.deleteAdminAppointment(createdId).catch(() => undefined);
    createdId = null;
  }
  await secureStore.clearTokens();
});

it('agenda una cita en el mes siguiente', async () => {
  renderApp();
  await loginThroughUi('admin@chepicare.com');
  const next = shiftMonth(clinicMonth(), 1);
  const days = await adminService.getAdminAvailableDays(next.month, next.year);
  expect(days.length).toBeGreaterThan(0);
  const day = days[0]!;
  const before = await adminService.listAdminAppointmentsUntil(`${day}T23:59:59Z`);

  fireEvent.press(await findText('Agenda'));
  await pressButton('Agendar cita');

  // Dueño (búsqueda en el servidor) → mascota → servicio.
  fireEvent.changeText(
    await waitFor(() => screen.getByLabelText('Buscar por nombre, correo o documento')),
    'owner1@example.com',
  );
  await pressLast('owner1@example.com');
  await pressButton('Siguiente');
  await findText(/^Elige la mascota$/i);
  await pressLast('Max');
  await pressButton('Siguiente');
  await findText(/^Elige el servicio$/i);
  const [service] = await adminService.listAdminServices();
  await pressLast(service!.name);
  await pressButton('Siguiente');

  // Día: se pasa al mes siguiente.
  await findText(/^Elige el día$/i);
  await pressButton('Mes siguiente');
  await pressLast(formatDate(day));
  await pressButton('Siguiente');

  // Veterinario → primera hora libre → agendar.
  await findText(/^Elige el veterinario$/i);
  const vets = await adminService.getAdminAvailableVets(day);
  await pressLast(`${vets[0]!.first_name} ${vets[0]!.last_name}`);
  await pressButton('Siguiente');
  await findText(/^Elige la hora$/i);
  const slots = await adminService.getAdminTimeSlots(day, vets[0]!.id, service!.id);
  const free = slots.find((s) => s.available)!;
  await pressLast(free.time);
  await pressButton('Agendar cita');

  await waitFor(async () => {
    const after = await adminService.listAdminAppointmentsUntil(`${day}T23:59:59Z`);
    const created = after.find((a) => !before.some((b) => b.id === a.id));
    expect(created).toBeDefined();
    createdId = created!.id;
  }, E2E_WAIT);
}, 120000);
