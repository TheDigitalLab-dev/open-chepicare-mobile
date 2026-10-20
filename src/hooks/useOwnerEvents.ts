/**
 * Eventos próximos publicados de la clínica para el propietario
 * (`GET /owner-events-list`), con cupos y su inscripción si la tiene.
 */
import { listOwnerEvents } from '@/services/events';
import type { ApiError } from '@/types/api';
import type { ClinicEvent } from '@/types/events';
import { useAsync } from './useAsync';

export interface OwnerEventsState {
  events: ClinicEvent[];
  loading: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
}

const NO_EVENTS: ClinicEvent[] = [];

async function fetchEvents(): Promise<ClinicEvent[]> {
  return (await listOwnerEvents()).events;
}

export function useOwnerEvents(): OwnerEventsState {
  const { data, loading, error, reload } = useAsync(fetchEvents);
  return { events: data ?? NO_EVENTS, loading, error, reload };
}
