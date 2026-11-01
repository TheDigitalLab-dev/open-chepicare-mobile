import type { Vaccination } from '@/types/models';

/** La próxima dosis corresponde solo a la última aplicación de esa vacuna en el paciente. */
export function vaccinationDueState(
  vaccination: Vaccination,
  history: readonly Vaccination[],
  today: string,
): 'overdue' | 'upcoming' | null {
  if (!vaccination.next_due_date) return null;
  const superseded = history.some((other) => {
    const same =
      other.vaccine_type === vaccination.vaccine_type &&
      (vaccination.vaccine_type !== 'other' ||
        other.vaccine_name === vaccination.vaccine_name);
    return (
      same &&
      (other.application_date > vaccination.application_date ||
        (other.application_date === vaccination.application_date &&
          other.id > vaccination.id))
    );
  });
  if (superseded) return null;
  return vaccination.next_due_date < today ? 'overdue' : 'upcoming';
}
