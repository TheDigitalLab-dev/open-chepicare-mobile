import * as auth from '@/services/auth';
import * as admin from '@/services/admin';
import { clearTokens } from '@/utils/secureStore';

beforeAll(async () => {
  await auth.login('admin@chepicare.com', 'password123');
});
afterAll(clearTokens);

it('abre el perfil médico real directamente por paciente, incluso sin tutor', async () => {
  const pets = await admin.listAdminPets();
  expect(pets.length).toBeGreaterThan(0);
  for (const pet of pets) {
    const profile = await admin.getAdminMedicalProfile(pet.id);
    expect(profile).not.toBeNull();
    expect(profile!.pet_id).toBe(pet.id);
  }
});

it('carga el historial completo filtrado por paciente desde las rutas clínicas reales', async () => {
  const pet = (await admin.listAdminPets()).find((item) => item.name === 'Max')!;
  expect(pet).toBeDefined();
  const history = await admin.getAdminPatientHistory(pet.id);
  expect(history.consultations.length).toBeGreaterThan(0);
  expect(history.vaccinations.length).toBeGreaterThan(0);
  expect(history.dewormings.length).toBeGreaterThan(0);
  expect(history.consultations.every((item) => item.pet_id === pet.id)).toBe(true);
  expect(history.vaccinations.every((item) => item.pet_id === pet.id)).toBe(true);
  expect(history.dewormings.every((item) => item.pet_id === pet.id)).toBe(true);
  expect(history.reports.every((item) => item.pet_id === pet.id)).toBe(true);
});
