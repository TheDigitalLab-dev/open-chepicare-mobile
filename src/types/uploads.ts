/**
 * Archivos que la app sube al backend (multipart/form-data).
 *
 * En Android/iOS los selectores de Expo entregan un archivo local (`uri`), que
 * el `FormData` de React Native lee y envía. En web (y en Node) llegan como
 * `Blob`/`File` ya en memoria.
 */
export interface LocalFile {
  uri: string;
  name: string;
  /** Tipo MIME ("application/pdf", "image/jpeg"…). */
  type: string;
}

export type UploadSource = LocalFile | { blob: Blob; name: string };
