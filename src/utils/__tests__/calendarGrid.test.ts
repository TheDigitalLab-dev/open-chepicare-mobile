/**
 * Cuadrícula del calendario (lógica pura, sin red): semanas de lunes a domingo,
 * rango que se pide al servidor, reparto de eventos por día (los tratamientos
 * de varios días ocupan cada día de su periodo) y la regla de "Nueva cita".
 */
import type { CalendarEvent } from '@/types/calendar';
import {
  canCreateAppointmentOn,
  dayEventTypes,
  eventsByDay,
  monthGrid,
  monthGridRange,
  monthOfDay,
} from '@/utils/calendarGrid';

function event(
  id: string,
  type: CalendarEvent['type'],
  start: string,
  end = start,
): CalendarEvent {
  const base = {
    id,
    record_id: 1,
    title: id,
    all_day: type !== 'appointment',
    start_date: start,
    end_date: end,
    starts_at: null,
    ends_at: null,
    pet: { id: 1, name: 'Max', species: 'dog' as const },
  };
  switch (type) {
    case 'appointment':
      return {
        ...base,
        type,
        status: 'pending',
        details: { service: null, assigned_to: null, duration_minutes: 30 },
      };
    case 'prescription':
      return {
        ...base,
        type,
        status: 'active',
        details: {
          prescription_id: 1,
          consultation_id: 1,
          medication_name: 'Amoxicilina',
          dose: null,
          frequency: null,
          duration: null,
          duration_days: null,
          special_instructions: null,
        },
      };
    case 'vaccination':
      return {
        ...base,
        type,
        status: 'upcoming',
        details: { source: 'vaccination', vaccine_name: 'Antirrábica' },
      };
    case 'deworming':
      return { ...base, type, status: 'upcoming', details: { product_name: 'Milbemax' } };
  }
}

describe('monthGrid', () => {
  it('arma semanas completas de lunes a domingo que cubren el mes', () => {
    // Octubre 2026 empieza en jueves y termina en sábado.
    const weeks = monthGrid({ year: 2026, month: 10 });
    expect(weeks).toHaveLength(5);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks[0]![0]).toBe('2026-09-28');
    expect(weeks[0]![3]).toBe('2026-10-01');
    expect(weeks.at(-1)!.at(-1)).toBe('2026-11-01');
  });

  it('un mes que empieza en lunes no agrega la semana anterior', () => {
    // Junio 2026 empieza en lunes.
    const weeks = monthGrid({ year: 2026, month: 6 });
    expect(weeks[0]![0]).toBe('2026-06-01');
    expect(weeks.at(-1)!.at(-1)).toBe('2026-07-05');
  });

  it('cruza el año en diciembre', () => {
    const weeks = monthGrid({ year: 2026, month: 12 });
    expect(weeks[0]![0]).toBe('2026-11-30');
    expect(weeks.at(-1)!.at(-1)).toBe('2027-01-03');
  });

  it('monthGridRange: primer y último día de la cuadrícula (≤ 42 días)', () => {
    expect(monthGridRange({ year: 2026, month: 10 })).toEqual({
      start: '2026-09-28',
      end: '2026-11-01',
    });
  });

  it('monthOfDay', () => {
    expect(monthOfDay('2027-01-31')).toEqual({ year: 2027, month: 1 });
  });
});

describe('eventsByDay', () => {
  it('reparte los eventos por día y un tratamiento ocupa cada día de su periodo', () => {
    const appointment = event('a', 'appointment', '2026-10-21');
    const treatment = event('p', 'prescription', '2026-10-20', '2026-10-22');
    const map = eventsByDay([treatment, appointment], {
      start: '2026-10-01',
      end: '2026-10-31',
    });
    expect(map.get('2026-10-20')?.map((e) => e.id)).toEqual(['p']);
    expect(map.get('2026-10-21')?.map((e) => e.id)).toEqual(['p', 'a']);
    expect(map.get('2026-10-22')?.map((e) => e.id)).toEqual(['p']);
    expect(map.has('2026-10-23')).toBe(false);
  });

  it('recorta los periodos al rango pedido', () => {
    const treatment = event('p', 'prescription', '2026-09-25', '2026-12-31');
    const map = eventsByDay([treatment], { start: '2026-10-01', end: '2026-10-03' });
    expect([...map.keys()]).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
  });

  it('dayEventTypes: tipos únicos en el orden de la leyenda', () => {
    expect(
      dayEventTypes([
        event('d', 'deworming', '2026-10-01'),
        event('a', 'appointment', '2026-10-01'),
        event('a2', 'appointment', '2026-10-01'),
        event('v', 'vaccination', '2026-10-01'),
      ]),
    ).toEqual(['appointment', 'vaccination', 'deworming']);
    expect(dayEventTypes(undefined)).toEqual([]);
  });
});

describe('canCreateAppointmentOn', () => {
  const today = '2026-10-20';

  it('el personal agenda desde hoy', () => {
    expect(canCreateAppointmentOn('2026-10-20', today, 'staff', true)).toBe(true);
    expect(canCreateAppointmentOn('2026-10-19', today, 'staff', true)).toBe(false);
  });

  it('el propietario agenda desde mañana (misma regla que su asistente)', () => {
    expect(canCreateAppointmentOn('2026-10-20', today, 'owner', true)).toBe(false);
    expect(canCreateAppointmentOn('2026-10-21', today, 'owner', true)).toBe(true);
  });

  it('sin permiso del servidor nunca', () => {
    expect(canCreateAppointmentOn('2026-12-01', today, 'staff', false)).toBe(false);
  });
});
