/**
 * Próximas y pasadas de las citas del propietario. El backend las devuelve por
 * `scheduled_at` descendente; "la próxima" es la más cercana en el futuro.
 */
import type { Appointment, AppointmentStatus } from '@/types/models';

const ACTIVE: AppointmentStatus[] = ['pending', 'confirmed', 'in_progress'];
const DEFAULT_DURATION_MIN = 30;

function endsAt(a: Appointment): number {
  const duration = a.duration_minutes ?? DEFAULT_DURATION_MIN;
  return new Date(a.scheduled_at).getTime() + duration * 60_000;
}

export function splitAppointments(
  list: readonly Appointment[],
  now: string = new Date().toISOString(),
): { upcoming: Appointment[]; past: Appointment[] } {
  const nowMs = new Date(now).getTime();
  const isUpcoming = (a: Appointment) => ACTIVE.includes(a.status) && endsAt(a) > nowMs;
  const time = (a: Appointment) => new Date(a.scheduled_at).getTime();
  return {
    upcoming: list.filter(isUpcoming).sort((a, b) => time(a) - time(b)),
    past: list.filter((a) => !isUpcoming(a)).sort((a, b) => time(b) - time(a)),
  };
}

/**
 * El propietario solo puede reprogramar citas pendientes o confirmadas que aún
 * no empezaron (el backend responde 422 «Solo se pueden modificar citas
 * futuras»). Antes el botón aparecía en una cita pendiente ya pasada y el
 * error llegaba al final de los 5 pasos del asistente.
 */
export function canReschedule(
  a: Pick<Appointment, 'status' | 'scheduled_at'>,
  nowIso: string,
): boolean {
  if (a.status !== 'pending' && a.status !== 'confirmed') return false;
  return Date.parse(a.scheduled_at) > Date.parse(nowIso);
}
