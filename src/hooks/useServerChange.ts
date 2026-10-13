/**
 * Confirmación previa a cambiar el servidor de la app.
 *
 * `request(target, proceed)`: si `target` es el mismo servidor, ejecuta
 * `proceed(null)` en el acto. Si es otro, deja el cambio pendiente (`pending`,
 * lo que muestra el diálogo) y no toca nada hasta que el usuario decide:
 *  - `cancel()`: descarta el cambio; servidor, sesión y push quedan intactos.
 *  - `confirm()`: sale del servidor actual (push dado de baja y sesión
 *    revocada, sin bloquear si no responde) y luego ejecuta `proceed(info)`,
 *    que apunta al servidor nuevo (guardar, restablecer o canjear el QR).
 * Mientras hay un cambio pendiente o en curso, otras peticiones se ignoran
 * (la cámara sigue leyendo el mismo QR).
 */
import { useCallback, useRef, useState } from 'react';

import {
  describeServerChange,
  isServerChange,
  leaveCurrentServer,
} from '@/services/serverChange';
import type { ServerChangeInfo } from '@/types/serverChange';

export type { ServerChangeInfo } from '@/types/serverChange';

/** Continúa el flujo que pidió el cambio; `info` es null si no hubo cambio. */
export type ProceedWithServer = (info: ServerChangeInfo | null) => Promise<void> | void;

export interface ServerChangeState {
  /** Cambio a la espera de confirmación (null si no hay ninguno). */
  pending: ServerChangeInfo | null;
  /** Cerrando la sesión en el servidor anterior tras confirmar. */
  leaving: boolean;
  request: (target: string, proceed: ProceedWithServer) => Promise<void>;
  confirm: () => Promise<void>;
  cancel: () => void;
}

interface PendingChange {
  info: ServerChangeInfo;
  proceed: ProceedWithServer;
}

export function useServerChange(): ServerChangeState {
  const [pending, setPending] = useState<ServerChangeInfo | null>(null);
  const [leaving, setLeaving] = useState(false);
  const busy = useRef(false);
  const change = useRef<PendingChange | null>(null);

  const request = useCallback(async (target: string, proceed: ProceedWithServer) => {
    if (busy.current) return;
    if (!isServerChange(target)) {
      await proceed(null);
      return;
    }
    busy.current = true;
    const info = await describeServerChange(target);
    change.current = { info, proceed };
    setPending(info);
  }, []);

  const cancel = useCallback(() => {
    if (!change.current) return;
    change.current = null;
    busy.current = false;
    setPending(null);
  }, []);

  const confirm = useCallback(async () => {
    const accepted = change.current;
    if (!accepted) return;
    change.current = null;
    setLeaving(true);
    try {
      await leaveCurrentServer();
      setPending(null);
      await accepted.proceed(accepted.info);
    } finally {
      busy.current = false;
      setLeaving(false);
    }
  }, []);

  return { pending, leaving, request, confirm, cancel };
}
