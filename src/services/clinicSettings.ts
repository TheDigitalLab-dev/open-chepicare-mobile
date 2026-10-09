/**
 * Configuración General de la clínica (`/admin/settings/general-config`).
 *
 * La app solo necesita la zona horaria: las citas se muestran en la hora de la
 * clínica (ver `utils/clinicTime`). El endpoint exige el permiso de
 * configuración (perfil admin); sin él no hay otra fuente y se usa la zona del
 * dispositivo.
 */
import { ApiError } from '@/types/api';
import { api } from './api';

interface GeneralSettings {
  timezone?: string | null;
}

/** Zona IANA de la clínica, o `null` si el usuario no puede leerla. */
export async function fetchClinicTimeZone(): Promise<string | null> {
  try {
    const settings = await api.get<GeneralSettings>('/admin/settings/general-config');
    return settings.timezone || null;
  } catch (err) {
    if (
      err instanceof ApiError &&
      (err.kind === 'forbidden' || err.kind === 'notFound')
    ) {
      return null;
    }
    throw err;
  }
}
