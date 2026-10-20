/**
 * Eventos de la clínica — espejo del contrato de `ClinicEvents::*` en
 * `../open-chepicare-web` (plan `docs/plans/035-clinic-events.md`):
 *  - Propietario: `GET /owner-events-list`, `GET /owner-events/:id`,
 *    `POST /owner-events/:id/register`, `GET /owner-event-registrations-list`,
 *    `POST /owner-event-registrations/:id/cancel`.
 *  - Personal (`events:read`): `GET /admin/events-summary`, SOLO el resumen.
 *
 * Fechas ISO 8601 con el offset de la clínica; `time_zone` = zona IANA.
 */

/** Los borradores nunca llegan a la app. */
export type ClinicEventStatus = 'published' | 'cancelled';

export type EventRegistrationStatus = 'active' | 'cancelled';

/** `external`: formulario público; `owner`: propietario con cuenta. */
export type EventRegistrationSource = 'external' | 'owner';

/** Inscripción del propietario en sesión (sin el evento anidado). */
export interface EventRegistrationSummary {
  id: number;
  event_id: number;
  source: EventRegistrationSource;
  status: EventRegistrationStatus;
  full_name: string;
  email: string;
  created_at: string;
  cancelled_at: string | null;
}

export interface ClinicEvent {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  registration_deadline: string | null;
  /** Fecha límite efectiva: la de inscripción o, si no hay, el inicio. */
  registration_closes_at: string;
  capacity: number;
  registered_count: number;
  spots_left: number;
  is_full: boolean;
  /** Se puede inscribir AHORA (publicado, antes del cierre y con cupo). */
  registration_open: boolean;
  status: ClinicEventStatus;
  image_url: string | null;
  public_url: string;
  /** Solo en endpoints del propietario: su inscripción ACTIVA, o `null`. */
  my_registration: EventRegistrationSummary | null;
}

/** Inscripción con su evento (registro / cancelación / "Mis inscripciones"). */
export interface EventRegistration extends EventRegistrationSummary {
  event: ClinicEvent;
}

export interface OwnerEventsResponse {
  events: ClinicEvent[];
  time_zone: string;
}

export interface OwnerEventResponse {
  event: ClinicEvent;
  time_zone: string;
}

export interface EventRegistrationResponse {
  registration: EventRegistration;
}

export interface EventRegistrationsResponse {
  registrations: EventRegistration[];
  time_zone: string;
}

/**
 * Resumen de solo lectura para el personal en la app: nunca datos de los
 * inscritos, solo cuántos hay.
 */
export interface StaffEventSummary {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  registered_count: number;
}

export interface StaffEventsSummaryResponse {
  events: StaffEventSummary[];
  time_zone: string;
}

/** `code` de los errores de inscripción (409 `duplicate`/`full`, 422 `closed`/`invalid`). */
export type EventRegistrationErrorCode = 'duplicate' | 'full' | 'closed' | 'invalid';
