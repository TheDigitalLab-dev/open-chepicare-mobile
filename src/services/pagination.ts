/**
 * Listas paginadas del backend (`Pagination::Paginator`): 25 por defecto,
 * máximo 100 por página. Las pantallas que muestran el conjunto completo (las
 * citas, pagos o consultas de UN propietario) no pueden quedarse con la primera
 * página: recorren todas.
 */
import type { Paginated, PaginationMeta, QueryParams } from '@/types/api';
import { api } from './api';

export const MAX_PER_PAGE = 100;
/** Tamaño de página de las listas con scroll infinito (`Paginator`: 15/25/50/100). */
export const PAGE_SIZE = 25;

/**
 * Una página de un índice paginado. Las listas largas del personal (pagos,
 * consultas, citas de toda la clínica) se piden página a página al hacer
 * scroll: O(k) por petición en vez de cargarlo todo.
 */
export async function fetchPage<K extends string, T>(
  path: string,
  key: K,
  params: QueryParams & { page: number },
  perPage: number = PAGE_SIZE,
): Promise<Paginated<T>> {
  const res = await api.get<Partial<Record<K, T[]>> & { pagination?: PaginationMeta }>(
    path,
    { params: { ...params, per_page: perPage } },
  );
  const items = res[key] ?? [];
  const meta = res.pagination;
  return {
    items,
    page: meta?.page ?? params.page,
    perPage: meta?.per_page ?? perPage,
    total: meta?.total ?? items.length,
    totalPages: meta?.total_pages ?? params.page,
  };
}

/** Recorre todas las páginas de un índice paginado y devuelve sus elementos. */
export async function fetchAllPages<K extends string, T>(
  path: string,
  key: K,
  params: QueryParams = {},
  perPage: number = MAX_PER_PAGE,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const res = await api.get<Partial<Record<K, T[]>> & { pagination?: PaginationMeta }>(
      path,
      { params: { ...params, page, per_page: perPage } },
    );
    items.push(...(res[key] ?? []));
    if (!res.pagination || page >= res.pagination.total_pages) return items;
  }
}
