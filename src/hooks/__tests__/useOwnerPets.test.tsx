/**
 * Tests del hook `useOwnerPets` con datos REALES: mascotas de un dueño (todas
 * las páginas) pedidas por el staff contra el backend en ejecución.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useOwnerPets } from '@/hooks/useOwnerPets';
import * as authService from '@/services/auth';
import * as secureStore from '@/utils/secureStore';

let owner1Id: number;
let owner2Id: number;

beforeAll(async () => {
  await authService.login('owner2@example.com', 'password123');
  owner2Id = (await authService.fetchCurrentUser()).id;
  await authService.login('owner1@example.com', 'password123');
  owner1Id = (await authService.fetchCurrentUser()).id;
  await authService.login('admin@pawcare.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

type Props = { ownerId?: number };

describe('useOwnerPets', () => {
  it('sin dueño elegido no carga nada', () => {
    const { result } = renderHook(() => useOwnerPets(undefined));
    expect(result.current.pets).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('carga las mascotas del dueño elegido', async () => {
    const { result } = renderHook(() => useOwnerPets(owner1Id));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    const names = result.current.pets.map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(['Max', 'Luna']));
    expect(result.current.pets.every((p) => p.proprietary_id === owner1Id)).toBe(true);
  });

  it('al cambiar de dueño se queda con las mascotas del ÚLTIMO elegido', async () => {
    const { result, rerender } = renderHook(
      ({ ownerId }: Props) => useOwnerPets(ownerId),
      {
        initialProps: { ownerId: owner1Id },
      },
    );

    rerender({ ownerId: owner2Id });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pets.length).toBeGreaterThan(0);
    expect(result.current.pets.every((p) => p.proprietary_id === owner2Id)).toBe(true);
    expect(result.current.pets.map((p) => p.name)).toContain('Rocky');
  });

  it('expone el error y permite reintentar', async () => {
    await secureStore.clearTokens();
    const { result } = renderHook(() => useOwnerPets(owner1Id));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.kind).toBe('unauthorized');
    expect(result.current.loading).toBe(false);

    await authService.login('admin@pawcare.com', 'password123');
    await act(() => result.current.reload());
    expect(result.current.error).toBeNull();
    expect(result.current.pets.map((p) => p.name)).toEqual(
      expect.arrayContaining(['Max', 'Luna']),
    );
  });
});
