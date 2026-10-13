/**
 * Integración REAL de los registros médicos del owner contra `../open-chepicare-web`.
 * Usa la primera mascota real del owner sembrado.
 */
import * as authService from '@/services/auth';
import * as medicalService from '@/services/medical';
import * as petsService from '@/services/pets';
import * as secureStore from '@/utils/secureStore';

let petId: number;

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
  const pets = await petsService.listPets();
  petId = pets[0]!.id;
});

afterAll(async () => {
  await secureStore.clearTokens();
});

describe('medicalService (lecturas reales por mascota)', () => {
  it('obtiene el perfil médico (o null)', async () => {
    const profile = await medicalService.getMedicalProfile(petId);
    if (profile) {
      expect(Array.isArray(profile.chronic_diseases)).toBe(true);
      expect(Array.isArray(profile.allergies)).toBe(true);
    } else {
      expect(profile).toBeNull();
    }
  });

  it('lista consultas, vacunas, desparasitaciones y reportes', async () => {
    const [consultations, vaccinations, dewormings, reports] = await Promise.all([
      medicalService.listConsultations(petId),
      medicalService.listVaccinations(petId),
      medicalService.listDewormings(petId),
      medicalService.listMedicalReports(petId),
    ]);

    expect(Array.isArray(consultations)).toBe(true);
    expect(Array.isArray(vaccinations)).toBe(true);
    expect(Array.isArray(dewormings)).toBe(true);
    expect(Array.isArray(reports)).toBe(true);

    if (consultations.length > 0) {
      expect(consultations[0]).toHaveProperty('veterinarian');
      expect(consultations[0]).toHaveProperty('prescriptions');
    }
  });
});
