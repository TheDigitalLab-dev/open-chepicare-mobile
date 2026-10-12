/**
 * Capacidades del servidor conectado y lo que la UI puede mostrar del
 * asistente IA. Se recarga sola cuando cambia el servidor (QR o ajustes).
 */
import { useEffect } from 'react';

import { subscribeServerUrl } from '@/config/serverConfig';
import { assistantAvailability, getCapabilities } from '@/services/server';
import type { ApiError } from '@/types/api';
import type { AssistantAvailability, ServerCapabilities } from '@/types/assistant';
import { useAsync } from './useAsync';

export interface ServerCapabilitiesState {
  capabilities: ServerCapabilities | null;
  availability: AssistantAvailability;
  loading: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
}

export function useServerCapabilities(): ServerCapabilitiesState {
  const { data, loading, error, reload } = useAsync(getCapabilities);

  useEffect(() => subscribeServerUrl(() => void reload()), [reload]);

  return {
    capabilities: data,
    availability: assistantAvailability(data),
    loading,
    error,
    reload,
  };
}
