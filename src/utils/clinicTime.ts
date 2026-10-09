/**
 * Hora de la clínica — espejo de `ClinicTime` del backend.
 *
 * Regla única: en la BD todo se guarda en UTC; lo que el usuario escribe o ve
 * (horarios, slots, horas de las citas) es hora de pared de la clínica, en la
 * zona de Configuración General. Un datetime SIN offset que envía la app se
 * interpreta en esa zona; las respuestas traen instantes absolutos (ISO con Z).
 *
 * La zona solo la expone `/admin/settings/general-config` (perfil admin). Si no
 * se conoce (propietarios, veterinarios sin ese permiso), se usa la del
 * dispositivo, que en la práctica es la de la clínica.
 */

const LOCALE = 'es-CO';
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

let clinicTimeZone: string | undefined;

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat(LOCALE, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Fija la zona de la clínica (IANA). `null` o inválida → la del dispositivo. */
export function setClinicTimeZone(tz: string | null | undefined): void {
  clinicTimeZone = tz && isValidTimeZone(tz) ? tz : undefined;
}

export function getClinicTimeZone(): string | undefined {
  return clinicTimeZone;
}

function parseInstant(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function format(d: Date, options: Intl.DateTimeFormatOptions, timeZone?: string): string {
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone }).format(d);
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};
// 24 h: formato por defecto de Configuración General (time_format "24h").
const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
};

/**
 * Fecha en la zona de la clínica. Un valor "YYYY-MM-DD" es un día de
 * calendario (días disponibles, fechas de nacimiento…) y no se convierte de
 * zona: `new Date('2026-03-15')` es medianoche UTC y en zonas negativas se
 * mostraba como el día anterior.
 */
export function formatClinicDate(iso?: string | null): string {
  if (!iso) return '—';
  const m = DATE_ONLY.exec(iso);
  if (m) {
    const calendarDay = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return format(calendarDay, DATE_OPTIONS, 'UTC');
  }
  const d = parseInstant(iso);
  return d ? format(d, DATE_OPTIONS, clinicTimeZone) : iso;
}

/** Hora "HH:MM" en la zona de la clínica. */
export function formatClinicTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = parseInstant(iso);
  return d ? format(d, TIME_OPTIONS, clinicTimeZone) : iso;
}

/** "15 mar, 11:00" en la zona de la clínica. */
export function formatClinicDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = parseInstant(iso);
  if (!d) return iso;
  return format(d, { day: '2-digit', month: 'short', ...TIME_OPTIONS }, clinicTimeZone);
}

/** Mes y año actuales de la clínica (para pedir los días disponibles). */
export function clinicMonth(now: Date = new Date()): { month: number; year: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: clinicTimeZone,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { month: get('month'), year: get('year') };
}

/**
 * `scheduled_at` a enviar para un día ("YYYY-MM-DD") y hora ("HH:MM") de la
 * clínica: hora de pared SIN offset, que el backend interpreta en su zona. No
 * se convierte con la zona del dispositivo (eso movería la cita si el teléfono
 * está en otra zona).
 */
export function clinicWallDateTime(day: string, time: string): string {
  return `${day}T${time}:00`;
}
