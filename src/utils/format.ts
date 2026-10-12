/**
 * Formateadores de fecha/hora en español (es-CO). Utilidades reales del dominio,
 * usadas por las pantallas para mostrar datos del backend. Las fechas y horas se
 * muestran en la zona de la clínica (ver `clinicTime`).
 */
import { formatClinicDate, formatClinicDateTime } from './clinicTime';

export function formatDate(iso?: string | null): string {
  return formatClinicDate(iso);
}

export function formatMoney(amount: number, currency = 'COP'): string {
  const prefix = currency === 'COP' ? '$' : `${currency} `;
  return `${prefix}${amount.toLocaleString('es-CO')}`;
}

/** `timeZone`: la de la cita (`appointment.time_zone`), si la trae. */
export function formatDateTime(iso?: string | null, timeZone?: string | null): string {
  return formatClinicDateTime(iso, timeZone);
}
