/**
 * Construcción de los formularios multipart de subida de archivos.
 */
import type { UploadSource } from '@/types/uploads';

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
    // React Native: FormData acepta `{ uri, name, type }` y lee el archivo local.
    form.append(field, file as unknown as Blob);
  }
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value.length > 0) form.append(key, value);
  }
  return form;
}
