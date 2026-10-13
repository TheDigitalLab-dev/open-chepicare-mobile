/**
 * Del asset que entregan los selectores de Expo (documentos o fotos) al archivo
 * que se sube al backend (`UploadSource`).
 */
import type { UploadSource } from '@/types/uploads';

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

/** Tipo MIME por extensión; desconocido → `application/octet-stream`. */
export function mimeFromName(name: string): string {
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  return MIME_BY_EXTENSION[ext] ?? 'application/octet-stream';
}

/** Lo común a `DocumentPickerAsset` e `ImagePickerAsset`. */
export interface PickedAsset {
  uri: string;
  /** DocumentPicker. */
  name?: string | null;
  /** ImagePicker. */
  fileName?: string | null;
  mimeType?: string | null;
  /** Solo en web: el archivo ya en memoria. */
  file?: Blob | null;
}

/**
 * Archivo a subir. Sin nombre se toma el último segmento de la uri (si tiene
 * extensión) o `fallbackName`; sin tipo, el que corresponde a la extensión.
 */
export function uploadSourceFromAsset(
  asset: PickedAsset,
  fallbackName: string,
): UploadSource {
  const last = asset.uri.split(/[/?#]/).filter(Boolean).pop() ?? '';
  const name = asset.name || asset.fileName || (last.includes('.') ? last : fallbackName);
  if (asset.file) return { blob: asset.file, name };
  return { uri: asset.uri, name, type: asset.mimeType || mimeFromName(name) };
}
