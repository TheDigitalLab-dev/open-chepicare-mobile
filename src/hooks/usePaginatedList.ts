/**
 * Lista paginada con scroll infinito para índices grandes del backend (pagos,
 * consultas, citas de toda la clínica). Pide la página 1 al montar o al cambiar
 * `resetKey` (p. ej. el filtro), agrega la siguiente con `loadMore()` y
 * `reload()` vuelve a la página 1. Solo la última carga puede tocar el estado
 * (cambiar de filtro descarta la respuesta en vuelo del anterior).
 *
 * Coste: O(k) por página (k = tamaño de página) en red y en memoria la suma de
 * lo cargado, en vez de pedir y filtrar en el cliente la tabla completa.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, toApiError, type Paginated } from '@/types/api';

export interface PaginatedListState<T> {
  items: T[];
  /** Total del servidor (para el filtro activo). */
  total: number;
  /** Cargando la página 1 (al montar, al cambiar el filtro o al recargar). */
  loading: boolean;
  /** Cargando la página siguiente. */
  loadingMore: boolean;
  hasMore: boolean;
  /** Error de la página 1 (no hay lista que mostrar). */
  error: ApiError | null;
  /** Error de la página siguiente: la lista cargada se conserva. */
  moreError: ApiError | null;
  reload: () => Promise<void>;
  loadMore: () => Promise<void>;
}

interface IdLike {
  id: number | string;
}

export function usePaginatedList<T extends IdLike>(
  fetchPage: (page: number) => Promise<Paginated<T>>,
  resetKey: string = '',
): PaginatedListState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [moreError, setMoreError] = useState<ApiError | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchRef = useRef(fetchPage);
  const generation = useRef(0);
  const pageRef = useRef(0);
  const busyMore = useRef(false);
  const hasMoreRef = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    fetchRef.current = fetchPage;
  });

  const load = useCallback(async (reset: boolean) => {
    const gen = ++generation.current;
    const isLatest = () => mounted.current && gen === generation.current;
    busyMore.current = false;
    hasMoreRef.current = false;
    // Otro filtro: la lista anterior no corresponde (spinner, no datos viejos).
    // Recargar el mismo filtro conserva la lista mientras llega la nueva.
    if (reset) {
      setItems([]);
      setPage(0);
      setTotalPages(0);
    }
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setMoreError(null);
    try {
      const res = await fetchRef.current(1);
      if (!isLatest()) return;
      pageRef.current = res.page;
      hasMoreRef.current = res.page < res.totalPages;
      setItems(res.items);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (e) {
      if (isLatest()) setError(toApiError(e));
    } finally {
      // Si otra carga tomó el relevo, el indicador sigue hasta que esa termine.
      if (mounted.current) setLoading(gen !== generation.current);
    }
  }, []);

  const reload = useCallback(() => load(false), [load]);

  const loadMore = useCallback(async () => {
    if (busyMore.current || !hasMoreRef.current) return;
    busyMore.current = true;
    const gen = generation.current;
    const isLatest = () => mounted.current && gen === generation.current;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const res = await fetchRef.current(pageRef.current + 1);
      if (!isLatest()) return;
      pageRef.current = res.page;
      hasMoreRef.current = res.page < res.totalPages;
      // Paginación por offset: si entró un registro nuevo entre páginas, el
      // último de la anterior se repite. Se descarta por id (O(k) con un Set).
      setItems((prev) => {
        const seen = new Set(prev.map((it) => it.id));
        return [...prev, ...res.items.filter((it) => !seen.has(it.id))];
      });
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (e) {
      if (isLatest()) setMoreError(toApiError(e));
    } finally {
      if (gen === generation.current) busyMore.current = false;
      // Una recarga posterior ya reinició el estado (y puede haber otro loadMore).
      if (mounted.current) setLoadingMore(gen !== generation.current && busyMore.current);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    // Diferido para no disparar setState de forma síncrona dentro del efecto.
    const timer = setTimeout(() => void load(true), 0);
    return () => clearTimeout(timer);
  }, [resetKey, load]);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  return {
    items,
    total,
    loading,
    loadingMore,
    hasMore: page < totalPages,
    error,
    moreError,
    reload,
    loadMore,
  };
}
