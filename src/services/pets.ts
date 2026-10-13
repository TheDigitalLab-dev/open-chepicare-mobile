/**
 * Servicio de Mascotas (owner) contra el backend real `../pawcare-web`.
 * Endpoints (PetsController, JSON): GET/POST `/pets`, GET/PATCH/DELETE `/pets/:id`.
 * Requiere sesión de Owner (Bearer). Espejo de `pet_json`.
 */
import type { Pet, PetSex, Species } from '@/types/models';
import { api } from './api';

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
