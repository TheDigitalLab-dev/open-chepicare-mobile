import { canReschedule, splitAppointments } from '@/utils/appointmentGroups';
import type { Appointment, AppointmentStatus } from '@/types/models';

const NOW = '2026-10-13T12:00:00.000Z';

function appt(
  id: number,
  scheduled_at: string,
  status: AppointmentStatus,
  duration = 30,
) {
  return { id, scheduled_at, status, duration_minutes: duration } as Appointment;
}

describe('splitAppointments', () => {
  it('próximas en orden ascendente (la primera es la siguiente) y pasadas descendente', () => {
    // El backend ordena por scheduled_at DESC.
    const list = [
      appt(1, '2026-12-01T10:00:00Z', 'pending'),
      appt(2, '2026-10-20T10:00:00Z', 'confirmed'),
      appt(3, '2026-10-14T10:00:00Z', 'pending'),
      appt(4, '2026-10-10T10:00:00Z', 'completed'),
      appt(5, '2026-09-01T10:00:00Z', 'cancelled'),
    ];
    const { upcoming, past } = splitAppointments(list, NOW);
    expect(upcoming.map((a) => a.id)).toEqual([3, 2, 1]);
    expect(past.map((a) => a.id)).toEqual([4, 5]);
  });

  it('una cita pendiente cuya hora ya pasó no es "próxima"', () => {
    const { upcoming, past } = splitAppointments(
      [appt(1, '2026-10-01T10:00:00Z', 'pending')],
      NOW,
    );
    expect(upcoming).toEqual([]);
    expect(past.map((a) => a.id)).toEqual([1]);
  });

  it('una cita en curso (empezó pero no terminó) sigue siendo próxima', () => {
    const { upcoming } = splitAppointments(
      [appt(1, '2026-10-13T11:45:00Z', 'in_progress', 60)],
      NOW,
    );
    expect(upcoming.map((a) => a.id)).toEqual([1]);
  });

  it('cancelada o completada en el futuro va a pasadas', () => {
    const { upcoming, past } = splitAppointments(
      [appt(1, '2026-11-01T10:00:00Z', 'cancelled')],
      NOW,
    );
    expect(upcoming).toEqual([]);
    expect(past.map((a) => a.id)).toEqual([1]);
  });
});

describe('canReschedule', () => {
  it('solo citas pendientes o confirmadas que aún no empiezan', () => {
    expect(canReschedule(appt(1, '2026-10-14T12:00:00Z', 'pending'), NOW)).toBe(true);
    expect(canReschedule(appt(2, '2026-10-14T12:00:00Z', 'confirmed'), NOW)).toBe(true);
    // Pendiente pero ya pasó (no se presentó): el backend la rechaza.
    expect(canReschedule(appt(3, '2026-10-12T12:00:00Z', 'pending'), NOW)).toBe(false);
    expect(canReschedule(appt(4, NOW, 'confirmed'), NOW)).toBe(false);
    expect(canReschedule(appt(5, '2026-10-14T12:00:00Z', 'cancelled'), NOW)).toBe(false);
    expect(canReschedule(appt(6, '2026-10-14T12:00:00Z', 'completed'), NOW)).toBe(false);
  });
});
