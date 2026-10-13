/**
 * Emparejamiento con un servidor por código QR (de personal o de propietario):
 * valida lo escaneado, canjea el código y entrega la sesión a quien llama
 * (`onPaired`). Ignora lecturas repetidas de la cámara mientras canjea o
 * después de emparejar.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { PairingUriError, parsePairingUri, redeemPairing } from '@/services/pairing';
import { describeThisDevice } from '@/services/pushNotifications';
import { toApiError } from '@/types/api';
import type { PairingAccountType, PairingResult } from '@/types/pairing';

export type PairingStatus = 'idle' | 'pairing' | 'paired' | 'error';

export interface PairingState {
  status: PairingStatus;
  error: string | null;
  serverName: string | null;
  /**
   * Cuenta que se está conectando: la que anuncia el QR mientras se canjea y la
   * de la sesión abierta al terminar. `null` si aún no se sabe.
   */
  accountType: PairingAccountType | null;
  /** Procesa el texto de un QR (o de un deep link `pawcare://pair`). */
  pair: (raw: string) => Promise<void>;
  reset: () => void;
}

const SPENT_CODE = /inválido o vencido/i;

function pairingErrorMessage(e: unknown): string {
  if (e instanceof PairingUriError) return e.message;
  const error = toApiError(e);
  if (error.status === 422 && SPENT_CODE.test(error.message)) {
    return 'El código venció o ya se usó (o se generó uno más reciente). Genera uno nuevo en tu perfil de la web y escanéalo antes de 10 minutos.';
  }
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
  const [accountType, setAccountType] = useState<PairingAccountType | null>(null);
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
    setAccountType(null);
    try {
      const payload = parsePairingUri(raw);
      setAccountType(payload.account ?? null);
      const result = await redeemPairing(payload, await describeThisDevice());
      setServerName(result.serverName);
      setAccountType(result.accountType);
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
    setAccountType(null);
  }, []);

  return { status, error, serverName, accountType, pair, reset };
}
