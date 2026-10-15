/**
 * Formateadores de fecha/hora en español (es-CO). Utilidades reales del dominio,
 * usadas por las pantallas para mostrar datos del backend. Las fechas y horas se
 * muestran en la zona de la clínica (ver `clinicTime`).
 */
import { formatClinicDate, formatClinicDateTime } from './clinicTime';

export function formatDate(iso?: string | null): string {
  return formatClinicDate(iso);
}

/**
 * Importe con su moneda. El backend envía los importes como número JSON; aun
 * así, un texto numérico ("500.0") se muestra y un valor no numérico o ausente
 * da "—" en vez de "NaN" (datos guardados por versiones anteriores).
 */
export function formatMoney(
  amount: number | string | null | undefined,
  currency = 'COP',
): string {
  if (amount === null || amount === undefined || amount === '') return '—';
  const value = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(value)) return '—';
  const prefix = currency === 'COP' ? '$' : `${currency} `;
  // Enteros sin decimales («$1.500»); con centavos, siempre dos («USD 30,50»).
  const decimals = Number.isInteger(value) ? 0 : 2;
  return `${prefix}${value.toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** `timeZone`: la de la cita (`appointment.time_zone`), si la trae. */
export function formatDateTime(iso?: string | null, timeZone?: string | null): string {
  return formatClinicDateTime(iso, timeZone);
}
