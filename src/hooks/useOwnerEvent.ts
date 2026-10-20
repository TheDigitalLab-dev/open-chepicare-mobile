/**
 * Detalle de un evento para el propietario, con inscripción de un toque (los
 * datos salen de su cuenta: no hay formulario) y cancelación.
 *
 * - Tras inscribirse o cancelar, el evento se actualiza con el que devuelve el
 *   servidor (cupo al día) sin pedirlo de nuevo.
 * - Si el servidor rechaza la inscripción (cupo completo, cerrada, ya
 *   inscrito), el error queda en `actionError` y el evento se vuelve a pedir:
 *   el cupo mostrado es el real.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  cancelEventRegistration,
  getOwnerEvent,
  registerForEvent,
} from '@/services/events';
import { ApiError, toApiError } from '@/types/api';
import type { ClinicEvent, EventRegistration } from '@/types/events';
import {
  eventRegistrationState,
  type EventRegistrationState,
} from '@/utils/clinicEvents';
import { useAsync } from './useAsync';

export interface OwnerEventState {
  event: ClinicEvent | null;
  /** `null` mientras no hay evento. */
  state: EventRegistrationState | null;
  loading: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
  /** Inscripción en curso o cancelación en curso. */
  mutating: boolean;
  actionError: ApiError | null;
  /** `true` si quedó inscrito. */
  register: (notes?: string) => Promise<boolean>;
  /** `true` si se canceló su inscripción. */
  cancel: () => Promise<boolean>;
}

/** El evento que viene dentro de la inscripción, con `my_registration` al día. */
function eventFrom(registration: EventRegistration): ClinicEvent {
  const { event, ...summary } = registration;
  return {
    ...event,
    my_registration: summary.status === 'active' ? summary : null,
  };
}

export function useOwnerEvent(id: number): OwnerEventState {
  const { data, loading, error, reload } = useAsync(
    async () => (await getOwnerEvent(id)).event,
  );
  // Versión más nueva tras una mutación (la de `useAsync` queda atrás).
  const [updated, setUpdated] = useState<ClinicEvent | null>(null);
  const [mutating, setMutating] = useState(false);
  const [actionError, setActionError] = useState<ApiError | null>(null);

  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  // Una recarga deja de lado la versión de la mutación: manda el servidor.
  const reloadFresh = useCallback(async () => {
    setUpdated(null);
    await reload();
  }, [reload]);

  const event = updated ?? data;

  const mutate = useCallback(
    async (action: () => Promise<EventRegistration>): Promise<boolean> => {
      setMutating(true);
      setActionError(null);
      try {
        const registration = await action();
        if (mounted.current) setUpdated(eventFrom(registration));
        return true;
      } catch (e) {
        if (mounted.current) setActionError(toApiError(e));
        // El cupo o el estado cambiaron en el servidor: se muestra el real.
        if (mounted.current) await reloadFresh();
        return false;
      } finally {
        if (mounted.current) setMutating(false);
      }
    },
    [reloadFresh],
  );

  const register = useCallback(
    (notes?: string) =>
      mutate(async () => (await registerForEvent(id, { notes })).registration),
    [id, mutate],
  );

  const registrationId = event?.my_registration?.id;
  const cancel = useCallback(async () => {
    if (registrationId === undefined) return false;
    return mutate(
      async () => (await cancelEventRegistration(registrationId)).registration,
    );
  }, [registrationId, mutate]);

  return {
    event: event ?? null,
    state: event ? eventRegistrationState(event) : null,
    loading: loading && event === null,
    error: event ? null : error,
    reload: reloadFresh,
    mutating,
    actionError,
    register,
    cancel,
  };
}
