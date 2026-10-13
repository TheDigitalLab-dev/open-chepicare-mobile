/**
 * Datos médicos reales para los tests del propietario (SOLO tests): una
 * consulta con tratamiento, receta y examen de laboratorio, creada por el
 * personal del seed con la API real del backend. No toca la sesión de la app
 * (usa su propio token de admin), así el test sigue con el propietario.
 */
import { clinicToday } from '@/utils/clinicTime';
import { seedAdminAccessToken } from './seedCredentials';

const BASE = () => process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function adminRequest<T>(
  token: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE()}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return (text ? JSON.parse(text) : null) as T;
}

export interface TreatmentConsultation {
  consultationId: number;
  prescriptionId: number;
  /** Ítems de la receta, en el orden en que se crearon. */
  itemIds: number[];
  labExamId: number;
  /** Nombre único del examen y de la receta (para buscarlos en pantalla). */
  label: string;
  /** Elimina la consulta (borrado lógico): no ensucia los listados. */
  cleanup: () => Promise<void>;
}

/**
 * Consulta de hoy para `petId` con tratamiento, una receta de dos
 * medicamentos y un hemograma pendiente.
 */
export async function createTreatmentConsultation(
  petId: number,
): Promise<TreatmentConsultation> {
  const token = await seedAdminAccessToken();
  const label = `QA ${Date.now().toString(36)}`;
  const { consultation } = await adminRequest<{ consultation: { id: number } }>(
    token,
    'POST',
    '/admin/consultations',
    {
      consultation: {
        pet_id: petId,
        consultation_date: clinicToday(),
        diagnosis: `Otitis ${label}`,
        treatment: `Tratamiento ${label}`,
      },
    },
  );
  const cleanup = async () => {
    await adminRequest(token, 'DELETE', `/admin/consultations/${consultation.id}`).catch(
      () => undefined,
    );
  };
  try {
    const { prescription } = await adminRequest<{
      prescription: { id: number; items: { id: number }[] };
    }>(token, 'POST', `/admin/consultations/${consultation.id}/prescriptions`, {
      prescription: {
        diagnosis: `Receta ${label}`,
        general_instructions: 'Con comida',
        prescription_items: [
          {
            medication_name: `Amoxicilina ${label}`,
            dose: '250 mg',
            frequency: 'Cada 12 horas',
            duration: '7 días',
          },
          {
            medication_name: `Meloxicam ${label}`,
            dose: '1 gota',
            frequency: 'Cada 24 horas',
            duration: '3 días',
          },
        ],
      },
    });
    const { lab_exam } = await adminRequest<{ lab_exam: { id: number } }>(
      token,
      'POST',
      `/admin/consultations/${consultation.id}/lab_exams`,
      { lab_exam: { exam_type: 'hemograma', exam_name: `Hemograma ${label}` } },
    );
    return {
      consultationId: consultation.id,
      prescriptionId: prescription.id,
      itemIds: prescription.items.map((i) => i.id),
      labExamId: lab_exam.id,
      label,
      cleanup,
    };
  } catch (e) {
    await cleanup();
    throw e;
  }
}

/** La clínica da el examen por completado (ya no admite cambios del propietario). */
export async function completeLabExamAsStaff(
  consultationId: number,
  labExamId: number,
): Promise<void> {
  const token = await seedAdminAccessToken();
  await adminRequest(
    token,
    'PATCH',
    `/admin/consultations/${consultationId}/lab_exams/${labExamId}`,
    { lab_exam: { status: 'completed' } },
  );
}

// --- Archivos reales para subir ----------------------------------------------

/** PDF mínimo válido (cabecera, catálogo, una página y trailer). */
export const SAMPLE_PDF_BYTES = new TextEncoder().encode(
  [
    '%PDF-1.4',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >> endobj',
    'trailer << /Root 1 0 R >>',
    '%%EOF',
    '',
  ].join('\n'),
);

/** PNG de 1 × 1 píxel (transparente). */
export const SAMPLE_PNG_BYTES = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
);
