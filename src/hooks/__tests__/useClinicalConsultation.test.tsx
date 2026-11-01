import { act, renderHook } from '@testing-library/react-native';
import { useClinicalConsultation } from '@/hooks/useClinicalConsultation';
import * as auth from '@/services/auth';
import * as admin from '@/services/admin';
import type { ClinicalConsultationInput } from '@/types/clinical';
import { clinicToday } from '@/utils/clinicTime';
import { clearTokens } from '@/utils/secureStore';

it('evita que dos pulsaciones creen dos consultas en el backend real', async () => {
  await auth.login('vet@chepicare.com', 'password123');
  const pet = (await admin.listAdminPets())[0]!;
  const data: ClinicalConsultationInput = {
    consultation: {
      pet_id: pet.id,
      consultation_date: clinicToday(),
      anamnesis: `Integración ${Date.now()}`,
    },
    medications: [],
    labExams: [],
    vaccinations: [],
    dewormings: [],
  };
  const { result } = renderHook(useClinicalConsultation);
  let saved: Awaited<ReturnType<typeof result.current.submit>> = null;
  try {
    await act(async () => {
      const outcomes = await Promise.all([
        result.current.submit(data),
        result.current.submit(data),
      ]);
      expect(outcomes.filter(Boolean)).toHaveLength(1);
      saved = outcomes.find(Boolean) ?? null;
    });
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBeNull();
    expect(
      (await admin.listAdminConsultations()).items.filter(
        (item) => item.anamnesis === data.consultation.anamnesis,
      ),
    ).toHaveLength(1);
  } finally {
    if (saved)
      await admin.deleteAdminConsultation(
        (saved as { consultation: { id: number } }).consultation.id,
      );
    await clearTokens();
  }
}, 30000);
