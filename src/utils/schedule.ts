export interface VetShift {
  start_time: string;
  end_time: string;
}

export interface VetWithShifts {
  id: number;
  name: string;
  shifts: VetShift[];
}

/**
 * `/owner-available-vets` devuelve una fila por TURNO (un veterinario con turno
 * de mañana y de tarde aparece dos veces con el mismo id). Agrupa por
 * veterinario, conservando el orden de aparición y sus turnos.
 */
export function groupVetShifts(
  vets: readonly {
    id: number;
    first_name: string;
    last_name: string;
    start_time: string | null;
    end_time: string | null;
  }[],
): VetWithShifts[] {
  const byId = new Map<number, VetWithShifts>();
  for (const v of vets) {
    let entry = byId.get(v.id);
    if (!entry) {
      entry = { id: v.id, name: `${v.first_name} ${v.last_name}`.trim(), shifts: [] };
      byId.set(v.id, entry);
    }
    if (v.start_time && v.end_time) {
      entry.shifts.push({ start_time: v.start_time, end_time: v.end_time });
    }
  }
  return [...byId.values()];
}

export interface MonthRef {
  month: number; // 1-12
  year: number;
}

/** Índice absoluto del mes (para comparar y limitar la navegación). */
export function monthIndex({ month, year }: MonthRef): number {
  return year * 12 + (month - 1);
}

/** Mes desplazado `delta` meses (cruza años). */
export function shiftMonth(ref: MonthRef, delta: number): MonthRef {
  const index = monthIndex(ref) + delta;
  return { month: (index % 12) + 1, year: Math.floor(index / 12) };
}
