/**
 * Servicio Admin (staff) contra el backend real `../pawcare`.
 * Endpoints JSON del namespace /admin/*-list (índices) + métricas.
 * Requiere sesión de staff (User) con Bearer.
 */
import type {
  Appointment,
  AvailableVet,
  Consultation,
  Deworming,
  MedicalProfile,
  MedicalReport,
  Payment,
  Pet,
  Vaccination,
} from '@/types/models';
import { api } from './api';

/** Registro de adopción del admin (adoptions-list / show). */
export interface AdoptionRecord {
  id: number;
  adoption_date?: string | null;
  notes?: string | null;
  created_at?: string | null;
  pet: { id: number; name: string; species: string } | null;
  adopter?: { id: number; full_name?: string; email?: string } | null;
  processed_by?: { id: number; full_name?: string } | null;
}

/** Esquema de vacunación (admin vaccination-schedules-list). */
export interface VaccinationSchedule {
  id: number;
  pet_id: number;
  schedule_type: string;
  start_date?: string | null;
  status: string;
  pet: { id: number; name: string; species: string } | null;
}

/** Consulta completa (con recetas y exámenes) — /admin/consultations/:id. */
export async function getAdminConsultation(id: number): Promise<Consultation> {
  const { consultation } = await api.get<{ consultation: Consultation }>(
    `/admin/consultations/${id}`,
  );
  return consultation;
}

export async function listVaccinationSchedules(): Promise<VaccinationSchedule[]> {
  const { schedules } = await api.get<{ schedules: VaccinationSchedule[] }>(
    '/admin/vaccination-schedules-list',
  );
  return schedules;
}

export async function listAdminMedicalReports(): Promise<MedicalReport[]> {
  const { medical_reports } = await api.get<{ medical_reports: MedicalReport[] }>(
    '/admin/medical-reports-list',
  );
  return medical_reports;
}

export async function getAdminMedicalReport(id: number): Promise<MedicalReport> {
  const { medical_report } = await api.get<{ medical_report: MedicalReport }>(
    `/admin/medical_reports/${id}`,
  );
  return medical_report;
}

// --- Listas paginadas ------------------------------------------------------
//
// El backend pagina (25 por defecto, máximo 100 por página). Los selectores no
// pueden quedarse con la primera página: buscan en el servidor (`search`) o,
// para conjuntos acotados (las mascotas de UN dueño), recorren todas las
// páginas.

interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

const MAX_PER_PAGE = 100;

/** Recorre todas las páginas de un índice paginado. */
async function fetchAllPages<T>(
  path: string,
  key: string,
  params: Record<string, string | number | undefined>,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const res = await api.get<Record<string, unknown> & { pagination?: Pagination }>(
      path,
      { params: { ...params, page, per_page: MAX_PER_PAGE } },
    );
    items.push(...((res[key] as T[] | undefined) ?? []));
    if (!res.pagination || page >= res.pagination.total_pages) return items;
  }
}

export interface AdminSearchOptions {
  /** Búsqueda en el servidor (nombre, correo, documento…). */
  search?: string;
}

export async function listAdminPets(options: AdminSearchOptions = {}): Promise<Pet[]> {
  const res = await api.get<{ pets: Pet[] }>('/admin/pets-list', {
    params: { search: options.search || undefined },
  });
  return res.pets;
}

/** Todas las mascotas activas de un dueño (todas las páginas). */
export async function listAdminPetsByOwner(ownerId: number): Promise<Pet[]> {
  return fetchAllPages<Pet>('/admin/pets-list', 'pets', {
    proprietary_id: ownerId,
    proprietary_type: 'Owner',
  });
}

export async function listAdminAppointments(): Promise<Appointment[]> {
  // El backend filtra por `scope` (default "upcoming" = solo futuras). La agenda
  // del admin filtra por estado en el cliente, así que pedimos TODAS las citas
  // (cualquier fecha). `per_page` alto para que los filtros locales sean completos.
  const res = await api.get<{ appointments: Appointment[] }>('/admin/appointments-list', {
    params: { scope: 'all', per_page: 100 },
  });
  return res.appointments;
}

export async function listAdminPayments(): Promise<Payment[]> {
  const res = await api.get<{ payments: Payment[] }>('/admin/payments-list');
  return res.payments;
}

export async function listAdminConsultations(): Promise<Consultation[]> {
  const res = await api.get<{ consultations: Consultation[] }>(
    '/admin/consultations-list',
  );
  return res.consultations;
}

export async function listAdminVaccinations(): Promise<Vaccination[]> {
  const res = await api.get<{ vaccinations: Vaccination[] }>('/admin/vaccinations-list');
  return res.vaccinations;
}

export async function listAdminDewormings(): Promise<Deworming[]> {
  const res = await api.get<{ dewormings: Deworming[] }>('/admin/dewormings-list');
  return res.dewormings;
}

export async function listAdminAdoptions(): Promise<AdoptionRecord[]> {
  const res = await api.get<{ adoptions: AdoptionRecord[] }>('/admin/adoptions-list');
  return res.adoptions;
}

export async function getAdminAdoption(id: number): Promise<AdoptionRecord> {
  const { adoption } = await api.get<{ adoption: AdoptionRecord }>(
    `/admin/adoptions/${id}`,
  );
  return adoption;
}

export interface AdminAdoptionInput {
  pet_id: number;
  adopter_id: number;
  adoption_date: string;
  notes?: string;
}

export async function createAdminAdoption(
  input: AdminAdoptionInput,
): Promise<AdoptionRecord> {
  const { adoption } = await api.post<{ adoption: AdoptionRecord }>('/admin/adoptions', {
    adoption: input,
  });
  return adoption;
}

export interface AdminMetrics {
  consultations?: number;
  revenue?: number;
  completed_appointments?: number;
  cancelled_appointments?: number;
  new_patients?: number;
  vaccinations?: number;
  adoptions?: number;
  active_sponsorships?: number;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const res = await api.get<{ data: AdminMetrics }>('/admin/metrics/dashboard');
  return res.data;
}

// --- Dueños (para selección en formularios) --------------------------------

export interface AdminOwner {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
}

export async function listAdminOwners(
  options: AdminSearchOptions = {},
): Promise<AdminOwner[]> {
  const res = await api.get<{ owners: AdminOwner[] }>('/admin/owners-list', {
    params: { search: options.search || undefined },
  });
  return res.owners;
}

// --- Escritura de pacientes (admin) ----------------------------------------

export interface AdminPetInput {
  name: string;
  species: string;
  breed?: string;
  sex?: string;
  birth_date?: string;
  distinctive_features?: string;
  proprietary_id: number;
}

export async function getAdminPet(id: number): Promise<Pet> {
  const { pet } = await api.get<{ pet: Pet }>(`/admin/pets/${id}`);
  return pet;
}

export async function createAdminPet(input: AdminPetInput): Promise<Pet> {
  // El dueño es siempre un Owner; el backend exige proprietary_type explícito
  // (si no, queda null y la mascota no se asocia al dueño).
  const { pet } = await api.post<{ pet: Pet }>('/admin/pets', {
    pet: { ...input, proprietary_type: 'Owner' },
  });
  return pet;
}

export async function updateAdminPet(
  id: number,
  input: Partial<AdminPetInput>,
): Promise<Pet> {
  const { pet } = await api.patch<{ pet: Pet }>(`/admin/pets/${id}`, { pet: input });
  return pet;
}

// --- Registro de pago (admin) ----------------------------------------------

export interface AdminRegisterPaymentInput {
  payment_method: string;
  paid_at?: string;
  transaction_id?: string;
  provider?: string;
  payment_reference?: string;
  notes?: string;
}

export async function getAdminPayment(id: number): Promise<Payment> {
  const { payment } = await api.get<{ payment: Payment }>(`/admin/payments/${id}`);
  return payment;
}

export async function registerAdminPayment(
  id: number,
  input: AdminRegisterPaymentInput,
): Promise<Payment> {
  const { payment } = await api.post<{ payment: Payment }>(
    `/admin/payments/${id}/register`,
    input,
  );
  return payment;
}

// --- Creación de registros médicos (admin) ---------------------------------

export interface AdminConsultationInput {
  pet_id: number;
  /** Cita que se atiende: el backend la marca completada (no cancelada, misma mascota). */
  appointment_id?: number;
  consultation_date: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  weight?: number;
  temperature?: number;
}

export async function createAdminConsultation(
  input: AdminConsultationInput,
): Promise<Consultation> {
  const { consultation } = await api.post<{ consultation: Consultation }>(
    '/admin/consultations',
    { consultation: input },
  );
  return consultation;
}

export async function deleteAdminConsultation(id: number): Promise<void> {
  await api.delete<unknown>(`/admin/consultations/${id}`);
}

export interface AdminVaccinationInput {
  pet_id: number;
  vaccine_name: string;
  manufacturer?: string;
  dose?: string;
  application_date: string;
  next_due_date?: string;
}

export async function createAdminVaccination(
  input: AdminVaccinationInput,
): Promise<Vaccination> {
  const { vaccination } = await api.post<{ vaccination: Vaccination }>(
    '/admin/vaccinations',
    { vaccination: input },
  );
  return vaccination;
}

// --- Agendado de citas (admin) ---------------------------------------------

/** Servicio clínico (admin services-list). */
export interface AdminService {
  id: number;
  name: string;
  description?: string | null;
  duration_minutes?: number | null;
}

export async function listAdminServices(
  options: AdminSearchOptions = {},
): Promise<AdminService[]> {
  const { services } = await api.get<{ services: AdminService[] }>(
    '/admin/services-list',
    { params: { search: options.search || undefined } },
  );
  return services;
}

/** Días disponibles ("YYYY-MM-DD") para un mes/año dados. */
export async function getAdminAvailableDays(
  month: number,
  year: number,
): Promise<string[]> {
  const { available_days } = await api.get<{ available_days: string[] }>(
    '/admin/appointments/available-days',
    { params: { month, year } },
  );
  return available_days;
}

export async function getAdminAvailableVets(date: string): Promise<AvailableVet[]> {
  const { available_vets } = await api.get<{ available_vets: AvailableVet[] }>(
    '/admin/appointments/available-vets',
    { params: { date } },
  );
  return available_vets;
}

/** Bloque horario del backend admin (con disponibilidad real). */
export interface AdminTimeSlot {
  time: string;
  available: boolean;
}

export async function getAdminTimeSlots(
  date: string,
  vetId: number,
  serviceId: number,
): Promise<AdminTimeSlot[]> {
  const { time_slots } = await api.get<{ time_slots: AdminTimeSlot[] }>(
    '/admin/appointments/time-slots',
    { params: { date, vet_id: vetId, service_id: serviceId } },
  );
  return time_slots;
}

export interface AdminAppointmentInput {
  pet_id: number;
  service_id: number;
  owner_id: number;
  assigned_to_id: number;
  scheduled_at: string; // ISO 8601
  notes?: string;
}

export async function createAdminAppointment(
  input: AdminAppointmentInput,
): Promise<Appointment> {
  const { appointment } = await api.post<{ appointment: Appointment }>(
    '/admin/appointments',
    { appointment: input },
  );
  return appointment;
}

/**
 * Detalle de una cita (incluye pagos y `allowed_status_transitions`). Una cita
 * eliminada (borrado lógico) responde 404.
 */
export async function getAdminAppointment(id: number): Promise<Appointment> {
  const { appointment } = await api.get<{ appointment: Appointment }>(
    `/admin/appointments/${id}`,
  );
  return appointment;
}

/**
 * "Eliminar" es un borrado lógico: los pagos abiertos se cancelan. El backend
 * lo bloquea (422 con el motivo) si la cita tiene consulta o pagos cobrados.
 */
export async function deleteAdminAppointment(id: number): Promise<void> {
  await api.delete<unknown>(`/admin/appointments/${id}`);
}

/** Perfil médico de una mascota (admin). Resuelve el dueño desde el paciente. */
export async function getAdminMedicalProfile(
  petId: number,
): Promise<MedicalProfile | null> {
  const pet = await getAdminPet(petId);
  if (pet.proprietary_id === undefined || pet.proprietary_id === null) return null;
  const { profile } = await api.get<{ profile: MedicalProfile | null }>(
    `/admin/owners/${pet.proprietary_id}/pets/${petId}/medical_profile`,
  );
  return profile;
}
