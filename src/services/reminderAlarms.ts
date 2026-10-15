/**
 * Programa los recordatorios locales calculados por `utils/reminders` (puros y
 * probados con TDD). Capa fina sobre expo-notifications: el `identifier`
 * estable de cada aviso hace la operación idempotente — reprogramar reemplaza,
 * nunca duplica. Los avisos suenan sin conexión (local-first).
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  clinicAgendaReminders,
  vaccinationScheduleReminders,
  type ReminderSpec,
} from '@/utils/reminders';
import { clinicToday, clinicWallTimeToInstant, shiftDayKey } from '@/utils/clinicTime';

import { listActiveVaccinationSchedules, listAdminAppointmentsUntil } from './admin';
import { ensureAlarmPermissions } from './alarms';
import { categoryEnabled } from './notificationPrefs';

export const REMINDERS_CHANNEL_ID = 'reminders';

/**
 * Presupuesto de recordatorios entre todas las familias (citas, vacunas,
 * pagos…). Las alarmas de medicación tienen el suyo (40); juntos quedan bajo
 * el límite de ~64 notificaciones programadas de iOS. Se priorizan las más
 * próximas.
 */
export const MAX_REMINDERS_TOTAL = 20;
export const REMINDER_KIND = 'reminder';

function dataOf(n: Notifications.NotificationRequest): Record<string, unknown> {
  return (n.content.data as Record<string, unknown> | null | undefined) ?? {};
}

let channelReady = false;

async function ensureChannel(): Promise<void> {
  if (channelReady || Platform.OS !== 'android') {
    channelReady = true;
    return;
  }
  await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL_ID, {
    name: 'Recordatorios de citas y vacunas',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
  channelReady = true;
}

/** Avisos de vacunas y desparasitaciones anteriores a la familia por mascota. */
export const LEGACY_VACCINATION_REMINDER = /^vacc-\d+-due$/;
export const LEGACY_DEWORMING_REMINDER = /^dew-\d+-due$/;

/**
 * Sincroniza la FAMILIA de avisos del prefijo dado: cancela los programados de
 * esa familia que ya no aplican (p. ej. un pago que se saldó) y programa o
 * reemplaza los vigentes, respetando el opt-out por categoría. Sin permiso de
 * notificaciones, solo cancela.
 */
export async function syncReminders(
  prefix: string,
  specs: ReminderSpec[],
  /** Identificadores de versiones anteriores de esta familia (se cancelan). */
  legacy?: RegExp,
): Promise<void> {
  const sorted = specs
    .filter((s) => categoryEnabled(s.category))
    .sort((a, b) => Date.parse(a.triggerAt) - Date.parse(b.triggerAt));

  let othersScheduled = 0;
  let scheduled: Notifications.NotificationRequest[] = [];
  try {
    scheduled = await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    // Sin acceso a las programadas: se sigue con la reprogramación.
  }
  for (const n of scheduled) {
    const ours = n.identifier.startsWith(prefix) || legacy?.test(n.identifier);
    if (!ours && dataOf(n).kind === REMINDER_KIND) othersScheduled += 1;
  }
  // Las más próximas primero, dentro del presupuesto que dejan las demás familias.
  const enabled = sorted.slice(0, Math.max(0, MAX_REMINDERS_TOTAL - othersScheduled));
  const wanted = new Set(enabled.map((s) => s.identifier));

  const stale: Promise<void>[] = [];
  for (const n of scheduled) {
    const ours = n.identifier.startsWith(prefix) || legacy?.test(n.identifier);
    if (ours && !wanted.has(n.identifier)) {
      stale.push(Notifications.cancelScheduledNotificationAsync(n.identifier));
    }
  }
  await Promise.allSettled(stale);

  if (enabled.length === 0) return;
  const granted = await ensureAlarmPermissions();
  if (!granted) return;
  await ensureChannel();

  await Promise.allSettled(
    enabled.map((spec) =>
      Notifications.scheduleNotificationAsync({
        identifier: spec.identifier,
        content: {
          title: spec.title,
          body: spec.body,
          sound: 'default',
          data: { kind: REMINDER_KIND, category: spec.category },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(spec.triggerAt),
          channelId: REMINDERS_CHANNEL_ID,
        },
      }),
    ),
  );
}

/**
 * A3/V2 — resumen de la agenda de mañana (7:30 de la clínica). Cuenta las citas
 * de mañana con una consulta propia (hasta el fin de mañana), no con la página
 * que la agenda tenga cargada: con más de una página de citas de hoy, la cuenta
 * salía 0 y el aviso se cancelaba.
 */
export async function syncClinicAgendaReminder(now: Date = new Date()): Promise<void> {
  const dayAfterTomorrow = shiftDayKey(clinicToday(now), 2);
  const until = new Date(
    Date.parse(clinicWallTimeToInstant(dayAfterTomorrow, '00:00')) - 1,
  ).toISOString();
  const appointments = await listAdminAppointmentsUntil(until);
  await syncReminders('agenda-', clinicAgendaReminders(appointments, now.toISOString()));
}

/** A10 — aviso el día previo a cada vacunación programada (esquemas activos). */
export async function syncVaccinationScheduleReminders(
  now: Date = new Date(),
): Promise<void> {
  const schedules = await listActiveVaccinationSchedules();
  await syncReminders(
    'vsched-',
    vaccinationScheduleReminders(schedules, now.toISOString()),
  );
}

/** Cancela los recordatorios programados de una categoría (se apagó en Preferencias). */
export async function cancelRemindersOfCategory(category: string): Promise<void> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.allSettled(
      all
        .filter(
          (n) => dataOf(n).kind === REMINDER_KIND && dataOf(n).category === category,
        )
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    // Sin acceso al programador.
  }
}
