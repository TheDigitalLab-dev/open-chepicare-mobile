/**
 * Foto de la mascota: elegirla de la galería y subirla (o cambiarla), o
 * quitarla, en el servidor. `onChange` recibe la mascota actualizada.
 */
import { useCallback, useState } from 'react';

import { pickImages } from '@/services/filePicker';
import { deletePetPhoto, uploadPetPhoto } from '@/services/pets';
import { toApiError } from '@/types/api';
import type { Pet } from '@/types/models';

export interface PetPhotoState {
  busy: boolean;
  error: string | null;
  pickAndUpload: () => Promise<void>;
  remove: () => Promise<void>;
}

export function usePetPhoto(petId: number, onChange: (pet: Pet) => void): PetPhotoState {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = useCallback(async () => {
    setError(null);
    let photo;
    try {
      [photo] = await pickImages(false);
    } catch {
      setError('No se pudo abrir la galería.');
      return;
    }
    if (!photo) return;
    setBusy(true);
    try {
      onChange(await uploadPetPhoto(petId, photo));
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setBusy(false);
    }
  }, [petId, onChange]);

  const remove = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      onChange(await deletePetPhoto(petId));
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setBusy(false);
    }
  }, [petId, onChange]);

  return { busy, error, pickAndUpload, remove };
}
