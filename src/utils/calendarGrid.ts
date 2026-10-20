/**
 * Cuadrícula del calendario: aritmética de días de calendario ("YYYY-MM-DD")
 * pura, sin zona (los días ya vienen en la zona de la clínica del servidor).
 * Semanas de lunes a domingo, como el calendario de la web.
 */
import {
  CALENDAR_EVENT_TYPES,
  type CalendarEvent,
  type CalendarEventType,
} from '@/types/calendar';
import { shiftDayKey } from '@/utils/clinicTime';
import type { MonthRef } from '@/utils/schedule';

export interface DayRange {
  start: string;
  end: string;
}

/** Quién mira el calendario: decide desde qué día se puede agendar. */
export type CalendarAudience = 'owner' | 'staff';

export const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
export const WEEKDAY_NAMES = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
] as const;

function dayKey(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

/** 0 = lunes … 6 = domingo. */
export function weekdayIndex(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return (new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay() + 6) % 7;
}

export function monthOfDay(day: string): MonthRef {
  return { year: Number(day.slice(0, 4)), month: Number(day.slice(5, 7)) };
}

export function isDayInMonth(day: string, month: MonthRef): boolean {
  const m = monthOfDay(day);
  return m.year === month.year && m.month === month.month;
}

/** Semanas completas (lunes → domingo) que cubren el mes: 4 a 6 filas. */
export function monthGrid(month: MonthRef): string[][] {
  const first = dayKey(month.year, month.month, 1);
  const last = dayKey(month.year, month.month + 1, 0);
  const start = shiftDayKey(first, -weekdayIndex(first));
  const end = shiftDayKey(last, 6 - weekdayIndex(last));
  const weeks: string[][] = [];
  for (let day = start; day <= end; ) {
    const week: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      week.push(day);
      day = shiftDayKey(day, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** Rango que se pide al servidor: toda la cuadrícula (máx. 42 días ≤ 62). */
export function monthGridRange(month: MonthRef): DayRange {
  const weeks = monthGrid(month);
  return { start: weeks[0]![0]!, end: weeks.at(-1)!.at(-1)! };
}

/**
 * Eventos por día. Un evento de varios días (tratamiento) aparece en cada día
 * de su periodo, recortado al rango. Conserva el orden del servidor (día
 * completo primero, luego por hora).
 */
export function eventsByDay(
  events: readonly CalendarEvent[],
  range: DayRange,
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const from = event.start_date > range.start ? event.start_date : range.start;
    const to = event.end_date < range.end ? event.end_date : range.end;
    for (let day = from; day <= to; day = shiftDayKey(day, 1)) {
      const list = map.get(day);
      if (list) list.push(event);
      else map.set(day, [event]);
    }
  }
  return map;
}

/** Tipos presentes en un día, sin repetir y en el orden de la leyenda. */
export function dayEventTypes(
  events: readonly CalendarEvent[] | undefined,
): CalendarEventType[] {
  if (!events || events.length === 0) return [];
  const present = new Set(events.map((e) => e.type));
  return CALENDAR_EVENT_TYPES.filter((t) => present.has(t));
}

/**
 * "Nueva cita" en un día: solo si el servidor lo permite
 * (`can_create_appointment`) y desde el primer día que acepta cada asistente:
 * el personal desde hoy, el propietario desde mañana.
 */
export function canCreateAppointmentOn(
  day: string,
  today: string,
  audience: CalendarAudience,
  allowedByServer: boolean,
): boolean {
  if (!allowedByServer) return false;
  return audience === 'staff' ? day >= today : day > today;
}
