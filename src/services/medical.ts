/**
 * Servicio de Registros Médicos (owner, solo lectura) contra `../pawcare-web`.
 * Controllers JSON: owner_medical_profiles, owner_consultations,
 * owner_vaccinations, owner_dewormings, owner_medical_reports.
 * Endpoints anidados bajo /pets/:pet_id/*. Requiere Owner (Bearer).
 */
import type {
  Consultation,
  Deworming,
  MedicalProfile,
  MedicalReport,
  Vaccination,
} from '@/types/models';
import { api } from './api';
import { fetchAllPages } from './pagination';

export async function getMedicalProfile(petId: number): Promise<MedicalProfile | null> {
  const { profile } = await api.get<{ profile: MedicalProfile | null }>(
    `/pets/${petId}/medical_profile`,
  );
  return profile;
}

export async function listConsultations(petId: number): Promise<Consultation[]> {
  // Todas las páginas: el detalle de una consulta y sus exámenes se buscan aquí.
  return fetchAllPages<'consultations', Consultation>(
    `/pets/${petId}/consultations`,
    'consultations',
  );
}

export async function listVaccinations(petId: number): Promise<Vaccination[]> {
  const { vaccinations } = await api.get<{ vaccinations: Vaccination[] }>(
    `/pets/${petId}/vaccinations`,
  );
  return vaccinations;
}

export async function listDewormings(petId: number): Promise<Deworming[]> {
  const { dewormings } = await api.get<{ dewormings: Deworming[] }>(
    `/pets/${petId}/dewormings`,
  );
  return dewormings;
}

export async function listMedicalReports(petId: number): Promise<MedicalReport[]> {
  const { medical_reports } = await api.get<{ medical_reports: MedicalReport[] }>(
    `/pets/${petId}/medical_reports`,
  );
  return medical_reports;
}

export async function getMedicalReport(
  petId: number,
  id: number,
): Promise<MedicalReport> {
  const { medical_report } = await api.get<{ medical_report: MedicalReport }>(
    `/pets/${petId}/medical_reports/${id}`,
  );
  return medical_report;
}
