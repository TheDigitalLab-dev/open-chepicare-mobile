/**
 * Servicio de Eventos de la clínica contra el backend real `../open-chepicare-web`.
 *
 * Propietario (Bearer de propietario):
 *  - `GET /owner-events-list` · `GET /owner-events/:id`
 *  - `POST /owner-events/:id/register` (inscripción de un toque con los datos
 *    de su cuenta; `notes` opcional)
 *  - `GET /owner-event-registrations-list` · `POST /owner-event-registrations/:id/cancel`
 *
 * Personal (`events:read`): `GET /admin/events-summary`, el ÚNICO endpoint de
 * eventos que usa la app del personal (sin datos de los inscritos).
 */
import type {
  EventRegistrationResponse,
  EventRegistrationsResponse,
  OwnerEventResponse,
  OwnerEventsResponse,
  StaffEventsSummaryResponse,
} from '@/types/events';
import { learnClinicTimeZone } from '@/utils/clinicTime';
import { api } from './api';

// Las respuestas traen la zona de la clínica: las fechas se muestran en ella.
function learned<T extends { time_zone: string }>(response: T): T {
  learnClinicTimeZone(response.time_zone);
  return response;
}

export async function listOwnerEvents(): Promise<OwnerEventsResponse> {
  return learned(await api.get<OwnerEventsResponse>('/owner-events-list'));
}

export async function getOwnerEvent(id: number): Promise<OwnerEventResponse> {
  return learned(await api.get<OwnerEventResponse>(`/owner-events/${id}`));
}

export async function registerForEvent(
  id: number,
  options: { notes?: string } = {},
): Promise<EventRegistrationResponse> {
  const notes = options.notes?.trim();
  return api.post<EventRegistrationResponse>(
    `/owner-events/${id}/register`,
    notes ? { notes } : {},
  );
}

export async function listMyEventRegistrations(): Promise<EventRegistrationsResponse> {
  return learned(
    await api.get<EventRegistrationsResponse>('/owner-event-registrations-list'),
  );
}

export async function cancelEventRegistration(
  id: number,
): Promise<EventRegistrationResponse> {
  return api.post<EventRegistrationResponse>(`/owner-event-registrations/${id}/cancel`);
}

export async function getStaffEventsSummary(): Promise<StaffEventsSummaryResponse> {
  return learned(await api.get<StaffEventsSummaryResponse>('/admin/events-summary'));
}
