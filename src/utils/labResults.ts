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
