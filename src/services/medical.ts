/**
 * Servicio de Registros Médicos del propietario contra `../open-chepicare-web`.
 * Controllers JSON: owner_medical_profiles, owner_consultations,
 * owner_vaccinations, owner_dewormings, owner_medical_reports,
 * owner_lab_exams y owner_prescription_items.
 * Lecturas anidadas bajo /pets/:pet_id/*; acciones bajo /owner/*. Requiere
 * Owner (Bearer). Lo ajeno o inexistente responde 404.
 */
import type {
  Consultation,
  Deworming,
  LabExam,
  LabExamAttachment,
  MedicalProfile,
  MedicalReport,
  PrescriptionItem,
  Vaccination,
} from '@/types/models';
import type { UploadSource } from '@/types/uploads';
import { api, buildApiError } from './api';
import { fetchAllPages } from './pagination';
import { uploadForm } from './uploads';

// Archivos de hasta 10 MB: más margen que el timeout por defecto.
const UPLOAD_TIMEOUT_MS = 120_000;

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

// --- Exámenes de laboratorio --------------------------------------------------

/**
 * Sube un archivo (jpg, png, webp o pdf, hasta 10 MB) a un examen pendiente o
 * en proceso. `file_url` de la respuesta es relativa al servidor.
 */
export async function uploadLabExamFile(
  labExamId: number,
  file: UploadSource,
  description?: string,
): Promise<LabExamAttachment> {
  const { attachment } = await api.upload<{ attachment: LabExamAttachment }>(
    `/owner/lab_exams/${labExamId}/files`,
    uploadForm('file', file, { description: description?.trim() }),
    { timeoutMs: UPLOAD_TIMEOUT_MS },
  );
  return attachment;
}

/** Carga los resultados ("parámetro → valor"); el examen pasa a "en proceso". */
export async function updateLabExamResults(
  labExamId: number,
  results: Record<string, string>,
): Promise<LabExam> {
  const { lab_exam } = await api.patch<{ lab_exam: LabExam }>(
    `/owner/lab_exams/${labExamId}/results`,
    { results },
  );
  return lab_exam;
}

// --- Tratamiento --------------------------------------------------------------

export interface CompletedPrescriptionItem {
  item: PrescriptionItem;
  /** true si con este medicamento quedó completo todo el tratamiento. */
  consultationCompleted: boolean;
}

/** Marca un medicamento de la receta como completado en el servidor. */
export async function completePrescriptionItem(
  itemId: number,
): Promise<CompletedPrescriptionItem> {
  const { prescription_item, consultation_completed } = await api.post<{
    prescription_item: PrescriptionItem;
    consultation_completed: boolean;
  }>(`/owner/prescription_items/${itemId}/complete`);
  return { item: prescription_item, consultationCompleted: consultation_completed };
}

/** Da por completado el tratamiento de la consulta en el servidor. */
export async function completeTreatment(consultationId: number): Promise<Consultation> {
  const { consultation } = await api.post<{ consultation: Consultation }>(
    `/owner/consultations/${consultationId}/complete_treatment`,
  );
  return consultation;
}

// --- Receta en PDF ------------------------------------------------------------

export interface RecipePdf {
  /** Nombre seguro para guardar el archivo ("receta-….pdf"). */
  filename: string;
  bytes: Uint8Array;
}

/**
 * Nombre del archivo de `Content-Disposition`, reducido a caracteres seguros
 * (sin rutas): se usa para escribir el archivo en el teléfono.
 */
export function recipeFilename(
  disposition: string | null,
  consultationId: number,
): string {
  const match = disposition ? /filename="?([^";]+)"?/i.exec(disposition) : null;
  const raw = match?.[1]?.split(/[\\/]/).pop() ?? '';
  const safe = raw.replace(/[^\w.-]/g, '_').replace(/^\.+/, '');
  return safe.toLowerCase().endsWith('.pdf') && safe.length > 4
    ? safe
    : `receta-${consultationId}.pdf`;
}

/**
 * Descarga la receta de la consulta. Pasa por el cliente de la app: con el
 * access token vencido renueva la sesión y reintenta. Los errores llegan en
 * JSON (404 ajena, 422 si no se pudo generar).
 */
export async function downloadRecipePdf(consultationId: number): Promise<RecipePdf> {
  const res = await api.raw(`/owner/consultations/${consultationId}/export_recipe`, {
    headers: { Accept: 'application/pdf' },
    timeoutMs: UPLOAD_TIMEOUT_MS,
  });
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    throw buildApiError(res.status, body);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  return {
    filename: recipeFilename(res.headers.get('content-disposition'), consultationId),
    bytes,
  };
}
