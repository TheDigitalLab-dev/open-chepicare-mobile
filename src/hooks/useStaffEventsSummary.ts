/**
 * Resumen de SOLO LECTURA de los eventos próximos para el personal en la app
 * (`GET /admin/events-summary`): título, fechas y "N inscritos de M". La app
 * del personal no gestiona eventos ni ve a los inscritos (eso es la web).
 *
 * Un 403 (rol sin `events:read`) no es un error que mostrar: la sección
 * simplemente no está disponible para ese usuario (`available: false`).
 */
import { getStaffEventsSummary } from '@/services/events';
import type { ApiError } from '@/types/api';
import type { StaffEventSummary } from '@/types/events';
import { useAsync } from './useAsync';

export interface StaffEventsSummaryState {
  events: StaffEventSummary[];
  /** `false` si el usuario no tiene permiso de ver eventos. */
  available: boolean;
  loading: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
}

const NO_EVENTS: StaffEventSummary[] = [];

async function fetchSummary(): Promise<StaffEventSummary[]> {
  return (await getStaffEventsSummary()).events;
}

export function useStaffEventsSummary(): StaffEventsSummaryState {
  const { data, loading, error, reload } = useAsync(fetchSummary);
  const forbidden = error?.kind === 'forbidden';
  return {
    events: data ?? NO_EVENTS,
    available: !forbidden,
    loading: loading && data === null,
    error: forbidden ? null : error,
    reload,
  };
}
