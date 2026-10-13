/**
 * E2E (app completa + backend real): pagos del propietario. Lista con filtros,
 * registro de un pago pendiente por transferencia y resumen de un pago ya
 * pagado (abierto tocando la push "Pago confirmado").
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';

import {
  E2E_WAIT,
  findText,
  loginThroughUi,
  pressButton,
  renderApp,
} from '@/testing/renderApp';
import { bookFreshAppointment } from '@/testing/ownerData';
import * as appointmentsService from '@/services/appointments';
import * as paymentsService from '@/services/payments';
import * as secureStore from '@/utils/secureStore';
import { formatDate, formatMoney } from '@/utils/format';

const tap = (Notifications as unknown as { __tapNotification: (d: object) => void })
  .__tapNotification;

let appointmentId: number | null = null;

afterEach(async () => {
  if (appointmentId !== null) {
    await appointmentsService
      .cancelAppointment(appointmentId, 'Limpieza e2e')
      .catch(() => undefined);
    appointmentId = null;
  }
  await secureStore.clearTokens();
});

it('registra un pago pendiente por transferencia y luego ve su resumen', async () => {
  renderApp();
  await loginThroughUi('owner1@example.com');

  const appointment = await bookFreshAppointment();
  appointmentId = appointment.id;
  const payment = (await appointmentsService.getAppointment(appointment.id))
    .payments![0]!;
  const full = await paymentsService.getPayment(payment.id);

  // Inicio → Pagos (todas las páginas: el seed deja más de 25 con las nuevas).
  await pressButton('Pagos');
  await findText('Todos');
  fireEvent.press(screen.getByText('Pendientes'));
  const concept = full.pet_name ?? 'Pago';
  const amount = formatMoney(full.amount, full.currency);
  await pressButton(
    `Registrar pago: ${concept}, ${amount}, Vence: ${formatDate(full.due_date)}`,
  );

  // Formulario: método, referencia (teclado de texto) y registro.
  await findText(/^método de pago$/i);
  fireEvent.press(screen.getByText('Transferencia'));
  const reference = screen.getByLabelText('Referencia');
  expect(reference.props.keyboardType).toBe('default');
  fireEvent.changeText(reference, 'E2E-REF-001');
  await pressButton('Registrar pago');

  await waitFor(async () => {
    const after = await paymentsService.getPayment(payment.id);
    expect(after.status).toBe('completed');
    expect(after.payment_method).toBe('transfer');
    expect(after.payment_reference).toBe('E2E-REF-001');
  }, E2E_WAIT);

  // Tocar la push "Pago confirmado" abre el pago: ya no ofrece el formulario.
  await act(async () =>
    tap({
      category: 'pagos',
      entity: 'payment',
      entity_id: payment.id,
      event_key: `payment-${payment.id}-completed`,
    }),
  );
  await findText(/^Pagado el /);
  expect(screen.queryByText(/^método de pago$/i)).toBeNull();
}, 120000);
