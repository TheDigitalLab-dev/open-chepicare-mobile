/**
 * Receta en PDF en el teléfono: la descarga (con la sesión renovada si hace
 * falta), la guarda en la caché de la app con expo-file-system y abre el menú
 * de compartir del sistema (guardar en Archivos, enviar, imprimir…).
 */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { ApiError } from '@/types/api';
import { downloadRecipePdf } from './medical';

export interface SavedRecipe {
  uri: string;
  filename: string;
  /** false si el dispositivo no ofrece compartir: el PDF quedó guardado igual. */
  shared: boolean;
}

/** Guarda la receta de la consulta y la comparte. Lanza `ApiError`. */
export async function saveAndShareRecipe(consultationId: number): Promise<SavedRecipe> {
  const { filename, bytes } = await downloadRecipePdf(consultationId);
  let uri: string;
  try {
    const file = new File(Paths.cache, filename);
    file.create({ overwrite: true });
    file.write(bytes);
    uri = file.uri;
  } catch {
    throw new ApiError({
      message: 'No se pudo guardar la receta en el teléfono.',
      status: 0,
      kind: 'unknown',
    });
  }
  if (!(await Sharing.isAvailableAsync())) return { uri, filename, shared: false };
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Receta',
  });
  return { uri, filename, shared: true };
}
