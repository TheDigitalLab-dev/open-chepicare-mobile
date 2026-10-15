/**
 * Búsqueda en el servidor para selectores con listas paginadas (dueños,
 * mascotas, servicios). Con la búsqueda vacía muestra la primera página; al
 * escribir consulta al backend con debounce y descarta las respuestas viejas
 * (solo cuenta la de la última búsqueda).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, toApiError } from '@/types/api';

export interface RemoteSearchState<T> {
  query: string;
  setQuery: (q: string) => void;
  data: T[] | null;
  loading: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
}

export function useRemoteSearch<T>(
  search: (query: string) => Promise<T[]>,
  debounceMs = 300,
): RemoteSearchState<T> {
  const [query, setQueryState] = useState('');
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const searchRef = useRef(search);
  const queryRef = useRef('');
  const requestId = useRef(0);
  const settled = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    searchRef.current = search;
  });

  const run = useCallback(async (q: string) => {
    const id = ++requestId.current;
    // Solo la última búsqueda (y con el hook montado) puede tocar el estado.
    const isLatest = () => mounted.current && id === requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await searchRef.current(q.trim());
      if (isLatest()) setData(result);
    } catch (e) {
      if (isLatest()) setError(toApiError(e));
    } finally {
      // Se resuelve en el finally (también si la búsqueda falla). Si otra más
      // nueva tomó el relevo, el indicador sigue activo hasta que esa termine;
      // una vieja que llega DESPUÉS de la nueva no lo vuelve a encender.
      if (id === requestId.current) settled.current = id;
      if (mounted.current) setLoading(settled.current !== requestId.current);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const timer = setTimeout(() => void run(query), query ? debounceMs : 0);
    return () => clearTimeout(timer);
  }, [query, debounceMs, run]);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const setQuery = useCallback((q: string) => {
    if (q === queryRef.current) return;
    queryRef.current = q;
    // Invalida la respuesta en vuelo de la búsqueda anterior.
    requestId.current += 1;
    setQueryState(q);
  }, []);

  const reload = useCallback(() => run(queryRef.current), [run]);

  return { query, setQuery, data, loading, error, reload };
}
