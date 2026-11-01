import * as auth from '@/services/auth';
import * as admin from '@/services/admin';
import { clearTokens } from '@/utils/secureStore';
import type { StaffPatientIdentity } from '@/types/models';

beforeAll(async () => {
  await auth.login('vet@chepicare.com', 'password123');
});
afterAll(clearTokens);

it('identifica paciente y tutor en vacunas y desparasitaciones reales', async () => {
  const records = [
    ...(await admin.listAdminVaccinations()).items.slice(0, 3),
    ...(await admin.listAdminDewormings()).items.slice(0, 3),
  ];
  expect(records.length).toBeGreaterThan(0);
  for (const record of records) {
    const patient = (record as typeof record & { pet: StaffPatientIdentity }).pet;
    const pet = await admin.getAdminPet(patient.id);
    expect(patient.name).toBe(pet.name);
    expect(patient.proprietary).toEqual(
      pet.proprietary
        ? {
            id: pet.proprietary.id,
            type: pet.proprietary_type,
            full_name: pet.proprietary.full_name,
          }
        : null,
    );
  }
});
