/**
 * Validación de entradas de formulario (lógica pura).
 */

export type DecimalInput = { ok: true; value: number | undefined } | { ok: false };

const DECIMAL = /^\d+(?:[.,]\d+)?$/;

/**
 * Número decimal escrito por el usuario. Acepta coma o punto (los teclados
 * Android en español escriben coma). Vacío = sin valor; cualquier otra cosa es
 * inválida (antes `Number("4,5")` daba NaN y se enviaba `null` en silencio).
 */
export function parseDecimalInput(text: string): DecimalInput {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { ok: true, value: undefined };
  if (!DECIMAL.test(trimmed)) return { ok: false };
  return { ok: true, value: Number(trimmed.replace(',', '.')) };
}

/** Día de calendario "YYYY-MM-DD" que existe (sin desbordes como 30 de febrero). */
export function isValidDayKey(text: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === mo - 1 &&
    date.getUTCDate() === d
  );
}
