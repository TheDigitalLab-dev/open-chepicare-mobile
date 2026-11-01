import * as auth from '@/services/auth';
import * as admin from '@/services/admin';
import { saveClinicalConsultation } from '@/services/clinicalConsultations';
import { listConsultations } from '@/services/medical';
import type { ClinicalConsultationInput } from '@/types/clinical';
import { clinicToday } from '@/utils/clinicTime';
import { clearTokens } from '@/utils/secureStore';
import { cleanupClinicalConsultation } from '@/testing/medicalData';

let created: number | undefined;
afterEach(async () => {
  if (created !== undefined) {
    await auth.login('vet@chepicare.com', 'password123');
    await cleanupClinicalConsultation(created);
    created = undefined;
  }
  await clearTokens();
});

async function input(): Promise<ClinicalConsultationInput> {
  await auth.login('vet@chepicare.com', 'password123');
  const pet = (await admin.listAdminPets()).find((item) => item.name === 'Max')!;
  return {
    consultation: {
      pet_id: pet.id,
      consultation_date: clinicToday(),
      anamnesis: 'Seguimiento clínico de integración',
      diagnosis: 'Control',
      weight: 12.5,
      heart_rate: 80,
      respiratory_rate: 20,
    },
    medications: [
      {
        medication_name: 'Medicación de integración',
        dose: '1 ml',
        frequency: 'Cada 12 horas',
        duration: '3 días',
      },
    ],
    labExams: [
      {
        exam_type: 'hemograma',
        exam_name: 'Hemograma de integración',
        clinical_signs: 'Control',
        special_instructions: 'Entregar resultados',
      },
    ],
    vaccinations: [{ vaccine_type: 'rabies', vaccine_name: 'Antirrábica', dose: '1 ml' }],
    dewormings: [
      {
        product_name: 'Desparasitante de integración',
        dose: '1 tableta',
        parasite_type: 'both',
        administration_route: 'oral',
      },
    ],
  };
}

it('registra consulta, receta, orden pendiente, vacuna y desparasitación, visibles para el propietario', async () => {
  const data = await input();
  const result = await saveClinicalConsultation(data);
  created = result.consultation.id;
  expect(result.failures).toEqual([]);
  const detail = await admin.getAdminConsultation(created);
  expect(detail.anamnesis).toBe(data.consultation.anamnesis);
  expect(detail.prescriptions[0]!.items[0]!.dose).toBe('1 ml');
  expect(detail.lab_exams[0]!.status).toBe('pending');
  expect(detail.vaccinations_in_consultation).toHaveLength(1);
  expect(detail.dewormings_in_consultation).toHaveLength(1);
  expect(detail.dewormings_in_consultation![0]!.parasite_type).toBe('both');
  await auth.login('owner1@example.com', 'password123');
  const owner = (await listConsultations(data.consultation.pet_id)).find(
    (item) => item.id === created,
  )!;
  expect(owner.lab_exams[0]!.exam_name).toBe('Hemograma de integración');
  expect(owner.prescriptions[0]!.items[0]!.medication_name).toBe(
    'Medicación de integración',
  );
  expect(owner.vaccinations_in_consultation).toHaveLength(1);
  expect(owner.dewormings_in_consultation).toHaveLength(1);
}, 30000);

it('reintenta solo lo fallido y conserva los registros ya guardados', async () => {
  const data = await input();
  data.dewormings[0]!.weight_at_application = -1;
  const first = await saveClinicalConsultation(data);
  created = first.consultation.id;
  expect(first.failures.map((item) => item.key)).toEqual(['deworming-0']);
  data.dewormings[0]!.weight_at_application = 12.5;
  const retry = await saveClinicalConsultation(data, first);
  expect(retry.consultation.id).toBe(created);
  expect(retry.failures).toEqual([]);
  const detail = await admin.getAdminConsultation(created);
  expect(detail.prescriptions).toHaveLength(1);
  expect(detail.lab_exams).toHaveLength(1);
}, 30000);
