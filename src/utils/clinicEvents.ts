/**
 * Reglas de presentación de los eventos de la clínica: cupos libres, estado
 * del botón de inscripción, "N inscritos de M" (resumen del personal), horario
 * en la zona de la clínica y si una inscripción todavía se puede cancelar.
 */
import type { ClinicEvent, EventRegistration } from '@/types/events';
import { clinicDayKey, formatClinicDate, formatClinicTime } from '@/utils/clinicTime';

/**
 * Qué puede hacer el propietario con el evento:
 *  - `registered`: ya inscrito (puede cancelar).
 *  - `open`: puede inscribirse.
 *  - `full`: "Cupo completo".
 *  - `closed`: inscripciones cerradas (pasó la fecha límite o el inicio).
 *  - `cancelled`: el evento fue cancelado por la clínica.
 */
export type EventRegistrationState =
  | 'registered'
  | 'open'
  | 'full'
  | 'closed'
  | 'cancelled';

export function eventRegistrationState(event: ClinicEvent): EventRegistrationState {
  if (event.status === 'cancelled') return 'cancelled';
  if (event.my_registration) return 'registered';
  if (event.is_full) return 'full';
  if (!event.registration_open) return 'closed';
  return 'open';
}

export function eventSpotsLabel(event: ClinicEvent): string {
  if (event.is_full || event.spots_left <= 0) return 'Cupo completo';
  return event.spots_left === 1 ? 'Queda 1 cupo' : `Quedan ${event.spots_left} cupos`;
}

export function registeredCountLabel(count: number, capacity: number): string {
  return `${count} ${count === 1 ? 'inscrito' : 'inscritos'} de ${capacity}`;
}

/** "10/11/2026 · 18:00 – 19:00" o, si cruza días, inicio y fin completos. */
export function eventScheduleLabel(startsAt: string, endsAt: string): string {
  const start = formatClinicTime(startsAt);
  const end = formatClinicTime(endsAt);
  if (clinicDayKey(startsAt) === clinicDayKey(endsAt)) {
    return `${formatClinicDate(startsAt)} · ${start} – ${end}`;
  }
  return `${formatClinicDate(startsAt)} ${start} – ${formatClinicDate(endsAt)} ${end}`;
}

export function registrationStatusLabel(registration: EventRegistration): string {
  return registration.status === 'active' ? 'Inscrito' : 'Cancelada';
}

/** Activa y de un evento que aún no terminó (mismo criterio que el backend). */
export function canCancelRegistration(
  registration: EventRegistration,
  now: number = Date.now(),
): boolean {
  return registration.status === 'active' && Date.parse(registration.event.ends_at) > now;
}
