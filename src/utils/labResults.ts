/**
 * Resultados de un examen de laboratorio para mostrarlos en una línea. El
 * backend los guarda como JSON (`{ parametro: valor }`); los registros antiguos
 * pueden traer texto libre. Un objeto no se puede pintar dentro de <Text>.
 */
import type { LabExamResults } from '@/types/models';

function label(key: string): string {
  const text = key.replace(/_/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function value(v: string | number | boolean): string {
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  return String(v);
}

export function formatLabResults(
  results: LabExamResults | string | null | undefined,
): string | undefined {
  if (results === null || results === undefined) return undefined;
  if (typeof results === 'string') return results.trim() || undefined;
  const parts = Object.entries(results)
    .filter(
      (entry): entry is [string, string | number | boolean] =>
        entry[1] !== null && String(entry[1]).trim() !== '',
    )
    .map(([k, v]) => `${label(k)}: ${value(v)}`);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

/** Fila del formulario de resultados ("parámetro → valor"). */
export interface LabResultRow {
  parameter: string;
  value: string;
}

const EMPTY_ROW: LabResultRow = { parameter: '', value: '' };

/** Filas editables a partir de los resultados guardados (al menos una). */
export function resultRowsFrom(
  results: LabExamResults | string | null | undefined,
): LabResultRow[] {
  if (typeof results === 'string') {
    return results.trim()
      ? [{ parameter: 'Resultado', value: results.trim() }]
      : [EMPTY_ROW];
  }
  const rows = Object.entries(results ?? {}).map(([parameter, v]) => ({
    parameter,
    value: v === null ? '' : value(v),
  }));
  return rows.length > 0 ? rows : [EMPTY_ROW];
}

export type ResultsFromRows =
  | { ok: true; results: Record<string, string> }
  | { ok: false; error: string };

/**
 * JSON de resultados para el servidor. Se ignoran las filas vacías; una fila a
 * medias o un parámetro repetido es un error (el servidor aceptaría el envío y
 * se perdería el dato).
 */
export function resultsFromRows(rows: LabResultRow[]): ResultsFromRows {
  const results: Record<string, string> = {};
  const seen = new Set<string>();
  for (const row of rows) {
    const parameter = row.parameter.trim();
    const v = row.value.trim();
    if (!parameter && !v) continue;
    if (!v) return { ok: false, error: `Falta el valor de «${parameter}».` };
    if (!parameter) {
      return { ok: false, error: `Falta el nombre del parámetro con valor «${v}».` };
    }
    const key = parameter.toLocaleLowerCase('es');
    if (seen.has(key))
      return { ok: false, error: `El parámetro «${parameter}» está repetido.` };
    seen.add(key);
    results[parameter] = v;
  }
  if (seen.size === 0) {
    return { ok: false, error: 'Agrega al menos un parámetro con su valor.' };
  }
  return { ok: true, results };
}
