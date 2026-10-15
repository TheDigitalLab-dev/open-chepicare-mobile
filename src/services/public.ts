/**
 * Servicio público (sin autenticación) contra `../open-chepicare-web`.
 * Endpoints JSON: /public/products, /adoption/pets, /landing.
 */
import type { Paginated } from '@/types/api';
import type { AdoptionPet, LandingService, Product } from '@/types/models';
import { api } from './api';

const PUBLIC = { auth: false } as const;

export async function listProducts(): Promise<Product[]> {
  const res = await api.get<{ products: Product[] }>('/public/products', PUBLIC);
  return res.products;
}

/** Tamaño de página de la tienda (el backend admite 1–50; 12 por defecto). */
export const PRODUCTS_PAGE_SIZE = 24;

/**
 * Tienda página a página, con la búsqueda en el servidor. Antes se leía solo
 * la primera página (12) y se filtraba en el teléfono: un producto de la
 * página 2 salía «Sin resultados».
 */
export async function listProductsPage(
  filters: { search?: string },
  page: number,
): Promise<Paginated<Product>> {
  const res = await api.get<{
    products: Product[];
    pagination: {
      current_page: number;
      per_page: number;
      total_items: number;
      total_pages: number;
    };
  }>('/public/products', {
    ...PUBLIC,
    params: { page, per_page: PRODUCTS_PAGE_SIZE, search: filters.search || undefined },
  });
  return {
    items: res.products,
    page: res.pagination.current_page,
    perPage: res.pagination.per_page,
    total: res.pagination.total_items,
    totalPages: res.pagination.total_pages,
  };
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

/** Datos de contacto de la clínica (Configuración → Landing). */
export interface ClinicContact {
  name?: string | null;
  phone?: string | null;
  emergency_phone?: string | null;
  email?: string | null;
  address?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
}

export async function getClinicContact(): Promise<ClinicContact> {
  const res = await api.get<{ config?: { contact_info?: ClinicContact } }>(
    '/landing',
    PUBLIC,
  );
  return res.config?.contact_info ?? {};
}
