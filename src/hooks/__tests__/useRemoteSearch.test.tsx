/**
 * Tests del hook `useRemoteSearch` con datos REALES (búsqueda de dueños del
 * staff contra el backend en ejecución).
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useRemoteSearch } from '@/hooks/useRemoteSearch';
import * as authService from '@/services/auth';
import * as adminService from '@/services/admin';
import * as secureStore from '@/utils/secureStore';

beforeAll(async () => {
  await authService.login('admin@pawcare.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

const searchOwners = (search: string) =>
  adminService.listAdminOwners({ search: search || undefined });

describe('useRemoteSearch', () => {
  it('con la búsqueda vacía muestra la primera página', async () => {
    const { result } = renderHook(() => useRemoteSearch(searchOwners, 10));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data?.length).toBeGreaterThan(0);
  });

  it('busca en el servidor y se queda con la respuesta de la ÚLTIMA búsqueda', async () => {
    const { result } = renderHook(() => useRemoteSearch(searchOwners, 10));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setQuery('a'));
    act(() => result.current.setQuery('owner1@example.com'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data?.map((o) => o.email)).toEqual(['owner1@example.com']);
    });
    expect(result.current.query).toBe('owner1@example.com');
  });

  it('expone el error y permite reintentar', async () => {
    await secureStore.clearTokens();
    const { result } = renderHook(() => useRemoteSearch(searchOwners, 10));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.kind).toBe('unauthorized');
    // El indicador de carga se libera también cuando la búsqueda falla.
    expect(result.current.loading).toBe(false);

    await authService.login('admin@pawcare.com', 'password123');
    await act(() => result.current.reload());
    expect(result.current.error).toBeNull();
    expect(result.current.data?.length).toBeGreaterThan(0);
  });
});
