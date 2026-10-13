/**
 * Integración REAL: los índices del backend paginan (25 por defecto). Las
 * listas del propietario no pueden quedarse con la primera página.
 */
import * as authService from '@/services/auth';
import { fetchAllPages } from '@/services/pagination';
import * as paymentsService from '@/services/payments';
import * as secureStore from '@/utils/secureStore';
import type { Payment } from '@/types/models';
import type { PaginationMeta } from '@/types/api';

const BASE = () => process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function backendTotal(path: string): Promise<number> {
  const token = await secureStore.getAccessToken();
  const res = await fetch(`${BASE()}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const body = (await res.json()) as { pagination: PaginationMeta };
  return body.pagination.total;
}

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

describe('fetchAllPages', () => {
  it('recorre todas las páginas (con páginas de 15 hay más de una)', async () => {
    const total = await backendTotal('/owner-payments-list?per_page=15');
    // El seed deja al owner1 con más de una página de 15 pagos.
    expect(total).toBeGreaterThan(15);

    const all = await fetchAllPages<'payments', Payment>(
      '/owner-payments-list',
      'payments',
      {},
      15,
    );
    expect(all).toHaveLength(total);
    expect(new Set(all.map((p) => p.id)).size).toBe(total);
  });

  it('listPayments devuelve todos los pagos del propietario', async () => {
    const total = await backendTotal('/owner-payments-list');
    expect(await paymentsService.listPayments()).toHaveLength(total);
  });
});
