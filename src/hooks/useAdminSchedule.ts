/**
 * Disponibilidad del asistente de citas del personal: días con agenda del mes
 * (navegando por meses, desde el mes de la clínica hasta 12 meses después),
 * veterinarios de un día y horarios de un veterinario. Cada carga descarta las
 * respuestas viejas: al tocar otro día (u otro veterinario) antes de que
 * llegue la respuesta anterior, solo cuenta la última.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getAdminAvailableDays,
  getAdminAvailableVets,
  getAdminTimeSlots,
} from '@/services/admin';
import { ApiError, toApiError } from '@/types/api';
import type { AvailableVet } from '@/types/models';
import { clinicMonth } from '@/utils/clinicTime';
import { monthIndex, shiftMonth, type MonthRef } from '@/utils/schedule';

const MAX_MONTHS_AHEAD = 12;

export interface Loadable<T> {
  data: T;
  loading: boolean;
  error: ApiError | null;
}

export interface AdminScheduleState {
  month: MonthRef;
  canGoPrevMonth: boolean;
  canGoNextMonth: boolean;
  prevMonth: () => Promise<void>;
  nextMonth: () => Promise<void>;
  days: Loadable<string[]> & { reload: () => Promise<void> };
  /** Veterinarios del día `day` (deduplicados: el backend repite por turno). */
  vets: Loadable<AvailableVet[]> & { day: string | null };
  loadVets: (day: string) => Promise<void>;
  /** Horarios libres ("HH:MM") del veterinario elegido. */
  slots: Loadable<string[]>;
  loadSlots: (day: string, vetId: number, serviceId: number) => Promise<void>;
  clearSlots: () => void;
}

function uniqueVets(vets: AvailableVet[]): AvailableVet[] {
  const seen = new Set<number>();
  return vets.filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)));
}

/** Contador de peticiones: solo la última puede tocar el estado. */
function useLatest() {
  const counter = useRef(0);
  return useCallback(() => {
    const id = ++counter.current;
    return () => id === counter.current;
  }, []);
}

export function useAdminSchedule(): AdminScheduleState {
  // Mes de la clínica (no del teléfono): el backend calcula "hoy" en su zona.
  const [minMonth] = useState(() => clinicMonth());
  const [month, setMonth] = useState<MonthRef>(minMonth);

  const [days, setDays] = useState<Loadable<string[]>>({
    data: [],
    loading: true,
    error: null,
  });
  const [vets, setVets] = useState<Loadable<AvailableVet[]> & { day: string | null }>({
    data: [],
    loading: false,
    error: null,
    day: null,
  });
  const [slots, setSlots] = useState<Loadable<string[]>>({
    data: [],
    loading: false,
    error: null,
  });

  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  const nextDays = useLatest();
  const nextVets = useLatest();
  const nextSlots = useLatest();

  const loadDays = useCallback(
    async (m: MonthRef) => {
      const isLatest = nextDays();
      setDays((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await getAdminAvailableDays(m.month, m.year);
        if (mounted.current && isLatest()) setDays({ data, loading: false, error: null });
      } catch (e) {
        if (mounted.current && isLatest()) {
          setDays({ data: [], loading: false, error: toApiError(e) });
        }
      }
    },
    [nextDays],
  );

  useEffect(() => {
    const timer = setTimeout(() => void loadDays(minMonth), 0);
    return () => clearTimeout(timer);
  }, [loadDays, minMonth]);

  const changeMonth = useCallback(
    async (delta: number) => {
      const target = shiftMonth(month, delta);
      const offset = monthIndex(target) - monthIndex(minMonth);
      if (offset < 0 || offset > MAX_MONTHS_AHEAD) return;
      setMonth(target);
      await loadDays(target);
    },
    [month, minMonth, loadDays],
  );

  const loadVets = useCallback(
    async (day: string) => {
      const isLatest = nextVets();
      // Otro día: los horarios del veterinario anterior ya no aplican.
      nextSlots();
      setSlots({ data: [], loading: false, error: null });
      setVets({ data: [], loading: true, error: null, day });
      try {
        const data = uniqueVets(await getAdminAvailableVets(day));
        if (mounted.current && isLatest())
          setVets({ data, loading: false, error: null, day });
      } catch (e) {
        if (mounted.current && isLatest()) {
          setVets({ data: [], loading: false, error: toApiError(e), day });
        }
      }
    },
    [nextVets, nextSlots],
  );

  const loadSlots = useCallback(
    async (day: string, vetId: number, serviceId: number) => {
      const isLatest = nextSlots();
      setSlots({ data: [], loading: true, error: null });
      try {
        const result = await getAdminTimeSlots(day, vetId, serviceId);
        const data = result.flatMap((s) => (s.available ? [s.time] : []));
        if (mounted.current && isLatest())
          setSlots({ data, loading: false, error: null });
      } catch (e) {
        if (mounted.current && isLatest()) {
          setSlots({ data: [], loading: false, error: toApiError(e) });
        }
      }
    },
    [nextSlots],
  );

  const clearSlots = useCallback(() => {
    nextSlots();
    setSlots({ data: [], loading: false, error: null });
  }, [nextSlots]);

  const offset = monthIndex(month) - monthIndex(minMonth);
  return {
    month,
    canGoPrevMonth: offset > 0,
    canGoNextMonth: offset < MAX_MONTHS_AHEAD,
    prevMonth: () => changeMonth(-1),
    nextMonth: () => changeMonth(1),
    days: { ...days, reload: () => loadDays(month) },
    vets,
    loadVets,
    slots,
    loadSlots,
    clearSlots,
  };
}
