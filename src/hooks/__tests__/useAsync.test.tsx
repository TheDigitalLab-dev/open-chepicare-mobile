/**
 * Tests del hook `useAsync` usando datos REALES del backend (servicio de pets).
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useAsync } from '@/hooks/useAsync';
import * as authService from '@/services/auth';
import * as petsService from '@/services/pets';
import * as secureStore from '@/utils/secureStore';
import { ApiError } from '@/types/api';

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

describe('useAsync', () => {
  it('arranca en loading y expone data al resolverse', async () => {
    const { result } = renderHook(() => useAsync(() => petsService.listPets()));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it('expone un ApiError cuando la petición falla', async () => {
    const { result } = renderHook(() => useAsync(() => petsService.getPet(99999999)));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.status).toBe(404);
    expect(result.current.data).toBeNull();
  });

  it('una respuesta vieja no pisa la de una recarga más nueva', async () => {
    const [first, second] = await petsService.listPets();
    // La primera carga (al montar) tarda más que la recarga que sigue: el
    // orden de llegada lo controla la prueba; los datos son reales.
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let calls = 0;
    const load = async () => {
      calls += 1;
      if (calls === 1) {
        await firstGate;
        return petsService.getPet(first!.id);
      }
      return petsService.getPet(second!.id);
    };

    const { result } = renderHook(() => useAsync(load));
    await waitFor(() => expect(calls).toBe(1));
    await act(() => result.current.reload());
    expect(result.current.data?.id).toBe(second!.id);

    releaseFirst();
    await act(() => new Promise((resolve) => setTimeout(resolve, 500)));
    expect(result.current.data?.id).toBe(second!.id);
    expect(result.current.loading).toBe(false);
  });
});
