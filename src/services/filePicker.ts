/**
 * Selectores nativos del sistema (documentos y galería de fotos). Capa fina
 * sobre expo-document-picker y expo-image-picker: devuelve los archivos listos
 * para subir, o `[]` si el usuario cancela. No piden permisos: el selector del
 * sistema no los requiere para elegir imágenes.
 */
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import type { UploadSource } from '@/types/uploads';
import { uploadSourceFromAsset } from '@/utils/uploadFiles';

/** PDF o imágenes (lo que aceptan los adjuntos de exámenes). */
export const LAB_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export async function pickDocuments(
  types: string[] = LAB_FILE_TYPES,
  multiple = true,
): Promise<UploadSource[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: types,
    multiple,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return [];
  return result.assets.map((asset) => uploadSourceFromAsset(asset, 'archivo.pdf'));
}

export async function pickImages(multiple = false): Promise<UploadSource[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: multiple,
    quality: 0.8,
  });
  if (result.canceled) return [];
  return result.assets.map((asset) => uploadSourceFromAsset(asset, 'foto.jpg'));
}
