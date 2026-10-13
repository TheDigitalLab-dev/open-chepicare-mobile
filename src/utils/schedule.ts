/**
 * Genera horarios ("HH:MM") entre `start` y `end` en pasos de `stepMinutes`.
 * Solo incluye huecos que caben completos antes de `end`.
 */
export function generateTimeSlots(
  start: string,
  end: string,
  stepMinutes: number,
): string[] {
  const toMinutes = (t: string): number | null => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(t);
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
  };

  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (startMin === null || endMin === null || stepMinutes <= 0) return [];

  const format = (mins: number): string =>
    `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

  const slots: string[] = [];
  for (let t = startMin; t + stepMinutes <= endMin; t += stepMinutes) {
    slots.push(format(t));
  }
  return slots;
}

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
