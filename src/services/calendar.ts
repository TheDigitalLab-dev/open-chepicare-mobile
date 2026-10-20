/**
 * Servicio de Calendario contra el backend real `../open-chepicare-web`:
 *  - `GET /owner-calendar-events` (propietario: citas, tratamientos, próximas
 *    vacunas y desparasitaciones de SUS mascotas).
 *  - `GET /admin/calendar-events` (personal con `appointments:read`; vacunas y
 *    desparasitaciones solo si su rol puede verlas).
 * Rango de días de la clínica, ambos incluidos, máximo 62 (400 si no).
 */
import type {
  CalendarQuery,
  CalendarResponse,
  OwnerCalendarQuery,
  OwnerCalendarResponse,
  StaffCalendarQuery,
  StaffCalendarResponse,
} from '@/types/calendar';
import type { QueryParams } from '@/types/api';
import { learnClinicTimeZone } from '@/utils/clinicTime';
import { api } from './api';

function baseParams(query: CalendarQuery): QueryParams {
  return {
    start: query.start,
    end: query.end,
    // El backend acepta `types=a,b` además de `types[]`.
    types: query.types?.join(','),
    include_cancelled: query.includeCancelled ? 'true' : undefined,
  };
}

// La respuesta trae la zona de la clínica: la única fuente para el propietario.
function learned<T extends CalendarResponse>(response: T): T {
  learnClinicTimeZone(response.range.time_zone);
  return response;
}

export async function getOwnerCalendarEvents(
  query: OwnerCalendarQuery,
): Promise<OwnerCalendarResponse> {
  const response = await api.get<OwnerCalendarResponse>('/owner-calendar-events', {
    params: { ...baseParams(query), pet_id: query.petId },
  });
  return learned(response);
}

export async function getStaffCalendarEvents(
  query: StaffCalendarQuery,
): Promise<StaffCalendarResponse> {
  const response = await api.get<StaffCalendarResponse>('/admin/calendar-events', {
    params: { ...baseParams(query), vet_id: query.vetId },
  });
  return learned(response);
}
