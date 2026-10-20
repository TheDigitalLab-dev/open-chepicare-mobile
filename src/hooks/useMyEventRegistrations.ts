/**
 * "Mis inscripciones" del propietario (`GET /owner-event-registrations-list`,
 * activas y canceladas) y cancelar una desde la lista. La fila cancelada se
 * reemplaza por la que devuelve el servidor (estado y cupo al día).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { cancelEventRegistration, listMyEventRegistrations } from '@/services/events';
import { ApiError, toApiError } from '@/types/api';
import type { EventRegistration } from '@/types/events';
import { useAsync } from './useAsync';

export interface MyEventRegistrationsState {
  registrations: EventRegistration[];
  loading: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
  /** Inscripción que se está cancelando, o `null`. */
  cancellingId: number | null;
  actionError: ApiError | null;
  /** `true` si se canceló. */
  cancel: (id: number) => Promise<boolean>;
}

const NONE: EventRegistration[] = [];

async function fetchRegistrations(): Promise<EventRegistration[]> {
  return (await listMyEventRegistrations()).registrations;
}

export function useMyEventRegistrations(): MyEventRegistrationsState {
  const { data, loading, error, reload } = useAsync(fetchRegistrations);
  // Filas reemplazadas tras cancelar, hasta la próxima recarga.
  const [replaced, setReplaced] = useState<Map<number, EventRegistration>>(
    () => new Map(),
  );
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<ApiError | null>(null);

  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const reloadFresh = useCallback(async () => {
    setReplaced(new Map());
    await reload();
  }, [reload]);

  const cancel = useCallback(async (id: number) => {
    setCancellingId(id);
    setActionError(null);
    try {
      const { registration } = await cancelEventRegistration(id);
      if (mounted.current) {
        setReplaced((prev) => new Map(prev).set(id, registration));
      }
      return true;
    } catch (e) {
      if (mounted.current) setActionError(toApiError(e));
      return false;
    } finally {
      if (mounted.current) setCancellingId(null);
    }
  }, []);

  const all = data ?? NONE;

  return {
    registrations: replaced.size === 0 ? all : all.map((r) => replaced.get(r.id) ?? r),
    loading: loading && data === null,
    error,
    reload: reloadFresh,
    cancellingId,
    actionError,
    cancel,
  };
}
