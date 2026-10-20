/**
 * `useCalendar` con datos REALES del backend: mes de la clínica, puntos por
 * tipo, lista del día, navegación por meses (solo cuenta la última respuesta),
 * leyenda que oculta tipos, toggle de canceladas, regla de "Nueva cita" y el
 * filtro de veterinario del personal.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useCalendar } from '@/hooks/useCalendar';
import * as appointmentsService from '@/services/appointments';
import * as authService from '@/services/auth';
import * as calendarService from '@/services/calendar';
import { bookFreshAppointment } from '@/testing/ownerData';
import { clinicDayKey, clinicMonth, clinicToday, shiftDayKey } from '@/utils/clinicTime';
import { isDayInMonth, monthGridRange } from '@/utils/calendarGrid';
import { shiftMonth } from '@/utils/schedule';
import * as secureStore from '@/utils/secureStore';

const WAIT = { timeout: 10000 };

afterAll(async () => {
  await secureStore.clearTokens();
});

describe('useCalendar (propietario)', () => {
  beforeAll(async () => {
    await authService.login('owner1@example.com', 'password123');
  });

  it('carga el mes de la clínica con puntos por tipo y la lista del día elegido', async () => {
    const { result } = renderHook(() => useCalendar({ audience: 'owner' }));
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.error).toBeNull();

    const today = clinicToday();
    expect(result.current.month).toEqual(clinicMonth());
    expect(result.current.selectedDay).toBe(today);
    expect(result.current.weeks.flat()).toContain(today);

    const expected = await calendarService.getOwnerCalendarEvents(
      monthGridRange(clinicMonth()),
    );
    expect(result.current.events.map((e) => e.id)).toEqual(
      expected.events.map((e) => e.id),
    );
    expect(result.current.legendTypes).toEqual(expected.allowed_types);

    const appointment = expected.events.find((e) => e.type === 'appointment')!;
    expect(result.current.markersByDay.get(appointment.start_date)).toContain(
      'appointment',
    );

    act(() => result.current.selectDay(appointment.start_date));
    expect(result.current.selectedDay).toBe(appointment.start_date);
    expect(result.current.selectedEvents.map((e) => e.id)).toContain(appointment.id);

    // Un tratamiento de varios días aparece también en su segundo día (dentro
    // del mes visible, para no cambiar de mes).
    const inMonth = (day: string) => isDayInMonth(day, clinicMonth());
    const treatment = expected.events.find(
      (e) =>
        e.type === 'prescription' &&
        e.end_date > e.start_date &&
        inMonth(e.start_date) &&
        inMonth(shiftDayKey(e.start_date, 1)),
    )!;
    act(() => result.current.selectDay(shiftDayKey(treatment.start_date, 1)));
    expect(result.current.selectedEvents.map((e) => e.id)).toContain(treatment.id);
  });

  it('navega de mes y se queda con la ÚLTIMA respuesta', async () => {
    const { result } = renderHook(() => useCalendar({ audience: 'owner' }));
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);

    act(() => {
      result.current.nextMonth();
      result.current.nextMonth();
    });
    const target = shiftMonth(clinicMonth(), 2);
    expect(result.current.month).toEqual(target);
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    const expected = await calendarService.getOwnerCalendarEvents(monthGridRange(target));
    expect(result.current.events.map((e) => e.id)).toEqual(
      expected.events.map((e) => e.id),
    );
    // Fuera del mes actual se elige el día 1.
    expect(result.current.selectedDay).toBe(
      `${target.year}-${String(target.month).padStart(2, '0')}-01`,
    );

    act(() => result.current.goToday());
    expect(result.current.month).toEqual(clinicMonth());
    expect(result.current.selectedDay).toBe(clinicToday());
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);

    act(() => result.current.prevMonth());
    expect(result.current.month).toEqual(shiftMonth(clinicMonth(), -1));
  });

  it('la leyenda oculta y vuelve a mostrar un tipo sin pedir de nuevo', async () => {
    const { result } = renderHook(() => useCalendar({ audience: 'owner' }));
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    const total = result.current.events.length;
    expect(result.current.events.some((e) => e.type === 'prescription')).toBe(true);

    act(() => result.current.toggleType('prescription'));
    expect(result.current.hiddenTypes).toContain('prescription');
    expect(result.current.loading).toBe(false);
    expect(result.current.events.some((e) => e.type === 'prescription')).toBe(false);

    act(() => result.current.toggleType('prescription'));
    expect(result.current.events).toHaveLength(total);
  });

  it('las canceladas se ven solo con el toggle', async () => {
    const appointment = await bookFreshAppointment(7);
    await appointmentsService.cancelAppointment(appointment.id, 'Prueba calendario');
    const day = clinicDayKey(appointment.scheduled_at, appointment.time_zone);
    const id = `appointment-${appointment.id}`;

    const { result } = renderHook(() =>
      useCalendar({ audience: 'owner', initialDay: day }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.selectedDay).toBe(day);
    expect(result.current.includeCancelled).toBe(false);
    expect(result.current.selectedEvents.map((e) => e.id)).not.toContain(id);

    act(() => result.current.setIncludeCancelled(true));
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.selectedEvents.map((e) => e.id)).toContain(id);
  });

  it('"Nueva cita": el propietario desde mañana', async () => {
    const { result } = renderHook(() => useCalendar({ audience: 'owner' }));
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.canCreateOnSelectedDay).toBe(false);
    act(() => result.current.selectDay(shiftDayKey(clinicToday(), 1)));
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.canCreateOnSelectedDay).toBe(true);
    act(() => result.current.selectDay(shiftDayKey(clinicToday(), -1)));
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.canCreateOnSelectedDay).toBe(false);
  });
});

describe('useCalendar (personal)', () => {
  it('el veterinario entra en "Mis citas" y puede ver toda la clínica u otro veterinario', async () => {
    const vet = await authService.login('vet@chepicare.com', 'password123');
    const { result } = renderHook(() =>
      useCalendar({ audience: 'staff', currentUserId: vet.id }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.vetFilter).toBe('me');
    expect(result.current.canFilterMine).toBe(true);
    expect(result.current.vets.some((v) => v.id === vet.id)).toBe(true);
    expect(result.current.legendTypes).not.toContain('prescription');
    // Personal: desde hoy.
    expect(result.current.canCreateOnSelectedDay).toBe(true);
    const mine = result.current.events.filter((e) => e.type === 'appointment');
    expect(
      mine.every((e) => e.type === 'appointment' && e.details.assigned_to?.id === vet.id),
    ).toBe(true);

    act(() => result.current.setVetFilter('all'));
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.vetFilter).toBe('all');
    const all = result.current.events.filter((e) => e.type === 'appointment');
    expect(all.length).toBeGreaterThan(mine.length);

    const other = result.current.vets.find((v) => v.id !== vet.id)!;
    act(() => result.current.setVetFilter(other.id));
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.vetFilter).toBe(other.id);
    expect(
      result.current.events.every(
        (e) => e.type !== 'appointment' || e.details.assigned_to?.id === other.id,
      ),
    ).toBe(true);
  });

  it('el admin entra en "Toda la clínica"', async () => {
    const admin = await authService.login('admin@chepicare.com', 'password123');
    const { result } = renderHook(() =>
      useCalendar({ audience: 'staff', currentUserId: admin.id }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.vetFilter).toBe('all');
  });

  it('un propietario en el calendario del personal ve el error de permisos', async () => {
    await authService.login('owner1@example.com', 'password123');
    const { result } = renderHook(() => useCalendar({ audience: 'staff' }));
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.error?.kind).toBe('forbidden');
    expect(result.current.events).toEqual([]);
  });
});
