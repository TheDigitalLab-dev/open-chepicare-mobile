/**
 * Asistente de citas del propietario contra el backend REAL: meses, días,
 * veterinarios (agrupados por turnos), horarios libres calculados por el
 * servidor, alta y reprogramación (PATCH).
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useAppointmentBooking } from '@/hooks/useAppointmentBooking';
import * as appointmentsService from '@/services/appointments';
import * as authService from '@/services/auth';
import * as secureStore from '@/utils/secureStore';
import { clinicHourKey, clinicMonth } from '@/utils/clinicTime';
import { shiftMonth } from '@/utils/schedule';

// Peticiones reales al backend: el plazo por defecto de waitFor (1 s) es corto.
const WAIT = { timeout: 10000 };

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

async function renderBooking(id?: number) {
  const hook = renderHook(() => useAppointmentBooking(id));
  await waitFor(() => {
    expect(hook.result.current.pets.data).not.toBeNull();
    expect(hook.result.current.services.data).not.toBeNull();
    expect(hook.result.current.days.loading).toBe(false);
    expect(hook.result.current.initializing).toBe(false);
  }, WAIT);
  return hook;
}

/** Avanza al mes siguiente (siempre con días libres en el seed) y elige todo. */
async function pickFirstFreeSlot(
  hook: Awaited<ReturnType<typeof renderBooking>>,
  serviceId?: number,
) {
  const { result } = hook;
  await act(() => result.current.nextMonth());
  await waitFor(() => expect(result.current.days.data?.length).toBeGreaterThan(0), WAIT);
  act(() => {
    result.current.selectPet(result.current.pets.data![0]!.id);
    result.current.selectService(serviceId ?? result.current.services.data![0]!.id);
  });
  await act(() =>
    result.current.selectDay(
      result.current.days.data![1] ?? result.current.days.data![0]!,
    ),
  );
  await waitFor(() => expect(result.current.vets.data.length).toBeGreaterThan(0), WAIT);
  await act(() => result.current.selectVet(result.current.vets.data[0]!.id));
  await waitFor(() => expect(result.current.slots.data.length).toBeGreaterThan(1), WAIT);
}

describe('useAppointmentBooking', () => {
  it('no deja ir a meses pasados y carga los días del mes elegido', async () => {
    const { result } = await renderBooking();
    const current = clinicMonth();
    expect(result.current.month).toEqual(current);
    expect(result.current.canGoPrevMonth).toBe(false);

    await act(() => result.current.prevMonth());
    expect(result.current.month).toEqual(current);

    await act(() => result.current.nextMonth());
    expect(result.current.month).toEqual(shiftMonth(current, 1));
    expect(result.current.canGoPrevMonth).toBe(true);
    await waitFor(() => expect(result.current.days.loading).toBe(false), WAIT);
    const next = shiftMonth(current, 1);
    const prefix = `${next.year}-${String(next.month).padStart(2, '0')}-`;
    expect(result.current.days.data!.every((d) => d.startsWith(prefix))).toBe(true);
  }, 30000);

  it('agrupa los turnos y ofrece solo los horarios libres del servidor', async () => {
    const hook = await renderBooking();
    await pickFirstFreeSlot(hook);
    const { result } = hook;

    const ids = result.current.vets.data.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);

    const sel = result.current.selection;
    const server = await appointmentsService.getAvailableTimeSlots(
      sel.day!,
      sel.vetId!,
      sel.serviceId!,
    );
    expect(result.current.slots.data).toEqual(server.map((s) => s.time));
  }, 30000);

  it('agenda una cita y luego la reprograma con PATCH', async () => {
    const hook = await renderBooking();
    // Servicio de más de 30 min: la cita ocupa también los horarios siguientes.
    const longService = hook.result.current.services.data!.find(
      (s) => (s.duration_minutes ?? 0) > 30,
    );
    await pickFirstFreeSlot(hook, longService?.id);
    const [first, second] = hook.result.current.slots.data;
    const day = hook.result.current.selection.day!;

    act(() => {
      hook.result.current.selectTime(first!);
      hook.result.current.setNotes('Primera visita');
    });
    let created: Awaited<ReturnType<typeof hook.result.current.submit>> = null;
    await act(async () => {
      created = await hook.result.current.submit();
    });
    expect(hook.result.current.submitError).toBeUndefined();
    expect(created).not.toBeNull();
    const id = created!.id;
    hook.unmount();

    try {
      expect(created!.status).toBe('pending');
      expect(clinicHourKey(created!.scheduled_at, created!.time_zone)).toBe(first);

      // Edición: el asistente llega con la cita precargada.
      const edit = await renderBooking(id);
      const sel = edit.result.current.selection;
      expect(sel).toEqual(
        expect.objectContaining({
          petId: created!.pet_id,
          serviceId: created!.service_id,
          vetId: created!.assigned_to_id,
          time: first,
        }),
      );
      expect(edit.result.current.notes).toBe('Primera visita');
      // El servidor no cuenta la propia cita (`exclude_appointment_id`): se
      // ofrecen su horario y los que solo chocaban con ella.
      const withoutOwn = (
        await appointmentsService.getAvailableTimeSlots(
          day,
          created!.assigned_to_id!,
          created!.service_id,
          id,
        )
      ).map((s) => s.time);
      expect(withoutOwn).toContain(first);
      await waitFor(
        () => expect(edit.result.current.slots.data).toEqual(withoutOwn),
        WAIT,
      );

      act(() => {
        edit.result.current.selectTime(second!);
        edit.result.current.setNotes('');
      });
      let updated: Awaited<ReturnType<typeof edit.result.current.submit>> = null;
      await act(async () => {
        updated = await edit.result.current.submit();
      });
      expect(edit.result.current.submitError).toBeUndefined();
      expect(updated!.id).toBe(id);
      expect(clinicHourKey(updated!.scheduled_at, updated!.time_zone)).toBe(second);
      expect(updated!.notes ?? '').toBe('');
    } finally {
      await appointmentsService.cancelAppointment(id, 'Prueba de integración');
    }
  }, 60000);

  it('una cita que ya no se puede editar muestra el error de carga', async () => {
    const cancelled = await appointmentsService.listAppointments({ status: 'cancelled' });
    const { result } = renderHook(() => useAppointmentBooking(cancelled[0]!.id));
    await waitFor(() => expect(result.current.initializing).toBe(false), WAIT);
    expect(result.current.initError?.message).toBe('Esta cita ya no se puede modificar.');
  }, 30000);
});
