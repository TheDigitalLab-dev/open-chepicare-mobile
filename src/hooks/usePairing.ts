/**
 * Emparejamiento con un servidor por código QR: valida lo escaneado, canjea el
 * código y entrega la sesión a quien llama (`onPaired`). Ignora lecturas
 * repetidas de la cámara mientras canjea o después de emparejar.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { PairingUriError, parsePairingUri, redeemPairing } from '@/services/pairing';
import { describeThisDevice } from '@/services/pushNotifications';
import { toApiError } from '@/types/api';
import type { PairingResult } from '@/types/pairing';

export type PairingStatus = 'idle' | 'pairing' | 'paired' | 'error';

export interface PairingState {
  status: PairingStatus;
  error: string | null;
  serverName: string | null;
  /** Procesa el texto de un QR (o de un deep link `pawcare://pair`). */
  pair: (raw: string) => Promise<void>;
  reset: () => void;
}

function pairingErrorMessage(e: unknown): string {
  if (e instanceof PairingUriError) return e.message;
  const error = toApiError(e);
  if (error.status === 429)
    return 'Demasiados intentos. Espera un minuto y vuelve a escanear.';
  if (error.kind === 'network' || error.kind === 'timeout') {
    return 'No se pudo contactar al servidor del código. Verifica que el teléfono tenga acceso a esa dirección.';
  }
  return error.message;
}

export function usePairing({
  onPaired,
}: {
  onPaired: (result: PairingResult) => void;
}): PairingState {
  const [status, setStatus] = useState<PairingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [serverName, setServerName] = useState<string | null>(null);
  const locked = useRef(false);
  const onPairedRef = useRef(onPaired);

  useEffect(() => {
    onPairedRef.current = onPaired;
  });

  const pair = useCallback(async (raw: string) => {
    if (locked.current) return;
    locked.current = true;
    setStatus('pairing');
    setError(null);
    try {
      const payload = parsePairingUri(raw);
      const result = await redeemPairing(payload, await describeThisDevice());
      setServerName(result.serverName);
      setStatus('paired');
      onPairedRef.current(result);
      // Queda bloqueado: el QR ya se usó.
    } catch (e) {
      setError(pairingErrorMessage(e));
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    locked.current = false;
    setStatus('idle');
    setError(null);
  }, []);

  return { status, error, serverName, pair, reset };
}
