/**
 * Calendario / agenda del propietario y del personal contra el backend real.
 *
 * - Pide al servidor la cuadrícula completa del mes visible (lunes → domingo,
 *   ≤ 42 días) con `getOwnerCalendarEvents` / `getStaffCalendarEvents`.
 * - Cada cambio de mes o de filtro (veterinario, canceladas) pide de nuevo y
 *   solo cuenta la ÚLTIMA respuesta; una respuesta de otra consulta nunca se
 *   muestra con la cuadrícula nueva.
 * - La leyenda oculta tipos en el cliente (sin pedir de nuevo).
 * - Filtro de veterinario (personal): sin elegir, decide el servidor (el rol
 *   `vet` entra en sus citas; admin y recepción en toda la clínica). El filtro
 *   mostrado sale de lo que respondió el servidor (`filters.vet_id`).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getOwnerCalendarEvents, getStaffCalendarEvents } from '@/services/calendar';
import { ApiError, toApiError } from '@/types/api';
import type {
  CalendarEvent,
  CalendarEventType,
  CalendarResponse,
  CalendarVet,
  CalendarVetFilter,
} from '@/types/calendar';
import {
  canCreateAppointmentOn,
  dayEventTypes,
  eventsByDay,
  isDayInMonth,
  monthGrid,
  monthGridRange,
  monthOfDay,
  type CalendarAudience,
} from '@/utils/calendarGrid';
import { clinicToday } from '@/utils/clinicTime';
import { shiftMonth, type MonthRef } from '@/utils/schedule';

export interface UseCalendarOptions {
  audience: CalendarAudience;
  /** Usuario del personal en sesión: traduce `filters.vet_id` a "Mis citas". */
  currentUserId?: number;
  /** Día elegido al abrir ("YYYY-MM-DD"); por defecto hoy en la clínica. */
  initialDay?: string;
}

export interface CalendarState {
  month: MonthRef;
  /** Semanas (lunes → domingo) del mes visible. */
  weeks: string[][];
  today: string;
  selectedDay: string;
  loading: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
  /** Eventos visibles (sin los tipos ocultos en la leyenda). */
  events: CalendarEvent[];
  /** Tipos con eventos visibles de cada día (puntos de color). */
  markersByDay: Map<string, CalendarEventType[]>;
  selectedEvents: CalendarEvent[];
  /** Tipos que el servidor permite a este usuario (leyenda). */
  legendTypes: CalendarEventType[];
  hiddenTypes: CalendarEventType[];
  toggleType: (type: CalendarEventType) => void;
  includeCancelled: boolean;
  setIncludeCancelled: (value: boolean) => void;
  /** Veterinarios del filtro (solo personal). */
  vets: CalendarVet[];
  /** Filtro aplicado según el servidor; `null` hasta la primera respuesta. */
  vetFilter: CalendarVetFilter | null;
  /** El usuario atiende citas: tiene sentido "Mis citas". */
  canFilterMine: boolean;
  setVetFilter: (filter: CalendarVetFilter) => void;
  canCreateOnSelectedDay: boolean;
  selectDay: (day: string) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  goToday: () => void;
}

function firstDayOf(month: MonthRef): string {
  return `${month.year}-${String(month.month).padStart(2, '0')}-01`;
}

const NO_EVENTS: CalendarEvent[] = [];
const NO_VETS: CalendarVet[] = [];

interface StaffMeta {
  vets: CalendarVet[];
  vetId: number | null;
}

interface CalendarQueryState {
  start: string;
  end: string;
  includeCancelled: boolean;
  vetRequest: CalendarVetFilter | undefined;
}

function fetchCalendar(
  audience: CalendarAudience,
  { start, end, includeCancelled, vetRequest }: CalendarQueryState,
): Promise<CalendarResponse> {
  const query = { start, end, includeCancelled };
  return audience === 'staff'
    ? getStaffCalendarEvents({ ...query, vetId: vetRequest })
    : getOwnerCalendarEvents(query);
}

function visibleEvents(
  all: CalendarEvent[],
  hiddenTypes: CalendarEventType[],
): CalendarEvent[] {
  if (hiddenTypes.length === 0) return all;
  const hidden = new Set(hiddenTypes);
  return all.filter((e) => !hidden.has(e.type));
}

function markersFor(
  byDay: Map<string, CalendarEvent[]>,
): Map<string, CalendarEventType[]> {
  const markers = new Map<string, CalendarEventType[]>();
  for (const [day, list] of byDay) markers.set(day, dayEventTypes(list));
  return markers;
}

/**
 * Filtro mostrado: mientras carga un filtro nuevo, el pedido; si no, el que
 * aplicó el servidor (`vet_id` del usuario → "Mis citas", `null` → toda la
 * clínica).
 */
function resolveVetFilter(
  meta: StaffMeta | null,
  pending: CalendarVetFilter | undefined,
  currentUserId: number | undefined,
): CalendarVetFilter | null {
  if (!meta) return null;
  if (pending !== undefined) return pending;
  if (meta.vetId === null) return 'all';
  return meta.vetId === currentUserId ? 'me' : meta.vetId;
}

/**
 * Pide los eventos de la consulta y solo acepta la ÚLTIMA respuesta. `current`
 * es `null` mientras la consulta visible (`key`) no tiene respuesta propia.
 */
function useCalendarEvents(audience: CalendarAudience, query: CalendarQueryState) {
  const key = `${query.start}|${query.end}|${query.includeCancelled}|${query.vetRequest ?? ''}`;
  const [result, setResult] = useState<{
    key: string;
    response: CalendarResponse | null;
    error: ApiError | null;
  } | null>(null);
  // Veterinarios y filtro de la última respuesta del personal: se mantienen
  // mientras carga otra consulta (el filtro no parpadea al cambiarlo).
  const [staffMeta, setStaffMeta] = useState<StaffMeta | null>(null);

  const mounted = useRef(true);
  const requestId = useRef(0);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  });

  const load = useCallback(async () => {
    const id = ++requestId.current;
    const isLatest = () => mounted.current && id === requestId.current;
    try {
      const response = await fetchCalendar(audience, queryRef.current);
      if (!isLatest()) return;
      setResult({ key, response, error: null });
      if ('vets' in response) {
        setStaffMeta({ vets: response.vets, vetId: response.filters.vet_id });
      }
    } catch (e) {
      if (isLatest()) setResult({ key, response: null, error: toApiError(e) });
    }
  }, [audience, key]);

  useEffect(() => {
    // Diferido para no encadenar setState dentro del efecto (como useAsync).
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const reload = useCallback(async () => {
    setResult(null);
    await load();
  }, [load]);

  // Solo vale la respuesta de la consulta visible.
  const current = result?.key === key ? result : null;
  return { current, staffMeta, reload };
}

export function useCalendar({
  audience,
  currentUserId,
  initialDay,
}: UseCalendarOptions): CalendarState {
  const [today] = useState(() => clinicToday());
  // Mes visible y día elegido cambian juntos (dos "mes siguiente" seguidos
  // avanzan dos meses).
  const [view, setView] = useState(() => {
    const day = initialDay ?? today;
    return { month: monthOfDay(day), day };
  });
  const { month, day: selectedDay } = view;
  const [includeCancelled, setIncludeCancelled] = useState(false);
  // Sin valor: el servidor elige el filtro por defecto del rol.
  const [vetRequest, setVetRequest] = useState<CalendarVetFilter | undefined>();
  const [hiddenTypes, setHiddenTypes] = useState<CalendarEventType[]>([]);

  const range = useMemo(() => monthGridRange(month), [month]);
  const { current, staffMeta, reload } = useCalendarEvents(audience, {
    ...range,
    includeCancelled,
    vetRequest,
  });
  const response = current?.response ?? null;
  const loading = current === null;

  const events = useMemo(
    () => visibleEvents(response?.events ?? NO_EVENTS, hiddenTypes),
    [response, hiddenTypes],
  );
  const byDay = useMemo(() => eventsByDay(events, range), [events, range]);
  const markersByDay = useMemo(() => markersFor(byDay), [byDay]);
  const weeks = useMemo(() => monthGrid(month), [month]);

  const vets = staffMeta?.vets ?? NO_VETS;

  const selectDay = useCallback((day: string) => {
    setView((prev) => ({
      month: isDayInMonth(day, prev.month) ? prev.month : monthOfDay(day),
      day,
    }));
  }, []);

  // Otro mes: se elige hoy si cae en él, si no el día 1.
  const changeMonth = useCallback(
    (delta: number) => {
      setView((prev) => {
        const target = shiftMonth(prev.month, delta);
        return {
          month: target,
          day: isDayInMonth(today, target) ? today : firstDayOf(target),
        };
      });
    },
    [today],
  );

  const toggleType = useCallback((type: CalendarEventType) => {
    setHiddenTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }, []);

  return {
    month,
    weeks,
    today,
    selectedDay,
    loading,
    error: current?.error ?? null,
    reload,
    events,
    markersByDay,
    selectedEvents: byDay.get(selectedDay) ?? NO_EVENTS,
    legendTypes: response?.allowed_types ?? [],
    hiddenTypes,
    toggleType,
    includeCancelled,
    setIncludeCancelled,
    vets,
    vetFilter: resolveVetFilter(
      staffMeta,
      loading ? vetRequest : undefined,
      currentUserId,
    ),
    canFilterMine:
      currentUserId !== undefined && vets.some((v) => v.id === currentUserId),
    setVetFilter: setVetRequest,
    canCreateOnSelectedDay: canCreateAppointmentOn(
      selectedDay,
      today,
      audience,
      response?.can_create_appointment ?? false,
    ),
    selectDay,
    prevMonth: () => changeMonth(-1),
    nextMonth: () => changeMonth(1),
    goToday: () => selectDay(today),
  };
}
