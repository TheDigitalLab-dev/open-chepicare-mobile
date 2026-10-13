/**
 * Listas paginadas del backend (`Pagination::Paginator`): 25 por defecto,
 * máximo 100 por página. Las pantallas que muestran el conjunto completo (las
 * citas, pagos o consultas de UN propietario) no pueden quedarse con la primera
 * página: recorren todas.
 */
import type { PaginationMeta, QueryParams } from '@/types/api';
import { api } from './api';

export const MAX_PER_PAGE = 100;

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
