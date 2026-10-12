/**
 * Servicio de Pagos (owner) contra el backend real `../pawcare-web`.
 * Controller JSON: owner_payments (index/show/register). Requiere Owner (Bearer).
 */
import type { Payment, PaymentMethod } from '@/types/models';
import { api } from './api';

export interface PaymentFilters {
  status?: string;
  overdue?: boolean;
  search?: string;
}

export interface RegisterPaymentInput {
  payment_method: PaymentMethod;
  paid_at?: string;
  transaction_id?: string;
  provider?: string;
  payment_reference?: string;
  notes?: string;
}

export async function listPayments(filters: PaymentFilters = {}): Promise<Payment[]> {
  const { payments } = await api.get<{ payments: Payment[] }>('/owner-payments-list', {
    params: {
      status: filters.status,
      overdue: filters.overdue ? 'true' : undefined,
      search: filters.search,
    },
  });
  return payments;
}

export async function getPayment(id: number): Promise<Payment> {
  const { payment } = await api.get<{ payment: Payment }>(`/owner-payments/${id}`);
  return payment;
}

export async function registerPayment(
  id: number,
  input: RegisterPaymentInput,
): Promise<Payment> {
  const { payment } = await api.post<{ payment: Payment }>(
    `/owner-payments/${id}/register`,
    input,
  );
  return payment;
}
