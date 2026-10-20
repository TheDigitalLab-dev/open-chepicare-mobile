import type { CalendarEventType } from '@/types/calendar';
import type { Colors } from './tokens';

/** Color de cada tipo de evento del calendario (tokens `event*`, con variante oscura). */
export function eventTypeColor(colors: Colors, type: CalendarEventType): string {
  switch (type) {
    case 'appointment':
      return colors.eventAppointment;
    case 'prescription':
      return colors.eventPrescription;
    case 'vaccination':
      return colors.eventVaccination;
    case 'deworming':
      return colors.eventDeworming;
    case 'clinic_event':
      return colors.eventClinic;
  }
}
