/**
 * Programación de recordatorios locales sobre el registro de notificaciones del
 * sistema (shim nativo en memoria). Datos REALES del backend (vacunas y
 * desparasitaciones de las mascotas de owner1).
 */
import * as Notifications from 'expo-notifications';

import * as authService from '@/services/auth';
import * as medicalService from '@/services/medical';
import * as petsService from '@/services/pets';
import { syncReminders } from '@/services/reminderAlarms';
import { vaccinationReminders } from '@/utils/reminders';
import * as secureStore from '@/utils/secureStore';
import type { Vaccination } from '@/types/models';

const scheduledIds = async () =>
  (await Notifications.getAllScheduledNotificationsAsync()).map((n) => n.identifier);

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

beforeEach(async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
});

/** Vacuna real con la próxima dosis movida al futuro (para que tenga aviso). */
function upcoming(v: Vaccination, i: number): Vaccination {
  return { ...v, next_due_date: `2099-0${(i % 9) + 1}-15` };
}

it('abrir las vacunas de otra mascota no cancela los avisos de la primera', async () => {
  const [petA, petB] = await petsService.listPets();
  const vaccA = (await medicalService.listVaccinations(petA!.id)).map(upcoming);
  const vaccB = (await medicalService.listVaccinations(petB!.id)).map(upcoming);
  expect(vaccA.length).toBeGreaterThan(0);
  const now = new Date().toISOString();

  // Lo que hace VaccinationsScreen al abrir cada mascota.
  await syncReminders(`vacc-p${petA!.id}-`, vaccinationReminders(vaccA, now, petA!.id));
  await syncReminders(`vacc-p${petB!.id}-`, vaccinationReminders(vaccB, now, petB!.id));

  const ids = await scheduledIds();
  for (const v of vaccA) expect(ids).toContain(`vacc-p${petA!.id}-${v.id}-due`);
  for (const v of vaccB) expect(ids).toContain(`vacc-p${petB!.id}-${v.id}-due`);
});

it('limpia los avisos con el identificador antiguo (sin mascota) de la familia', async () => {
  await Notifications.scheduleNotificationAsync({
    identifier: 'vacc-77-due',
    content: { title: 'viejo' },
    trigger: null,
  });
  await syncReminders('vacc-p1-', [], /^vacc-\d+-due$/);
  expect(await scheduledIds()).not.toContain('vacc-77-due');
});
