/**
 * URLs de archivos del backend (fotos, adjuntos): Active Storage las devuelve
 * relativas (`/rails/active_storage/blobs/redirect/…`), firmadas y públicas.
 * Se resuelven contra el servidor ACTIVO de la app (self-hosted), no contra uno
 * fijo del build.
 */
import { getApiBaseUrl } from '@/config/serverConfig';

const ABSOLUTE = /^[a-z][a-z\d+.-]*:/i;

/** URL absoluta de un archivo del backend (`null` si no hay). */
export function absoluteServerUrl(path?: string | null): string | null {
  if (!path) return null;
  if (ABSOLUTE.test(path)) return path;
  return `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}
