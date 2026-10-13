/**
 * Datos reales para los e2e del propietario (SOLO tests): se crean con los
 * servicios de la app contra el backend en ejecución, nunca se inventan.
 */
import * as appointmentsService from '@/services/appointments';
import * as petsService from '@/services/pets';
import type { Appointment, Service } from '@/types/models';
import { clinicMonth } from '@/utils/clinicTime';
import { shiftMonth } from '@/utils/schedule';

/**
 * Agenda una cita en el primer horario libre del mes siguiente (el backend crea
 * su pago pendiente). Requiere una sesión de propietario abierta.
 */
export async function bookFreshAppointment(
  offsetDays = 3,
  pickService: (services: Service[]) => Service | undefined = (all) => all[0],
): Promise<Appointment> {
  const next = shiftMonth(clinicMonth(), 1);
  const [days, allServices, pets] = await Promise.all([
    appointmentsService.getAvailableDays(next.month, next.year),
    appointmentsService.listServices(),
    petsService.listPets(),
  ]);
  const service = pickService(allServices) ?? allServices[0]!;
  for (const day of [...days.slice(offsetDays), ...days.slice(0, offsetDays)]) {
    for (const vet of await appointmentsService.getAvailableVets(day)) {
      const slots = await appointmentsService.getAvailableTimeSlots(
        day,
        vet.id,
        service.id,
      );
      if (slots.length === 0) continue;
      return appointmentsService.createAppointment({
        pet_id: pets[0]!.id,
        service_id: service.id,
        assigned_to_id: vet.id,
        scheduled_at: `${day}T${slots[0]!.time}:00`,
      });
    }
  }
  throw new Error('No hay horarios libres el mes siguiente en el backend de pruebas');
}
