/**
 * Soporte de tests del emparejamiento por QR (SOLO tests).
 *
 * Genera un código REAL con el mismo endpoint que usa el Perfil de la web
 * (`POST /profile/pairing-codes`) para la cuenta dueña del token (personal o
 * propietario), y lista/revoca sus dispositivos como lo hace la web. Nada se
 * simula: el QR resultante es el que mostraría la web.
 */
import type { PairingAccountType } from '@/types/pairing';

const BASE = () => process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export interface IssuedPairingCode {
  code: string;
  qr_payload: string;
  server_url: string;
  expires_at: string;
  account_type: PairingAccountType;
}

export interface PairedDevice {
  id: number;
  device_name: string | null;
  platform: string | null;
  account_type: PairingAccountType;
  push_enabled: boolean;
}

function headers(accessToken: string): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' };
}

export async function issuePairingCode(accessToken: string): Promise<IssuedPairingCode> {
  const res = await fetch(`${BASE()}/profile/pairing-codes`, {
    method: 'POST',
    headers: headers(accessToken),
  });
  if (!res.ok) throw new Error(`pairing-codes falló (${res.status})`);
  return (await res.json()) as IssuedPairingCode;
}

export async function listPairedDevices(accessToken: string): Promise<PairedDevice[]> {
  const res = await fetch(`${BASE()}/profile/paired-devices`, {
    headers: headers(accessToken),
  });
  if (!res.ok) throw new Error(`paired-devices falló (${res.status})`);
  const body = (await res.json()) as { paired_devices: PairedDevice[] };
  return body.paired_devices;
}

/** Revoca un dispositivo emparejado, como el botón «Revocar» del Perfil web. */
export async function revokePairedDevice(accessToken: string, id: number): Promise<void> {
  const res = await fetch(`${BASE()}/profile/paired-devices/${id}`, {
    method: 'DELETE',
    headers: headers(accessToken),
  });
  if (res.status !== 204) throw new Error(`revocar falló (${res.status})`);
}
