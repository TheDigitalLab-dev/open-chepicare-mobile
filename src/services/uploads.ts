/**
 * Construcción de los formularios multipart de subida de archivos.
 */
import type { UploadSource } from '@/types/uploads';
import { File } from 'expo-file-system';

/** `FormData` con el archivo en `field` y los campos de texto indicados. */
export function uploadForm(
  field: string,
  file: UploadSource,
  fields: Record<string, string | undefined> = {},
): FormData {
  const form = new FormData();
  if ('blob' in file) {
    form.append(field, file.blob, file.name);
  } else {
    // Expo SDK 56 envía el archivo nativo como Blob mediante expo/fetch.
    form.append(field, new File(file.uri), file.name);
  }
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value.length > 0) form.append(key, value);
  }
  return form;
}
