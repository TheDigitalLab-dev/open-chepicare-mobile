/**
 * Integración REAL de la edición de pacientes del personal.
 */
import * as authService from '@/services/auth';
import * as adminService from '@/services/admin';
import * as petsService from '@/services/pets';
import * as secureStore from '@/utils/secureStore';
import { ApiError } from '@/types/api';

const BASE = () => process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

afterEach(async () => {
  await secureStore.clearTokens();
});

it('reasignar a un propietario una mascota de un miembro del personal la pasa a «Owner»', async () => {
  // Antes `updateAdminPet` enviaba solo `proprietary_id`: el tipo seguía siendo
  // «User» y la mascota quedaba ligada al miembro del personal con ese id.
  await authService.login('owner1@example.com', 'password123');
  const ownerId = (await authService.fetchCurrentUser()).id;
  const admin = await authService.login('admin@chepicare.com', 'password123');

  // Preparación con la API real: mascota del propio admin (personal).
  const token = await secureStore.getAccessToken();
  const res = await fetch(`${BASE()}/admin/pets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pet: {
        name: 'QA-Pet-Personal',
        species: 'cat',
        sex: 'female',
        proprietary_id: admin.id,
        proprietary_type: 'User',
      },
    }),
  });
  expect(res.status).toBe(201);
  const { pet: staffPet } = (await res.json()) as { pet: { id: number } };

  const updated = await adminService.updateAdminPet(staffPet.id, {
    proprietary_id: ownerId,
  });
  expect(updated.proprietary_type).toBe('Owner');
  expect(updated.proprietary_id).toBe(ownerId);

  // Limpieza: ahora es de owner1, que la elimina.
  await authService.login('owner1@example.com', 'password123');
  await petsService.deletePet(staffPet.id);
}, 30000);

it('una fecha de nacimiento futura se rechaza con el mensaje en español', async () => {
  await authService.login('owner1@example.com', 'password123');
  const [pet] = await petsService.listPets();
  const err = await petsService
    .updatePet(pet!.id, { birth_date: '2999-01-01' })
    .catch((e: unknown) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect((err as ApiError).message).toContain(
    'La fecha de nacimiento no puede ser futura',
  );
  expect((err as ApiError).message).not.toMatch(/future/i);
}, 30000);
