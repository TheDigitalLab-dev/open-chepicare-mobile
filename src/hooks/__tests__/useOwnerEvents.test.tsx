/**
 * Hooks de Eventos del propietario con datos REALES del backend
 * (`owner2@example.com`, inscrito en el seed solo en la "Jornada de vacunación"):
 *  - `useOwnerEvents`: lista de próximos con cupos.
 *  - `useOwnerEvent`: detalle, inscripción de un toque y cancelación.
 *  - `useMyEventRegistrations`: "Mis inscripciones" y cancelar desde la lista.
 * Toda inscripción creada se cancela de verdad al terminar.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useMyEventRegistrations } from '@/hooks/useMyEventRegistrations';
import { useOwnerEvent } from '@/hooks/useOwnerEvent';
import { useOwnerEvents } from '@/hooks/useOwnerEvents';
import * as authService from '@/services/auth';
import * as eventsService from '@/services/events';
import * as secureStore from '@/utils/secureStore';

const OWNER = 'owner2@example.com';
const WAIT = { timeout: 10000 };
const created: number[] = [];

beforeAll(async () => {
  await authService.login(OWNER, 'password123');
});

afterAll(async () => {
  await authService.login(OWNER, 'password123');
  for (const id of created) {
    await eventsService.cancelEventRegistration(id).catch(() => undefined);
  }
  await secureStore.clearTokens();
});

describe('useOwnerEvents', () => {
  it('carga los eventos próximos del servidor', async () => {
    const { result } = renderHook(() => useOwnerEvents());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.error).toBeNull();

    const expected = await eventsService.listOwnerEvents();
    expect(result.current.events.map((e) => e.id)).toEqual(
      expected.events.map((e) => e.id),
    );
    expect(result.current.events.some((e) => e.is_full)).toBe(true);
  });
});

describe('useOwnerEvent', () => {
  it('se inscribe con un toque y cancela, con el cupo al día', async () => {
    const { events } = await eventsService.listOwnerEvents();
    const target = events.find((e) => e.registration_open && !e.my_registration)!;

    const { result } = renderHook(() => useOwnerEvent(target.id));
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.event?.id).toBe(target.id);
    expect(result.current.state).toBe('open');

    await act(async () => {
      expect(await result.current.register()).toBe(true);
    });
    const registration = result.current.event!.my_registration!;
    created.push(registration.id);
    expect(result.current.state).toBe('registered');
    expect(result.current.actionError).toBeNull();
    expect(result.current.mutating).toBe(false);
    const event = result.current.event!;
    expect(event.spots_left).toBe(event.capacity - event.registered_count);

    const onServer = await eventsService.getOwnerEvent(target.id);
    expect(onServer.event.my_registration?.id).toBe(registration.id);

    await act(async () => {
      expect(await result.current.cancel()).toBe(true);
    });
    expect(result.current.state).toBe('open');
    expect(result.current.event!.my_registration).toBeNull();

    const fresh = await eventsService.getOwnerEvent(target.id);
    expect(fresh.event.my_registration).toBeNull();
  });

  it('en un evento lleno el estado es "full" y el servidor rechaza la inscripción', async () => {
    const { events } = await eventsService.listOwnerEvents();
    const full = events.find((e) => e.is_full && !e.my_registration)!;

    const { result } = renderHook(() => useOwnerEvent(full.id));
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.state).toBe('full');

    await act(async () => {
      expect(await result.current.register()).toBe(false);
    });
    expect(result.current.actionError?.code).toBe('full');
    expect(result.current.actionError?.message).toBe('Cupo completo');
    expect(result.current.state).toBe('full');
  });

  it('un evento que no existe da error "no encontrado"', async () => {
    const { result } = renderHook(() => useOwnerEvent(99999999));
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.event).toBeNull();
    expect(result.current.error?.kind).toBe('notFound');
  });
});

describe('useMyEventRegistrations', () => {
  it('lista las inscripciones y cancela una desde la lista', async () => {
    const { events } = await eventsService.listOwnerEvents();
    const target = events.find((e) => e.registration_open && !e.my_registration)!;
    const { registration } = await eventsService.registerForEvent(target.id);
    created.push(registration.id);

    const { result } = renderHook(() => useMyEventRegistrations());
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.error).toBeNull();
    const row = result.current.registrations.find((r) => r.id === registration.id)!;
    expect(row.status).toBe('active');
    expect(row.event.id).toBe(target.id);

    await act(async () => {
      expect(await result.current.cancel(registration.id)).toBe(true);
    });
    expect(result.current.cancellingId).toBeNull();
    expect(
      result.current.registrations.find((r) => r.id === registration.id)?.status,
    ).toBe('cancelled');

    // Cancelarla otra vez: el error del servidor queda expuesto.
    await act(async () => {
      expect(await result.current.cancel(registration.id)).toBe(false);
    });
    expect(result.current.actionError?.message).toBe('La inscripción ya está cancelada');
  });
});
