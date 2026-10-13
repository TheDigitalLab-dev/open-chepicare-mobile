/**
 * Integración REAL del servicio de Pagos contra `../open-chepicare-web`.
 */
import * as authService from '@/services/auth';
import * as paymentsService from '@/services/payments';
import * as secureStore from '@/utils/secureStore';

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

describe('paymentsService', () => {
  it('lista los pagos reales del owner', async () => {
    const payments = await paymentsService.listPayments();
    expect(Array.isArray(payments)).toBe(true);
    if (payments.length > 0) {
      expect(payments[0]).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          status: expect.any(String),
          amount: expect.any(Number),
        }),
      );
    }
  });

  it('obtiene el detalle de un pago con sus ítems', async () => {
    const payments = await paymentsService.listPayments();
    if (payments.length === 0) return;
    const detail = await paymentsService.getPayment(payments[0]!.id);
    expect(detail.id).toBe(payments[0]!.id);
    expect(detail).toHaveProperty('currency');
  });

  it('filtra por estado pendiente', async () => {
    const pending = await paymentsService.listPayments({ status: 'pending' });
    expect(pending.every((p) => p.status === 'pending')).toBe(true);
  });
});
