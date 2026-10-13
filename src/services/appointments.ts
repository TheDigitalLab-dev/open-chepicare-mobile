/**
 * Servicio de Citas (owner) contra el backend real `../open-chepicare-web`.
 * Controllers JSON: owner_appointments, owner_services, owner_availability.
 * Requiere sesión de Owner (Bearer).
 */
import type { Appointment, AvailableVet, Service, TimeSlot } from '@/types/models';
import { learnClinicTimeZone, learnFromAppointments } from '@/utils/clinicTime';
import { api } from './api';
import { fetchAllPages } from './pagination';

// Cada respuesta de cita trae la zona de la clínica (`time_zone`): es la única
// fuente para el propietario, que no puede leer Configuración General.
function learned(appointment: Appointment): Appointment {
  learnClinicTimeZone(appointment.time_zone);
  return appointment;
}

export interface AppointmentInput {
  pet_id: number;
  service_id: number;
  assigned_to_id: number;
  scheduled_at: string; // ISO 8601
  notes?: string;
}

/** Campos editables de una cita (`notes: ""` vacía las notas). */
export type AppointmentUpdate = Partial<AppointmentInput>;

export interface AppointmentFilters {
  status?: string;
  pet_id?: number;
  search?: string;
}

export async function listAppointments(
  filters: AppointmentFilters = {},
): Promise<Appointment[]> {
  // Todas las páginas: la lista separa próximas/pasadas en el teléfono.
  const appointments = await fetchAllPages<'appointments', Appointment>(
    '/owner-appointments-list',
    'appointments',
    { status: filters.status, pet_id: filters.pet_id, search: filters.search },
  );
  return learnFromAppointments(appointments);
}

export async function getAppointment(id: number): Promise<Appointment> {
  const { appointment } = await api.get<{ appointment: Appointment }>(
    `/owner-appointments/${id}`,
  );
  return learned(appointment);
}

export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  const { appointment } = await api.post<{ appointment: Appointment }>(
    '/owner-appointments',
    { appointment: input },
  );
  return learned(appointment);
}

/** Reprograma o edita una cita pendiente o confirmada (PATCH). */
export async function updateAppointment(
  id: number,
  input: AppointmentUpdate,
): Promise<Appointment> {
  const { appointment } = await api.patch<{ appointment: Appointment }>(
    `/owner-appointments/${id}`,
    { appointment: input },
  );
  return learned(appointment);
}

export async function confirmAppointment(id: number): Promise<Appointment> {
  const { appointment } = await api.post<{ appointment: Appointment }>(
    `/owner-appointments/${id}/confirm`,
  );
  return learned(appointment);
}

export async function cancelAppointment(
  id: number,
  cancellationReason?: string,
): Promise<Appointment> {
  const { appointment } = await api.post<{ appointment: Appointment }>(
    `/owner-appointments/${id}/cancel`,
    { cancellation_reason: cancellationReason },
  );
  return learned(appointment);
}

// --- Datos para agendar -----------------------------------------------------

export async function listServices(): Promise<Service[]> {
  const { services } = await api.get<{ services: Service[] }>('/owner-services-list');
  return services;
}

/** Días disponibles como fechas ISO ("YYYY-MM-DD") para un mes/año dados. */
export async function getAvailableDays(month: number, year: number): Promise<string[]> {
  const { available_days } = await api.get<{ available_days: string[] }>(
    '/owner-available-days',
    { params: { month, year } },
  );
  return available_days;
}

export async function getAvailableVets(date: string): Promise<AvailableVet[]> {
  const { available_vets } = await api.get<{ available_vets: AvailableVet[] }>(
    '/owner-available-vets',
    { params: { date } },
  );
  return available_vets;
}

/**
 * Horarios libres ("HH:MM") de un veterinario para un día y servicio. Los
 * calcula el servidor: excluye horas pasadas, ocupadas y las que cruzan
 * ausencias o cierres, en todos los turnos del veterinario.
 *
 * Al reprogramar, `excludeAppointmentId` (una cita propia) hace que esa cita no
 * cuente como ocupada: su horario y los que solo chocaban con ella se ofrecen.
 * Un id ajeno el servidor lo ignora.
 */
export async function getAvailableTimeSlots(
  date: string,
  vetId: number,
  serviceId: number,
  excludeAppointmentId?: number,
): Promise<TimeSlot[]> {
  const { time_slots, time_zone } = await api.get<{
    time_slots: TimeSlot[];
    time_zone?: string;
  }>('/owner-time-slots', {
    params: {
      date,
      vet_id: vetId,
      service_id: serviceId,
      exclude_appointment_id: excludeAppointmentId,
    },
  });
  learnClinicTimeZone(time_zone);
  return time_slots;
}
