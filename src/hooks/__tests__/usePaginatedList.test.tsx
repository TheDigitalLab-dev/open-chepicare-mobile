/**
 * `usePaginatedList` con datos REALES (pagos de toda la clínica, más de una
 * página en el seed): primera página, scroll infinito, fin de lista, cambio de
 * filtro (se descarta la respuesta vieja) y errores con reintento.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { usePaginatedList } from '@/hooks/usePaginatedList';
import * as authService from '@/services/auth';
import * as adminService from '@/services/admin';
import { PAGE_SIZE } from '@/services/pagination';
import * as secureStore from '@/utils/secureStore';
import type { PaymentStatus } from '@/types/models';

beforeAll(async () => {
  await authService.login('admin@chepicare.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

const loadPayments = (status: PaymentStatus | undefined) => (page: number) =>
  adminService.listAdminPayments({ status }, page);

describe('usePaginatedList', () => {
  it('carga la primera página y luego las siguientes hasta el final', async () => {
    const { result } = renderHook(() => usePaginatedList(loadPayments(undefined), 'all'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.items).toHaveLength(PAGE_SIZE);
    const total = result.current.total;
    expect(total).toBeGreaterThan(PAGE_SIZE);
    expect(result.current.hasMore).toBe(true);

    // Scroll hasta el final: cada loadMore agrega una página.
    while (result.current.hasMore) {
      await act(() => result.current.loadMore());
    }
    expect(result.current.items).toHaveLength(total);
    expect(new Set(result.current.items.map((p) => p.id)).size).toBe(total);

    // Al final, loadMore no hace nada.
    await act(() => result.current.loadMore());
    expect(result.current.items).toHaveLength(total);
  });

  it('dos loadMore seguidos no piden la misma página dos veces', async () => {
    const { result } = renderHook(() => usePaginatedList(loadPayments(undefined), 'all'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await Promise.all([result.current.loadMore(), result.current.loadMore()]);
    });
    expect(result.current.items).toHaveLength(
      Math.min(PAGE_SIZE * 2, result.current.total),
    );
    expect(new Set(result.current.items.map((p) => p.id)).size).toBe(
      result.current.items.length,
    );
  });

  it('al cambiar el filtro recarga desde la página 1 y descarta la respuesta vieja', async () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: PaymentStatus | undefined }) =>
        usePaginatedList(loadPayments(status), status ?? 'all'),
      { initialProps: { status: undefined as PaymentStatus | undefined } },
    );
    // Cambio inmediato (la carga de «todos» sigue en vuelo).
    rerender({ status: 'completed' });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items.length).toBeGreaterThan(0);
    expect(result.current.items.every((p) => p.status === 'completed')).toBe(true);
  });

  it('expone el error y permite reintentar', async () => {
    await secureStore.clearTokens();
    const { result } = renderHook(() => usePaginatedList(loadPayments(undefined), 'all'));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.kind).toBe('unauthorized');
    expect(result.current.loading).toBe(false);

    await authService.login('admin@chepicare.com', 'password123');
    await act(() => result.current.reload());
    expect(result.current.error).toBeNull();
    expect(result.current.items).toHaveLength(PAGE_SIZE);
  });
});
