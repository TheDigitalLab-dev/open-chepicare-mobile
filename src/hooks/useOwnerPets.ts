/**
 * Mascotas de un dueño para los asistentes del staff (todas las páginas, no
 * solo la primera). Se recarga al cambiar de dueño y descarta las respuestas de
 * un dueño anterior: si se elige A y luego B rápido, solo cuentan las de B.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { listAdminPetsByOwner } from '@/services/admin';
import { ApiError, toApiError } from '@/types/api';
import type { Pet } from '@/types/models';

export interface OwnerPetsState {
  pets: Pet[];
  loading: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
}

/** Resultado de la última carga y el dueño al que corresponde. */
interface Loaded {
  ownerId?: number;
  pets: Pet[];
  error: ApiError | null;
}

const NOTHING: Loaded = { pets: [], error: null };

export function useOwnerPets(ownerId: number | undefined): OwnerPetsState {
  const [loaded, setLoaded] = useState<Loaded>(NOTHING);
  const [inFlight, setInFlight] = useState(false);

  const requestId = useRef(0);
  const mounted = useRef(true);

  const load = useCallback(async (id: number | undefined) => {
    const current = ++requestId.current;
    const isLatest = () => mounted.current && current === requestId.current;
    setLoaded(NOTHING);
    if (id === undefined) return;
    setInFlight(true);
    try {
      const pets = await listAdminPetsByOwner(id);
      if (isLatest()) setLoaded({ ownerId: id, pets, error: null });
    } catch (e) {
      if (isLatest()) setLoaded({ ownerId: id, pets: [], error: toApiError(e) });
    } finally {
      // Si se eligió otro dueño mientras tanto, su carga mantiene el indicador.
      if (mounted.current) setInFlight(current !== requestId.current);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    // Diferido para no disparar setState de forma síncrona dentro del efecto.
    const timer = setTimeout(() => void load(ownerId), 0);
    return () => clearTimeout(timer);
  }, [ownerId, load]);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const reload = useCallback(() => load(ownerId), [load, ownerId]);

  // Solo vale el resultado del dueño elegido ahora; mientras no llegue, carga.
  const fresh = ownerId !== undefined && loaded.ownerId === ownerId;
  return {
    pets: fresh ? loaded.pets : [],
    loading: ownerId !== undefined && (inFlight || !fresh),
    error: fresh ? loaded.error : null,
    reload,
  };
}
