/**
 * Alarmas de medicación y recordatorios sobre SQLite REAL (`node:sqlite`) y el
 * registro de notificaciones del sistema (shim nativo en memoria).
 */
import { DatabaseSync } from 'node:sqlite';
import * as Notifications from 'expo-notifications';

import { applyMigrations } from '@/db/migrations';
import type { SqlExecutor } from '@/db/sqlExecutor';
import { MAX_REMINDERS_TOTAL, syncReminders } from '@/services/reminderAlarms';
import { MEDICATION_KIND, syncTreatmentAlarms } from '@/services/alarms';
import { applyNotificationPref } from '@/services/notificationPrefEffects';
import { createTreatmentsRepo } from '@/services/treatments';
import { resyncTreatmentAlarms } from '@/hooks/useTreatmentAlarmsResync';
import type { ReminderSpec } from '@/utils/reminders';

function nodeExecutor(db: DatabaseSync): SqlExecutor {
  return {
    exec: (sql) => db.exec(sql),
    run: (sql, params = []) => {
      db.prepare(sql).run(...(params as never[]));
    },
    all: <T>(sql: string, params: unknown[] = []) =>
      db.prepare(sql).all(...(params as never[])) as T[],
    get: <T>(sql: string, params: unknown[] = []) =>
      (db.prepare(sql).get(...(params as never[])) as T | undefined) ?? undefined,
  };
}

const HOUR_MS = 3_600_000;

async function scheduled(kind?: string) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return kind
    ? all.filter((n) => (n.content.data as { kind?: string } | null)?.kind === kind)
    : all;
}

function appointmentSpecs(n: number): ReminderSpec[] {
  return Array.from({ length: n }, (_, i) => ({
    identifier: `appt-${i}-24h`,
    title: 'Cita',
    body: 'Mañana',
    triggerAt: new Date(Date.now() + (n - i) * HOUR_MS).toISOString(),
    category: 'citas',
  }));
}

let db: DatabaseSync;
let exec: SqlExecutor;

beforeEach(async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  db = new DatabaseSync(':memory:');
  exec = nodeExecutor(db);
  applyMigrations(exec);
});

afterEach(() => db.close());

/** Tratamiento cada 8 h durante 14 días: 42 tomas. */
function startLongTreatment() {
  return createTreatmentsRepo(exec).startTreatment({
    petId: 1,
    petName: 'Max',
    medicationName: 'Amoxicilina',
    dose: '250 mg',
    frequencyHours: 8,
    durationDays: 14,
    startedAt: new Date().toISOString(),
  });
}

it('los recordatorios no agotan las alarmas de medicación', async () => {
  // 40 citas futuras: antes ocupaban el presupuesto compartido (60) y el
  // tratamiento no recibía ninguna alarma.
  await syncReminders('appt-', appointmentSpecs(40));
  expect((await scheduled()).length).toBe(MAX_REMINDERS_TOTAL);
  // Se quedan las más próximas.
  const ids = (await scheduled()).map((n) => n.identifier);
  expect(ids).toContain('appt-39-24h');
  expect(ids).not.toContain('appt-0-24h');

  const repo = createTreatmentsRepo(exec);
  const t = startLongTreatment();
  await syncTreatmentAlarms(repo, t.id, {
    petName: 'Max',
    medicationName: 'A',
    dose: null,
  });
  expect((await scheduled(MEDICATION_KIND)).length).toBe(20);
});

it('al abrir la app se reprograman las tomas aunque no se hayan marcado', async () => {
  const repo = createTreatmentsRepo(exec);
  const t = startLongTreatment();
  await syncTreatmentAlarms(repo, t.id, {
    petName: 'Max',
    medicationName: 'A',
    dose: null,
  });
  // Las 20 alarmas ya sonaron / se descartaron sin que el dueño marcara nada.
  await Notifications.cancelAllScheduledNotificationsAsync();

  await resyncTreatmentAlarms(exec);
  expect((await scheduled(MEDICATION_KIND)).length).toBe(20);
});

it('apagar «Tratamientos» cancela las alarmas y encenderlo las repone', async () => {
  const repo = createTreatmentsRepo(exec);
  const t = startLongTreatment();
  await syncTreatmentAlarms(repo, t.id, {
    petName: 'Max',
    medicationName: 'A',
    dose: null,
  });
  await syncReminders('appt-', appointmentSpecs(3));

  await applyNotificationPref(exec, 'tratamientos', false);
  expect(await scheduled(MEDICATION_KIND)).toHaveLength(0);
  // Los recordatorios de otras categorías siguen.
  expect((await scheduled()).length).toBe(3);
  // Y no se reprograman al reabrir la app.
  await resyncTreatmentAlarms(exec);
  expect(await scheduled(MEDICATION_KIND)).toHaveLength(0);

  await applyNotificationPref(exec, 'tratamientos', true);
  expect((await scheduled(MEDICATION_KIND)).length).toBe(20);
});

it('apagar una categoría de recordatorios cancela los ya programados', async () => {
  await syncReminders('appt-', appointmentSpecs(3));
  await applyNotificationPref(exec, 'citas', false);
  expect(await scheduled()).toHaveLength(0);
});
