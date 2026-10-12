/**
 * Suscribe la pantalla al tiempo real del asistente (ActionCable). Todas las
 * pantallas comparten un único WebSocket; devuelve el estado de la conexión
 * para que el hook que la usa decida si hace polling de respaldo.
 */
import { useEffect, useRef, useState } from 'react';

import { subscribeAiUpdates, type AiUpdatesStatus } from '@/services/aiUpdates';
import type { AiUpdate } from '@/types/assistant';

export function useAiUpdates(
  onUpdate: (update: AiUpdate) => void,
  enabled = true,
): AiUpdatesStatus {
  const [status, setStatus] = useState<AiUpdatesStatus>('closed');
  const handler = useRef(onUpdate);

  useEffect(() => {
    handler.current = onUpdate;
  });

  useEffect(() => {
    if (!enabled) return undefined;
    return subscribeAiUpdates({
      onUpdate: (update) => handler.current(update),
      onStatus: setStatus,
    });
  }, [enabled]);

  return enabled ? status : 'closed';
}
