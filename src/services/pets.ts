/**
 * Servicio de Mascotas (owner) contra el backend real `../open-chepicare-web`.
 * Endpoints (PetsController, JSON): GET/POST `/pets`, GET/PATCH/DELETE `/pets/:id`
 * y POST/DELETE `/pets/:id/photo`. Requiere sesión de Owner (Bearer). Espejo
 * de `pet_json` (`photo_url` relativa al servidor).
 */
import type { Pet, PetSex, Species } from '@/types/models';
import type { UploadSource } from '@/types/uploads';
import { api } from './api';
import { uploadForm } from './uploads';

/**
 * `null` vacía el campo en el servidor (`undefined` no lo toca). Sin
 * `adoption_status`: lo gestiona la clínica y el backend lo ignora.
 */
export interface PetInput {
  name: string;
  species: Species;
  breed?: string | null;
  sex?: PetSex;
  birth_date?: string | null; // YYYY-MM-DD
  distinctive_features?: string | null;
}

export async function listPets(): Promise<Pet[]> {
  const { pets } = await api.get<{ pets: Pet[] }>('/pets');
  return pets;
}

export async function getPet(id: number): Promise<Pet> {
  const { pet } = await api.get<{ pet: Pet }>(`/pets/${id}`);
  return pet;
}

export async function createPet(input: PetInput): Promise<Pet> {
  const { pet } = await api.post<{ pet: Pet }>('/pets', { pet: input });
  return pet;
}

export async function updatePet(id: number, input: Partial<PetInput>): Promise<Pet> {
  const { pet } = await api.patch<{ pet: Pet }>(`/pets/${id}`, { pet: input });
  return pet;
}

export async function deletePet(id: number): Promise<void> {
  await api.delete<unknown>(`/pets/${id}`);
}

/** Sube o cambia la foto (jpg, png o webp, hasta 5 MB). */
export async function uploadPetPhoto(id: number, photo: UploadSource): Promise<Pet> {
  const { pet } = await api.upload<{ pet: Pet }>(
    `/pets/${id}/photo`,
    uploadForm('photo', photo),
    { timeoutMs: 120_000 },
  );
  return pet;
}

/** Quita la foto de la mascota. */
export async function deletePetPhoto(id: number): Promise<Pet> {
  const { pet } = await api.delete<{ pet: Pet }>(`/pets/${id}/photo`);
  return pet;
}
