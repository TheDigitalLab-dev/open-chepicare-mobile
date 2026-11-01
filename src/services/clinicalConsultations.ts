import type { ClinicalConsultationInput, ClinicalSaveProgress } from '@/types/clinical';
import { createAdminConsultation } from './admin';
import { api } from './api';

/** Mismo contrato que el asistente web; reintentar conserva los registros guardados. */
export async function saveClinicalConsultation(
  input: ClinicalConsultationInput,
  previous?: ClinicalSaveProgress,
): Promise<ClinicalSaveProgress> {
  for (const item of input.medications) {
    if (!item.medication_name.trim() || !item.dose.trim() || !item.frequency.trim()) {
      throw new Error('Completa medicamento, dosis y frecuencia de cada receta.');
    }
  }
  const consultation =
    previous?.consultation ?? (await createAdminConsultation(input.consultation));
  const completed = new Set(previous?.completedSteps ?? []);
  const steps: { key: string; label: string; run: () => Promise<unknown> }[] = [];
  if (input.medications.length)
    steps.push({
      key: 'prescription',
      label: 'Receta',
      run: () =>
        api.post(`/admin/consultations/${consultation.id}/prescriptions`, {
          prescription: {
            diagnosis: input.consultation.diagnosis,
            general_instructions: input.prescriptionInstructions,
            prescription_items: input.medications,
          },
        }),
    });
  input.labExams.forEach((labExam, index) =>
    steps.push({
      key: `lab-${index}`,
      label: `Examen: ${labExam.exam_name}`,
      run: () =>
        api.post(`/admin/consultations/${consultation.id}/lab_exams`, {
          lab_exam: labExam,
        }),
    }),
  );
  const common = {
    pet_id: consultation.pet_id,
    consultation_id: consultation.id,
    application_date: input.consultation.consultation_date.slice(0, 10),
  };
  input.vaccinations.forEach((vaccination, index) =>
    steps.push({
      key: `vaccination-${index}`,
      label: `Vacuna: ${vaccination.vaccine_name}`,
      run: () =>
        api.post('/admin/vaccinations', { vaccination: { ...vaccination, ...common } }),
    }),
  );
  input.dewormings.forEach((deworming, index) =>
    steps.push({
      key: `deworming-${index}`,
      label: `Desparasitación: ${deworming.product_name}`,
      run: () =>
        api.post('/admin/dewormings', {
          deworming: {
            weight_at_application: input.consultation.weight,
            ...deworming,
            ...common,
          },
        }),
    }),
  );
  const pending = steps.filter((step) => !completed.has(step.key));
  const outcomes = await Promise.allSettled(pending.map((step) => step.run()));
  const failures: ClinicalSaveProgress['failures'] = [];
  outcomes.forEach((outcome, index) => {
    const step = pending[index]!;
    if (outcome.status === 'fulfilled') completed.add(step.key);
    else
      failures.push({
        key: step.key,
        label: step.label,
        message:
          outcome.reason instanceof Error
            ? outcome.reason.message
            : 'No se pudo guardar.',
      });
  });
  return { consultation, completedSteps: [...completed], failures };
}
