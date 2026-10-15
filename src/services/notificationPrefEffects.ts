/**
 * Aplica en el acto un cambio de Preferencias de notificaciones a lo ya
 * programado en el teléfono. Antes solo se guardaba la preferencia: las
 * alarmas de medicación nunca la miraban y los recordatorios ya programados
 * seguían sonando hasta la siguiente sincronización.
 */
import type { SqlExecutor } from '@/db/sqlExecutor';

import { cancelMedicationAlarms, syncAllTreatmentAlarms } from './alarms';
import { createNotificationPrefs } from './notificationPrefs';
import { cancelRemindersOfCategory } from './reminderAlarms';
import { createTreatmentsRepo } from './treatments';

export async function applyNotificationPref(
  exec: SqlExecutor,
  category: string,
  enabled: boolean,
): Promise<void> {
  createNotificationPrefs(exec).setEnabled(category, enabled);
  if (category === 'tratamientos') {
    if (enabled) await syncAllTreatmentAlarms(createTreatmentsRepo(exec), true);
    else await cancelMedicationAlarms();
    return;
  }
  // Al reactivar, los recordatorios se reprograman en la próxima sincronización
  // de su pantalla (citas, vacunas, pagos…).
  if (!enabled) await cancelRemindersOfCategory(category);
}
