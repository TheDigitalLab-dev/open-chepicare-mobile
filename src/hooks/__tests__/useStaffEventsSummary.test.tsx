/**
 * `useStaffEventsSummary` con datos REALES: el personal (vet/admin) solo recibe
 * el resumen "N inscritos de M" de los eventos próximos; un usuario sin
 * permiso de eventos no ve la sección (sin error en pantalla).
 */
import { renderHook, waitFor } from '@testing-library/react-native';

import { useStaffEventsSummary } from '@/hooks/useStaffEventsSummary';
import * as authService from '@/services/auth';
import * as eventsService from '@/services/events';
import * as secureStore from '@/utils/secureStore';

const WAIT = { timeout: 10000 };

afterAll(async () => {
  await secureStore.clearTokens();
});

it('el veterinario recibe el resumen de los eventos próximos', async () => {
  await authService.login('vet@chepicare.com', 'password123');
  const { result } = renderHook(() => useStaffEventsSummary());
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
  expect(result.current.error).toBeNull();
  expect(result.current.available).toBe(true);

  const expected = await eventsService.getStaffEventsSummary();
  expect(result.current.events).toEqual(expected.events);
  const full = result.current.events.find((e) => e.title === 'Feria de adopción')!;
  expect(full.registered_count).toBe(full.capacity);
});

it('el admin también lo recibe', async () => {
  await authService.login('admin@chepicare.com', 'password123');
  const { result } = renderHook(() => useStaffEventsSummary());
  await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
  expect(result.current.available).toBe(true);
  expect(result.current.events.length).toBeGreaterThanOrEqual(3);
});

it('sin permiso (403) la sección no está disponible y no muestra error', async () => {
  // Un propietario recibe 403 "Staff only": mismo camino que un rol sin `events:read`.
  await authService.login('owner1@example.com', 'password123');
  const { result } = renderHook(() => useStaffEventsSummary());
  await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
  expect(result.current.available).toBe(false);
  expect(result.current.error).toBeNull();
  expect(result.current.events).toEqual([]);
});
