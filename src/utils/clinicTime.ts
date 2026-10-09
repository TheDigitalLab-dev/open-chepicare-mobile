/**
 * Hora de la clínica — espejo de `ClinicTime` del backend.
 *
 * Regla única: en la BD todo se guarda en UTC; lo que el usuario escribe o ve
 * (horarios, slots, horas de las citas) es hora de pared de la clínica, en la
 * zona de Configuración General. Un datetime SIN offset que envía la app se
 * interpreta en esa zona; con offset (o `Z`) es un instante absoluto.
 *
 * Las respuestas de citas traen `scheduled_at` con el offset de la clínica
 * (`2026-03-15T09:00:00-04:00`) y la zona en `time_zone`. Orden de la zona
 * para mostrar: la de la cita → la conocida (Configuración General para el
 * admin, o la última que trajo una cita, ver `learnClinicTimeZone`) → la del
 * dispositivo.
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

/**
 * Adopta la zona que trae una respuesta (`time_zone` de las citas). Es la única
 * fuente para propietarios y veterinarios sin acceso a Configuración General.
 * Una zona ausente o inválida no borra la conocida.
 */
export function learnClinicTimeZone(tz: string | null | undefined): void {
  if (tz && isValidTimeZone(tz)) clinicTimeZone = tz;
}

/** Adopta la zona de las citas de una respuesta y las devuelve tal cual. */
export function learnFromAppointments<T extends { time_zone?: string | null }>(
  appointments: T[],
): T[] {
  learnClinicTimeZone(appointments.find((a) => a.time_zone)?.time_zone);
  return appointments;
}

/** Zona a usar: la indicada (p. ej. la de la cita) si es válida, o la conocida. */
function zoneFor(timeZone?: string | null): string | undefined {
  return timeZone && isValidTimeZone(timeZone) ? timeZone : clinicTimeZone;
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
export function formatClinicDate(iso?: string | null, timeZone?: string | null): string {
  if (!iso) return '—';
  const m = DATE_ONLY.exec(iso);
  if (m) {
    const calendarDay = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return format(calendarDay, DATE_OPTIONS, 'UTC');
  }
  const d = parseInstant(iso);
  return d ? format(d, DATE_OPTIONS, zoneFor(timeZone)) : iso;
}

/** Hora "HH:MM" en la zona de la clínica (o la de la cita, si se indica). */
export function formatClinicTime(iso?: string | null, timeZone?: string | null): string {
  if (!iso) return '—';
  const d = parseInstant(iso);
  return d ? format(d, TIME_OPTIONS, zoneFor(timeZone)) : iso;
}

/** "15 mar, 11:00" en la zona de la clínica (o la de la cita, si se indica). */
export function formatClinicDateTime(
  iso?: string | null,
  timeZone?: string | null,
): string {
  if (!iso) return '—';
  const d = parseInstant(iso);
  if (!d) return iso;
  return format(
    d,
    { day: '2-digit', month: 'short', ...TIME_OPTIONS },
    zoneFor(timeZone),
  );
}

interface WallParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function wallParts(d: Date, timeZone: string | undefined): WallParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

/** Día civil "YYYY-MM-DD" de un instante en la zona de la clínica (o la indicada). */
export function clinicDayKey(iso: string, timeZone?: string | null): string {
  const d = parseInstant(iso);
  if (!d) return iso;
  const p = wallParts(d, zoneFor(timeZone));
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/**
 * Instante UTC (ISO con `Z`) de un día ("YYYY-MM-DD") y hora ("HH:MM") de pared
 * en la zona de la clínica (o la indicada), con el offset de esa fecha (respeta
 * el horario de verano). Es la alternativa con offset explícito a
 * `clinicWallDateTime`.
 */
export function clinicWallTimeToInstant(
  day: string,
  time: string,
  timeZone?: string | null,
): string {
  const [y, mo, d] = day.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const wallAsUtc = Date.UTC(y!, mo! - 1, d!, h!, mi!);
  const zone = zoneFor(timeZone);
  // Offset de la zona en ese momento; se recalcula una vez por si el primer
  // intento cae al otro lado de un cambio de horario.
  const offsetAt = (ms: number) => {
    const p = wallParts(new Date(ms), zone);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ms;
  };
  let instant = wallAsUtc - offsetAt(wallAsUtc);
  instant = wallAsUtc - offsetAt(instant);
  return new Date(instant).toISOString();
}

/** Mes y año actuales de la clínica (para pedir los días disponibles). */
export function clinicMonth(now: Date = new Date()): { month: number; year: number } {
  const { month, year } = wallParts(now, clinicTimeZone);
  return { month, year };
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
