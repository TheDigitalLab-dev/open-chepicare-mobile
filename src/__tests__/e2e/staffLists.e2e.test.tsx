/**
 * E2E (app completa + backend real): listas del personal. Antes de la revisión
 * Pagos mostraba solo los 25 pagos más recientes (sin forma de ver más), el
 * filtro «Vencidos» filtraba esos 25 en el teléfono, el detalle de un pago más
 * antiguo decía «Pago no encontrado» y la agenda pedía las 100 citas más
 * ANTIGUAS de la historia.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { FlatList } from 'react-native';

import { navigationRef } from '@/navigation/navigationRef';
import { E2E_WAIT, findText, loginThroughUi, renderApp } from '@/testing/renderApp';
import * as adminService from '@/services/admin';
import { PAGE_SIZE } from '@/services/pagination';
import * as secureStore from '@/utils/secureStore';
import { formatDateTime, formatMoney } from '@/utils/format';
import { APPOINTMENT_STATUS_LABEL, type Payment } from '@/types/models';

afterEach(async () => {
  await secureStore.clearTokens();
});

function paymentsListData(): Payment[] {
  const list = screen.UNSAFE_getByProps({ testID: 'admin-payments-list' });
  return (list.props as { data: Payment[] }).data;
}

/** El usuario llega al final de la lista (FlatList dispara `onEndReached`). */
function scrollToEnd() {
  const list = screen
    .UNSAFE_getAllByType(FlatList)
    .find((l) => (l.props as { testID?: string }).testID === 'admin-payments-list')!;
  (list.props as { onEndReached: () => void }).onEndReached();
}

it('Pagos: scroll infinito, «Vencidos» del servidor y detalle de un pago antiguo', async () => {
  renderApp();
  await loginThroughUi('admin@chepicare.com');
  const firstPage = await adminService.listAdminPayments({}, 1);
  expect(firstPage.total).toBeGreaterThan(PAGE_SIZE);

  fireEvent.press(await findText('Más'));
  fireEvent.press(await findText('Pagos'));
  await waitFor(() => expect(paymentsListData()).toHaveLength(PAGE_SIZE), E2E_WAIT);

  // Al llegar al final se carga la página 2.
  await act(async () => scrollToEnd());
  await waitFor(
    () =>
      expect(paymentsListData().length).toBe(Math.min(PAGE_SIZE * 2, firstPage.total)),
    E2E_WAIT,
  );
  const older = paymentsListData()[PAGE_SIZE]!;

  // «Vencidos»: el servidor incluye los pendientes con la fecha pasada.
  const overdue = await adminService.listAdminPayments({ overdue: true }, 1);
  fireEvent.press(screen.getByText('Vencidos'));
  await waitFor(
    () =>
      expect(paymentsListData().map((p) => p.id)).toEqual(overdue.items.map((p) => p.id)),
    E2E_WAIT,
  );

  // Detalle de un pago fuera de la primera página: se carga por id. (La fila
  // está fuera de la ventana virtualizada de FlatList en Jest, sin layout; se
  // abre con la misma ruta que su `onPress`.)
  const navigate = navigationRef.navigate as unknown as (
    name: string,
    params: Record<string, unknown>,
  ) => void;
  await act(async () =>
    navigate('MoreTab', { screen: 'AdminPaymentDetail', params: { id: older.id } }),
  );
  await findText('Detalle de pago');
  await findText(formatMoney(older.amount, older.currency));
  expect(screen.queryByText('Pago no encontrado')).toBeNull();
}, 120000);

it('Agenda: «Próximas» desde hoy y «Pasadas» con la más reciente primero', async () => {
  renderApp();
  await loginThroughUi('admin@chepicare.com');
  const [upcoming, past] = await Promise.all([
    adminService.listAdminAppointments({ scope: 'upcoming' }, 1),
    adminService.listAdminAppointments({ scope: 'past' }, 1),
  ]);
  const label = (a: (typeof past.items)[number]) =>
    `${a.pet?.name ?? 'Mascota'}, ${formatDateTime(a.scheduled_at, a.time_zone)}, ${APPOINTMENT_STATUS_LABEL[a.status]}`;

  fireEvent.press(await findText('Agenda'));
  await findText('Próximas');
  if (upcoming.items[0]) {
    await waitFor(() => screen.getByLabelText(label(upcoming.items[0]!)), E2E_WAIT);
  }

  fireEvent.press(screen.getByText('Pasadas'));
  await waitFor(() => screen.getByLabelText(label(past.items[0]!)), E2E_WAIT);
}, 120000);
