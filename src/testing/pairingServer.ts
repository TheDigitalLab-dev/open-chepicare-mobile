/**
 * Soporte de tests del emparejamiento por QR (SOLO tests).
 *
 * Genera un código REAL con el mismo endpoint que usa el Perfil de la web
 * (`POST /profile/pairing-codes`) para el usuario dueño del token. Nada se
 * simula: el QR resultante es el que mostraría la web.
 */
const BASE = () => process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export interface IssuedPairingCode {
  code: string;
  qr_payload: string;
  server_url: string;
  expires_at: string;
}

export async function issuePairingCode(accessToken: string): Promise<IssuedPairingCode> {
  const res = await fetch(`${BASE()}/profile/pairing-codes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`pairing-codes falló (${res.status})`);
  return (await res.json()) as IssuedPairingCode;
}

export async function listPairedDevices(
  accessToken: string,
): Promise<{ id: number; device_name: string | null; push_enabled: boolean }[]> {
  const res = await fetch(`${BASE()}/profile/paired-devices`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`paired-devices falló (${res.status})`);
  const body = (await res.json()) as {
    paired_devices: { id: number; device_name: string | null; push_enabled: boolean }[];
  };
  return body.paired_devices;
}
