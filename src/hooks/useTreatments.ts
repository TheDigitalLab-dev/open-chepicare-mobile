/**
 * Hook de tratamientos de medicación (local-first).
 *
 * Une el repositorio local (SQLite en el dispositivo) con las alarmas locales:
 * "Tratamiento iniciado" ancla el horario al momento actual, cada mutación
 * refresca la lista y reprograma las alarmas afectadas. Todo funciona sin
 * conexión; las filas quedan `sync_status = 'pending'` para la sincronización
 * diferida (F2–F4).
 *
 * Acepta un `SqlExecutor` inyectado (tests con `node:sqlite` real); en la app
 * usa la base local de `db/database.ts`.
 */
import { useCallback, useMemo, useState } from 'react';

import { initDatabase } from '@/db/database';
import type { SqlExecutor } from '@/db/sqlExecutor';
import {
  cancelDoseAlarms,
  ensureAlarmPermissions,
  syncTreatmentAlarms,
} from '@/services/alarms';
import { createNotificationCenter } from '@/services/notificationCenter';
import { createNotificationPrefs } from '@/services/notificationPrefs';
import {
  createTreatmentsRepo,
  type ActiveTreatment,
  type StartTreatmentInput,
} from '@/services/treatments';

export interface UseTreatments {
  treatments: ActiveTreatment[];
  /** true si el usuario negó el permiso de notificaciones (las tomas igual se registran). */
  permissionDenied: boolean;
  start(input: Omit<StartTreatmentInput, 'startedAt'>): Promise<void>;
  /** Marca la próxima toma pendiente como administrada ahora. */
  markTaken(treatment: ActiveTreatment): Promise<void>;
  /** Mueve la próxima toma ±minutos; las siguientes se desplazan igual. */
  moveNextDose(treatment: ActiveTreatment, deltaMinutes: number): Promise<void>;
  /** Da por terminado el tratamiento y cancela sus alarmas. */
  finish(treatment: ActiveTreatment): Promise<void>;
  reload(): void;
}

const MINUTE_MS = 60 * 1000;

export function useTreatments(executor?: SqlExecutor): UseTreatments {
  const exec = useMemo(() => executor ?? initDatabase(), [executor]);
  const repo = useMemo(() => createTreatmentsRepo(exec), [exec]);
  const center = useMemo(() => createNotificationCenter(exec), [exec]);
  const prefs = useMemo(() => createNotificationPrefs(exec), [exec]);
  // Preferencia «Tratamientos» apagada: las tomas se registran, sin alarmas.
  const alarmsOn = useCallback(() => prefs.isEnabled('tratamientos'), [prefs]);
  // Estado inicial perezoso: la primera lectura ocurre una sola vez al montar
  // (la base es local y síncrona); las mutaciones refrescan vía `reload`.
  const [treatments, setTreatments] = useState<ActiveTreatment[]>(() =>
    repo.listActiveTreatments(),
  );
  const [permissionDenied, setPermissionDenied] = useState(false);

  const reload = useCallback(() => {
    setTreatments(repo.listActiveTreatments());
  }, [repo]);

  const start = useCallback<UseTreatments['start']>(
    async (input) => {
      const created = repo.startTreatment({
        ...input,
        startedAt: new Date().toISOString(),
      });
      const granted = await ensureAlarmPermissions();
      setPermissionDenied(!granted);
      if (granted) {
        try {
          await syncTreatmentAlarms(
            repo,
            created.id,
            {
              petName: created.petName,
              medicationName: created.medicationName,
              dose: created.dose,
            },
            alarmsOn(),
          );
        } catch {
          // El tratamiento ya quedó registrado; las alarmas se reintentan en la
          // próxima acción sobre el tratamiento.
        }
      }
      center.add({
        type: 'tratamientos',
        title: '💊 Tratamiento iniciado',
        body: `${created.medicationName}${created.petName ? ` para ${created.petName}` : ''}: ${created.doses.length} tomas programadas.`,
      });
      reload();
    },
    [repo, center, reload, alarmsOn],
  );

  const markTaken = useCallback<UseTreatments['markTaken']>(
    async (treatment) => {
      const dose = treatment.nextDose;
      if (!dose) return;
      repo.markDoseTaken(dose.id, new Date().toISOString());
      try {
        // Si la toma se registró antes de que sonara, su alarma ya no aplica; y
        // se recargan las siguientes (la cota por tratamiento deja espacio).
        await cancelDoseAlarms([dose]);
        await syncTreatmentAlarms(
          repo,
          treatment.id,
          {
            petName: treatment.petName,
            medicationName: treatment.medicationName,
            dose: treatment.dose,
          },
          alarmsOn(),
        );
      } catch {
        // La toma ya quedó registrada; las alarmas se reintentan luego.
      }
      reload();
    },
    [repo, reload, alarmsOn],
  );

  const moveNextDose = useCallback<UseTreatments['moveNextDose']>(
    async (treatment, deltaMinutes) => {
      const dose = treatment.nextDose;
      if (!dose) return;
      const newTimeMs = Date.parse(dose.scheduledAt) + deltaMinutes * MINUTE_MS;
      // Una toma no puede moverse al pasado: quedaría pendiente para siempre
      // sin alarma (las alarmas solo se programan hacia el futuro).
      if (newTimeMs <= Date.now()) return;
      repo.rescheduleFromDose(dose.id, new Date(newTimeMs).toISOString());
      try {
        await syncTreatmentAlarms(
          repo,
          treatment.id,
          {
            petName: treatment.petName,
            medicationName: treatment.medicationName,
            dose: treatment.dose,
          },
          alarmsOn(),
        );
      } catch {
        // El horario ya quedó guardado; las alarmas se reintentan luego.
      }
      reload();
    },
    [repo, reload, alarmsOn],
  );

  const finish = useCallback<UseTreatments['finish']>(
    async (treatment) => {
      repo.finishTreatment(treatment.id, 'completed');
      await cancelDoseAlarms(repo.listDoses(treatment.id));
      center.add({
        type: 'tratamientos',
        title: '✅ Tratamiento finalizado',
        body: `${treatment.medicationName}: ${treatment.takenCount} de ${treatment.totalCount} tomas registradas.`,
      });
      reload();
    },
    [repo, center, reload],
  );

  return { treatments, permissionDenied, start, markTaken, moveNextDose, finish, reload };
}
