/**
 * Consulta del propietario con las acciones que hace en casa, todas en el
 * SERVIDOR:
 *  - completar cada medicamento de la receta (`/owner/prescription_items/:id/complete`);
 *    el último completa el tratamiento;
 *  - completar el tratamiento de la consulta (`complete_treatment`);
 *  - guardar y compartir la receta en PDF.
 *
 * El listado de consultas no trae `completed_at` de cada medicamento: el hook
 * recuerda los que se completaron en esta pantalla, y un "ya fue completado"
 * del servidor (p. ej. desde otro dispositivo) se refleja como completado. Con
 * el tratamiento completo, todos sus medicamentos lo están.
 */
import { useCallback, useState } from 'react';

import { useAsync } from '@/hooks/useAsync';
import {
  completePrescriptionItem,
  completeTreatment as completeTreatmentOnServer,
  listConsultations,
} from '@/services/medical';
import { saveAndShareRecipe } from '@/services/recipeFiles';
import { ApiError, toApiError } from '@/types/api';
import type { Consultation, PrescriptionItem } from '@/types/models';

const ALREADY_COMPLETED = 'El medicamento ya fue completado';
const TREATMENT_ALREADY_COMPLETED = 'El tratamiento ya fue completado';

/** Acción en curso: un medicamento, el tratamiento o la receta. */
export type ConsultationBusy = `item-${number}` | 'treatment' | 'recipe' | null;

export interface ConsultationCare {
  consultation: Consultation | null;
  loading: boolean;
  error: ApiError | null;
  /** Cargó y la consulta no está entre las de la mascota (ajena o eliminada). */
  notFound: boolean;
  reload: () => Promise<void>;
  treatmentCompleted: boolean;
  isItemCompleted: (item: PrescriptionItem) => boolean;
  completeItem: (itemId: number) => Promise<void>;
  completeTreatment: () => Promise<void>;
  exportRecipe: () => Promise<void>;
  busy: ConsultationBusy;
  actionError: string | null;
  notice: string | null;
}

export function useConsultationCare(
  petId: number,
  consultationId: number,
): ConsultationCare {
  const { data, loading, error, reload } = useAsync(() => listConsultations(petId));
  const consultation = (data ?? []).find((c) => c.id === consultationId) ?? null;
  const [completedItems, setCompletedItems] = useState<ReadonlySet<number>>(new Set());
  const [busy, setBusy] = useState<ConsultationBusy>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const treatmentCompleted = Boolean(consultation?.treatment_completed_at);

  const isItemCompleted = useCallback(
    (item: PrescriptionItem) =>
      treatmentCompleted || Boolean(item.completed_at) || completedItems.has(item.id),
    [treatmentCompleted, completedItems],
  );

  const run = useCallback(
    async (key: Exclude<ConsultationBusy, null>, action: () => Promise<void>) => {
      setBusy(key);
      setActionError(null);
      setNotice(null);
      try {
        await action();
      } catch (e) {
        setActionError(toApiError(e).message);
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const markCompleted = useCallback((itemId: number) => {
    setCompletedItems((prev) => new Set(prev).add(itemId));
  }, []);

  const completeItem = useCallback(
    (itemId: number) =>
      run(`item-${itemId}`, async () => {
        try {
          const { consultationCompleted } = await completePrescriptionItem(itemId);
          markCompleted(itemId);
          if (consultationCompleted) {
            await reload();
            setNotice('¡Tratamiento completado!');
          } else {
            setNotice('Medicamento marcado como completado.');
          }
        } catch (e) {
          if (
            e instanceof ApiError &&
            e.kind === 'validation' &&
            e.message === ALREADY_COMPLETED
          ) {
            markCompleted(itemId);
            setNotice('Este medicamento ya estaba completado.');
            return;
          }
          throw e;
        }
      }),
    [run, markCompleted, reload],
  );

  const completeTreatment = useCallback(
    () =>
      run('treatment', async () => {
        try {
          await completeTreatmentOnServer(consultationId);
        } catch (e) {
          const already =
            e instanceof ApiError &&
            e.kind === 'validation' &&
            e.message === TREATMENT_ALREADY_COMPLETED;
          if (!already) throw e;
        }
        await reload();
        setNotice('¡Tratamiento completado!');
      }),
    [run, consultationId, reload],
  );

  const exportRecipe = useCallback(
    () =>
      run('recipe', async () => {
        const saved = await saveAndShareRecipe(consultationId);
        setNotice(
          saved.shared
            ? 'Receta lista para compartir.'
            : `Receta guardada en el teléfono (${saved.filename}).`,
        );
      }),
    [run, consultationId],
  );

  return {
    consultation,
    loading,
    error,
    notFound: data !== null && consultation === null,
    reload,
    treatmentCompleted,
    isItemCompleted,
    completeItem,
    completeTreatment,
    exportRecipe,
    busy,
    actionError,
    notice,
  };
}
