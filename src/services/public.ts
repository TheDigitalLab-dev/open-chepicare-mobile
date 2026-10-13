/**
 * Servicio público (sin autenticación) contra `../open-chepicare-web`.
 * Endpoints JSON: /public/products, /adoption/pets, /landing.
 */
import type { AdoptionPet, LandingService, Product } from '@/types/models';
import { api } from './api';

const PUBLIC = { auth: false } as const;

export async function listProducts(): Promise<Product[]> {
  const res = await api.get<{ products: Product[] }>('/public/products', PUBLIC);
  return res.products;
}

export async function getProduct(id: number): Promise<Product> {
  const res = await api.get<{ product: Product }>(`/public/products/${id}`, PUBLIC);
  return res.product;
}

export interface AdoptionFilters {
  species?: string;
  sex?: string;
}

export async function listAdoptionPets(
  filters: AdoptionFilters = {},
): Promise<AdoptionPet[]> {
  const res = await api.get<{ pets: AdoptionPet[] }>('/adoption/pets', {
    ...PUBLIC,
    params: { species: filters.species, sex: filters.sex },
  });
  return res.pets;
}

export async function getAdoptionPet(id: number): Promise<AdoptionPet> {
  const res = await api.get<{ pet: AdoptionPet }>(`/adoption/pets/${id}`, PUBLIC);
  return res.pet;
}

export async function listPublicServices(): Promise<LandingService[]> {
  const res = await api.get<{ services?: LandingService[] }>('/landing', PUBLIC);
  return res.services ?? [];
}
