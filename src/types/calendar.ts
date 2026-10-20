/**
 * Calendario / agenda — espejo del contrato de `Calendar::*` en
 * `../open-chepicare-web` (planes `docs/plans/034-calendar.md` y
 * `035-clinic-events.md`, que añade `clinic_event` solo al del propietario):
 *  - `GET /owner-calendar-events` (propietario)
 *  - `GET /admin/calendar-events` (personal con `appointments:read`)
 *
 * Días (`start_date`/`end_date`) en la zona de la clínica, ambos incluidos.
 * `starts_at`/`ends_at` en ISO 8601 con offset; `null` si `all_day`.
 */
import type { AppointmentPaymentStatus, AppointmentStatus, Species } from './models';

export type CalendarEventType =
  | 'appointment'
  | 'prescription'
  | 'vaccination'
  | 'deworming'
  | 'clinic_event';

/** Orden fijo de la leyenda y de los puntos de cada día. */
export const CALENDAR_EVENT_TYPES: readonly CalendarEventType[] = [
  'appointment',
  'prescription',
  'vaccination',
  'deworming',
  'clinic_event',
];

export const CALENDAR_EVENT_TYPE_LABEL: Record<CalendarEventType, string> = {
  appointment: 'Citas',
  prescription: 'Tratamientos',
  vaccination: 'Vacunas',
  deworming: 'Desparasitaciones',
  clinic_event: 'Eventos de la clínica',
};

export interface CalendarPet {
  id: number;
  name: string;
  species: Species;
}

interface CalendarEventBase {
  /** Único entre tipos (`appointment-12`, `vaccination_schedule_item-8`…). */
  id: string;
  record_id: number;
  title: string;
  all_day: boolean;
  start_date: string;
  end_date: string;
  starts_at: string | null;
  ends_at: string | null;
}

/** Eventos clínicos de una mascota (todos menos los eventos de la clínica). */
interface PetCalendarEventBase extends CalendarEventBase {
  pet: CalendarPet;
}

export interface AppointmentCalendarEvent extends PetCalendarEventBase {
  type: 'appointment';
  status: AppointmentStatus;
  details: {
    service: { id: number; name: string } | null;
    assigned_to: { id: number; full_name: string } | null;
    duration_minutes: number | null;
    payment_status?: AppointmentPaymentStatus | null;
    /** Solo en el endpoint del personal. */
    owner?: { id: number; full_name: string } | null;
  };
}

export type PrescriptionEventStatus = 'active' | 'finished' | 'completed';

export interface PrescriptionCalendarEvent extends PetCalendarEventBase {
  type: 'prescription';
  status: PrescriptionEventStatus;
  details: {
    prescription_id: number;
    consultation_id: number | null;
    medication_name: string;
    dose: string | null;
    frequency: string | null;
    duration: string | null;
    duration_days: number | null;
    special_instructions: string | null;
  };
}

export type ClinicalEventStatus = 'upcoming' | 'overdue';

export interface VaccinationCalendarEvent extends PetCalendarEventBase {
  type: 'vaccination';
  status: ClinicalEventStatus;
  details: {
    source: 'vaccination' | 'schedule';
    vaccine_name: string;
    vaccine_type?: string | null;
    last_application_date?: string | null;
    vaccination_schedule_id?: number;
  };
}

export interface DewormingCalendarEvent extends PetCalendarEventBase {
  type: 'deworming';
  status: ClinicalEventStatus;
  details: {
    product_name: string;
    parasite_type?: string | null;
    last_application_date?: string | null;
  };
}

/** Estado del evento de la clínica (solo salen los que tienen inscripción activa). */
export type ClinicEventCalendarStatus = 'published' | 'cancelled';

/** Evento de la clínica en el que el propietario está inscrito (sin mascota). */
export interface ClinicEventCalendarEvent extends CalendarEventBase {
  type: 'clinic_event';
  status: ClinicEventCalendarStatus;
  pet: null;
  details: {
    location: string | null;
    slug: string;
    registration_id: number;
  };
}

export type CalendarEvent =
  | AppointmentCalendarEvent
  | PrescriptionCalendarEvent
  | VaccinationCalendarEvent
  | DewormingCalendarEvent
  | ClinicEventCalendarEvent;

export interface CalendarRange {
  start: string;
  end: string;
  /** Zona IANA de la clínica. */
  time_zone: string;
}

export interface CalendarVet {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface CalendarResponseBase {
  events: CalendarEvent[];
  range: CalendarRange;
  allowed_types: CalendarEventType[];
  can_create_appointment: boolean;
}

export interface StaffCalendarResponse extends CalendarResponseBase {
  /** `vet_id` resuelto: id del veterinario filtrado o `null` (toda la clínica). */
  filters: {
    vet_id: number | null;
    types: CalendarEventType[];
    include_cancelled: boolean;
  };
  vets: CalendarVet[];
}

export interface OwnerCalendarResponse extends CalendarResponseBase {
  filters: {
    pet_id: number | null;
    types: CalendarEventType[];
    include_cancelled: boolean;
  };
}

export type CalendarResponse = StaffCalendarResponse | OwnerCalendarResponse;

/** Filtro de veterinario del personal: `me`, `all` o un id. */
export type CalendarVetFilter = 'me' | 'all' | number;

export interface CalendarQuery {
  /** "YYYY-MM-DD" (día de la clínica). */
  start: string;
  end: string;
  types?: CalendarEventType[];
  includeCancelled?: boolean;
}

export interface StaffCalendarQuery extends CalendarQuery {
  /** Sin valor: el servidor decide (vet → sus citas; admin/recepción → todas). */
  vetId?: CalendarVetFilter;
}

export interface OwnerCalendarQuery extends CalendarQuery {
  petId?: number;
}
