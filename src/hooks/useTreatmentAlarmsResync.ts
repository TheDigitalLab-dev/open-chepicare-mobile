/**
 * Mantiene al día las alarmas de medicación de los tratamientos activos: al
 * abrir la app y cada vez que vuelve al primer plano. Cada tratamiento agenda
 * como mucho 20 tomas; sin esto, si el dueño no marcaba las tomas, las
 * alarmas se acababan a mitad del tratamiento. No pide permisos (solo
 * reprograma si ya están concedidos) ni rompe si la base local falla.
 */
import { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

import { initDatabase } from '@/db/database';
import type { SqlExecutor } from '@/db/sqlExecutor';
import { syncAllTreatmentAlarms } from '@/services/alarms';
import { createNotificationPrefs } from '@/services/notificationPrefs';
import { createTreatmentsRepo } from '@/services/treatments';

export async function resyncTreatmentAlarms(exec: SqlExecutor): Promise<void> {
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  await syncAllTreatmentAlarms(
    createTreatmentsRepo(exec),
    createNotificationPrefs(exec).isEnabled('tratamientos'),
  );
}

export function useTreatmentAlarmsResync(executor?: SqlExecutor): void {
  const exec = useMemo(() => {
    try {
      return executor ?? initDatabase();
    } catch {
      return null; // base local no disponible: no hay tratamientos que reprogramar
    }
  }, [executor]);

  useEffect(() => {
    if (!exec) return undefined;
    const run = () => {
      resyncTreatmentAlarms(exec).catch(() => {
        // Se reintenta al volver al primer plano.
      });
    };
    run();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => subscription.remove();
  }, [exec]);
}
