import * as auth from '@/services/auth';
import { createAdminVaccination, listAdminPets } from '@/services/admin';
import { listVaccinations } from '@/services/medical';
import { api } from '@/services/api';
import { vaccinationDueState } from '@/utils/vaccinationDue';
import { clinicToday, shiftDayKey } from '@/utils/clinicTime';
import { clearTokens } from '@/utils/secureStore';

const ids: number[] = [];
afterAll(async () => {
  await auth.login('vet@chepicare.com', 'password123');
  for (const id of ids) await api.delete(`/admin/vaccinations/${id}`);
  await clearTokens();
});

it('marca la próxima dosis vencida y deja de alertar cuando hay una aplicación posterior real', async () => {
  await auth.login('vet@chepicare.com', 'password123');
  const pet = (await listAdminPets()).find((item) => item.name === 'Max')!;
  const name = `Vacuna integración fechas ${Date.now()}`;
  const today = clinicToday();
  const old = await createAdminVaccination({
    pet_id: pet.id,
    vaccine_type: 'other',
    vaccine_name: name,
    application_date: shiftDayKey(today, -10),
    next_due_date: shiftDayKey(today, -1),
  });
  ids.push(old.id);
  await auth.login('owner1@example.com', 'password123');
  let history = await listVaccinations(pet.id);
  expect(
    vaccinationDueState(history.find((item) => item.id === old.id)!, history, today),
  ).toBe('overdue');
  await auth.login('vet@chepicare.com', 'password123');
  const latest = await createAdminVaccination({
    pet_id: pet.id,
    vaccine_type: 'other',
    vaccine_name: name,
    application_date: today,
    next_due_date: shiftDayKey(today, 365),
  });
  ids.push(latest.id);
  await auth.login('owner1@example.com', 'password123');
  history = await listVaccinations(pet.id);
  expect(
    vaccinationDueState(history.find((item) => item.id === old.id)!, history, today),
  ).toBeNull();
  expect(
    vaccinationDueState(history.find((item) => item.id === latest.id)!, history, today),
  ).toBe('upcoming');
}, 30000);
