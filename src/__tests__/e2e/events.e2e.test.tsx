/**
 * E2E (app completa + backend real) de los eventos de la clínica:
 *  - el propietario ve los eventos con cupos, "Cupo completo" en el lleno, se
 *    inscribe con un toque, lo ve en "Mis inscripciones" y cancela;
 *  - el evento en el que está inscrito sale en su calendario con su tipo y,
 *    al tocarlo, abre el detalle del evento;
 *  - el personal (vet/admin) SOLO ve "N inscritos de M": las filas no son
 *    botones, tocarlas no navega y su árbol de navegación no tiene ninguna
 *    pantalla de eventos.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import type { NavigationState, PartialState } from '@react-navigation/native';

import { navigationRef } from '@/navigation/navigationRef';
import {
  answerAlert,
  E2E_WAIT,
  findText,
  loginThroughUi,
  pressButton,
  renderApp,
} from '@/testing/renderApp';
import * as authService from '@/services/auth';
import * as eventsService from '@/services/events';
import { WEEKDAY_NAMES, isDayInMonth, weekdayIndex } from '@/utils/calendarGrid';
import { registeredCountLabel } from '@/utils/clinicEvents';
import { clinicDayKey, clinicMonth, formatDayLong } from '@/utils/clinicTime';
import * as secureStore from '@/utils/secureStore';

/** Inscrito en el seed en la "Jornada" y la "Feria" (llena). */
const OWNER = 'owner1@example.com';
/** Sin inscripciones en el seed: ve la "Feria" como "Cupo completo". */
const NEW_OWNER = 'owner3@example.com';
let createdId: number | null = null;

afterEach(async () => {
  if (createdId !== null) {
    await authService.login(NEW_OWNER, 'password123');
    await eventsService.cancelEventRegistration(createdId).catch(() => undefined);
    createdId = null;
  }
  await secureStore.clearTokens();
});

type AnyState = NavigationState | PartialState<NavigationState>;

/** Todas las pantallas registradas en los navegadores montados. */
function registeredRouteNames(state: AnyState | undefined): string[] {
  if (!state) return [];
  const own = 'routeNames' in state && state.routeNames ? [...state.routeNames] : [];
  const nested = state.routes.flatMap((r) =>
    registeredRouteNames(r.state as AnyState | undefined),
  );
  return [...own, ...nested];
}

/** Visita cada pestaña para que se monte su stack y devuelve sus pantallas. */
async function routeNamesOfAllTabs(tabLabels: string[]): Promise<string[]> {
  for (const label of tabLabels) {
    fireEvent.press(screen.getAllByText(label).at(-1)!);
    await act(async () => undefined);
  }
  return registeredRouteNames(navigationRef.getRootState());
}

async function openOwnerEvents() {
  await pressButton('Eventos');
  await findText('Mis inscripciones');
}

it('el propietario ve cupos, se inscribe con un toque y cancela desde Mis inscripciones', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  await authService.login(NEW_OWNER, 'password123');
  const { events } = await eventsService.listOwnerEvents();
  const full = events.find((e) => e.is_full && !e.my_registration)!;
  // El último abierto: el test del servicio (mismo propietario) usa el primero.
  const open = events.findLast((e) => e.registration_open && !e.my_registration)!;
  await secureStore.clearTokens();

  renderApp();
  await loginThroughUi(NEW_OWNER);
  await openOwnerEvents();
  await findText(full.title);
  await findText(open.title);
  await findText('Cupo completo');

  // Evento lleno: no acepta inscripciones.
  fireEvent.press(screen.getAllByText(full.title).at(-1)!);
  await findText('Cupo completo: ya no se aceptan inscripciones.');
  expect(screen.queryByRole('button', { name: 'Inscribirme' })).toBeNull();
  const fullButton = screen.getByRole('button', { name: 'Cupo completo' });
  expect(fullButton).toBeDisabled();
  await pressButton('Volver');

  // Evento con cupo: inscripción de un toque.
  await findText(open.title);
  fireEvent.press(screen.getAllByText(open.title).at(-1)!);
  await pressButton('Inscribirme');
  await findText('Estás inscrito en este evento.');
  const { event: afterRegister } = await eventsService.getOwnerEvent(open.id);
  createdId = afterRegister.my_registration!.id;
  await findText(
    registeredCountLabel(afterRegister.registered_count, afterRegister.capacity),
  );

  // Mis inscripciones → cancelar.
  await pressButton('Mis inscripciones');
  await waitFor(
    () => screen.getByRole('button', { name: `Cancelar inscripción en ${open.title}` }),
    E2E_WAIT,
  );
  fireEvent.press(
    screen.getByRole('button', { name: `Cancelar inscripción en ${open.title}` }),
  );
  await act(async () => answerAlert(alert, 'Sí, cancelar'));
  await findText('Cancelada');
  const { event: afterCancel } = await eventsService.getOwnerEvent(open.id);
  expect(afterCancel.my_registration).toBeNull();
  createdId = null;
  alert.mockRestore();
}, 90000);

it('el evento inscrito sale en el calendario del propietario y abre su detalle', async () => {
  await authService.login(OWNER, 'password123');
  const { events } = await eventsService.listOwnerEvents();
  const mine =
    events.find((e) => e.my_registration && !e.is_full) ??
    events.find((e) => e.my_registration)!;
  await secureStore.clearTokens();
  const day = clinicDayKey(mine.starts_at);

  renderApp();
  await loginThroughUi(OWNER);
  fireEvent.press(screen.getAllByText('Citas').at(-1)!);
  await pressButton('Calendario');
  await findText('Eventos de la clínica'); // leyenda con el nuevo tipo
  if (!isDayInMonth(day, clinicMonth())) await pressButton('Mes siguiente');

  const prefix = `${WEEKDAY_NAMES[weekdayIndex(day)]} ${formatDayLong(day)},`;
  const cell = await waitFor(
    () =>
      screen.getAllByLabelText(new RegExp(`^${prefix}.*eventos de la clínica`)).at(-1)!,
    E2E_WAIT,
  );
  fireEvent.press(cell);
  await findText(mine.title);
  fireEvent.press(screen.getAllByText(mine.title).at(-1)!);
  await findText('Estás inscrito en este evento.');

  // Positivo de control: el árbol del propietario sí tiene las pantallas de eventos.
  const names = registeredRouteNames(navigationRef.getRootState());
  expect(names).toEqual(expect.arrayContaining(['OwnerEvents', 'OwnerEventDetail']));
}, 90000);

it.each(['vet@chepicare.com', 'admin@chepicare.com'])(
  'el personal (%s) solo ve "N inscritos de M", sin abrir ni gestionar eventos',
  async (login) => {
    await authService.login(login, 'password123');
    const { events } = await eventsService.getStaffEventsSummary();
    await secureStore.clearTokens();
    const first = events[0]!;

    renderApp();
    await loginThroughUi(login);
    await findText('EVENTOS PRÓXIMOS');
    await findText(first.title);
    await findText(registeredCountLabel(first.registered_count, first.capacity));

    // Ninguna fila de evento es un botón (ni tiene rol de botón accesible).
    const row = screen.getByTestId(`staff-event-${first.id}`);
    expect(row.props.accessibilityRole).toBeUndefined();
    expect(row.props.onPress).toBeUndefined();
    for (const e of events) {
      expect(
        screen.queryAllByRole('button', {
          name: new RegExp(e.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        }),
      ).toHaveLength(0);
    }

    // Tocar la fila o el título no navega: sigue en Inicio.
    const before = navigationRef.getCurrentRoute()?.name;
    fireEvent.press(row);
    fireEvent.press(screen.getAllByText(first.title).at(-1)!);
    await act(async () => undefined);
    expect(navigationRef.getCurrentRoute()?.name).toBe(before);
    expect(before).toBe('AdminDashboard');

    // El árbol del personal no tiene ninguna pantalla de eventos.
    const names = await routeNamesOfAllTabs(['Pacientes', 'Agenda', 'Más', 'Inicio']);
    expect(names).toEqual(expect.arrayContaining(['AdminDashboard', 'AdminCalendar']));
    expect(names.filter((n) => /event/i.test(n))).toEqual([]);
  },
  90000,
);
