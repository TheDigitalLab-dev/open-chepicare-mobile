/**
 * Textos del calendario: estado de cada evento, hora o periodo, subtítulo según
 * quién mira (el personal ve el dueño; el propietario, el veterinario), título
 * del mes y etiqueta accesible de cada día de la cuadrícula.
 */
import {
  CALENDAR_EVENT_TYPE_LABEL,
  type CalendarEvent,
  type CalendarEventType,
  type ClinicalEventStatus,
  type PrescriptionEventStatus,
} from '@/types/calendar';
import { APPOINTMENT_STATUS_LABEL } from '@/types/models';
import type { CalendarAudience } from '@/utils/calendarGrid';
import { WEEKDAY_NAMES, weekdayIndex } from '@/utils/calendarGrid';
import { formatClinicDate, formatClinicTime, formatDayLong } from '@/utils/clinicTime';
import type { MonthRef } from '@/utils/schedule';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const PRESCRIPTION_STATUS_LABEL: Record<PrescriptionEventStatus, string> = {
  active: 'En curso',
  finished: 'Terminado',
  completed: 'Completado',
};

const CLINICAL_STATUS_LABEL: Record<ClinicalEventStatus, string> = {
  upcoming: 'Próxima',
  overdue: 'Vencida',
};

export function eventStatusLabel(event: CalendarEvent): string {
  switch (event.type) {
    case 'appointment':
      return APPOINTMENT_STATUS_LABEL[event.status] ?? event.status;
    case 'prescription':
      return PRESCRIPTION_STATUS_LABEL[event.status] ?? event.status;
    case 'clinic_event':
      return event.status === 'published'
        ? 'Publicado'
        : event.status === 'cancelled'
          ? 'Cancelado'
          : event.status === 'completed'
            ? 'Finalizado'
            : 'Programado';
    default:
      return CLINICAL_STATUS_LABEL[event.status] ?? event.status;
  }
}

/** "10:00 – 10:30" (hora de la clínica), el periodo de un tratamiento o "Todo el día". */
export function eventTimeLabel(event: CalendarEvent): string {
  if (!event.all_day && event.starts_at) {
    const start = formatClinicTime(event.starts_at);
    return event.ends_at ? `${start} – ${formatClinicTime(event.ends_at)}` : start;
  }
  if (event.end_date !== event.start_date) {
    return `${formatClinicDate(event.start_date)} – ${formatClinicDate(event.end_date)}`;
  }
  return 'Todo el día';
}

function compact(parts: (string | null | undefined)[]): string {
  return parts.filter((p): p is string => !!p && p.trim() !== '').join(' · ');
}

export function eventSubtitle(event: CalendarEvent, _audience: CalendarAudience): string {
  const time = eventTimeLabel(event);
  const tutor =
    event.pet?.proprietary?.full_name ??
    (event.type === 'appointment' ? event.details.owner?.full_name : null);
  const ownerLine = event.pet ? `Tutor: ${tutor ?? 'No registrado'}\n` : '';
  switch (event.type) {
    case 'appointment':
      return ownerLine + compact([time, event.details.assigned_to?.full_name]);
    case 'prescription':
      return ownerLine + compact([time, event.details.dose, event.details.frequency]);
    case 'clinic_event':
      return compact([time, event.details.location]);
    default:
      return ownerLine + time;
  }
}

export function monthTitle(month: MonthRef): string {
  return `${MONTH_NAMES[month.month - 1]} ${month.year}`;
}

function weekdayName(day: string): string {
  return WEEKDAY_NAMES[weekdayIndex(day)]!;
}

/** "Miércoles 21 de octubre". */
export function selectedDayTitle(day: string): string {
  const name = weekdayName(day);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${formatDayLong(day)}`;
}

function joinTypes(types: CalendarEventType[]): string {
  const labels = types.map((t) => CALENDAR_EVENT_TYPE_LABEL[t].toLowerCase());
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} y ${labels.at(-1)}`;
}

/** Lo que lee el lector de pantalla en cada día de la cuadrícula. */
export function dayAccessibilityLabel(
  day: string,
  types: CalendarEventType[],
  isToday: boolean,
): string {
  const parts = [`${weekdayName(day)} ${formatDayLong(day)}`];
  if (isToday) parts.push('hoy');
  parts.push(types.length === 0 ? 'sin eventos' : `con ${joinTypes(types)}`);
  return parts.join(', ');
}
