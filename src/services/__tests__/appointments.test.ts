/**
 * Integración REAL del servicio de Citas contra `../pawcare-web`.
 * Lee citas/servicios/disponibilidad reales y ejerce un ciclo crear→cancelar.
 */
import * as authService from '@/services/auth';
import * as appointmentsService from '@/services/appointments';
import * as petsService from '@/services/pets';
import * as secureStore from '@/utils/secureStore';
import {
  formatClinicTime,
  getClinicTimeZone,
  setClinicTimeZone,
} from '@/utils/clinicTime';

const OFFSET_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
});

afterAll(async () => {
  setClinicTimeZone(null);
  await secureStore.clearTokens();
});

describe('appointmentsService (lecturas reales)', () => {
  it('lista las citas del owner', async () => {
    setClinicTimeZone(null);
    const list = await appointmentsService.listAppointments();
    expect(Array.isArray(list)).toBe(true);
    if (list.length > 0) {
      expect(list[0]!.scheduled_at).toMatch(OFFSET_ISO);
      expect(getClinicTimeZone()).toBe(list[0]!.time_zone);
      const detail = await appointmentsService.getAppointment(list[0]!.id);
      expect(detail.id).toBe(list[0]!.id);
      expect(detail).toHaveProperty('status');
      expect(detail).toHaveProperty('pet');
    }
  });

  it('lista los servicios agendables', async () => {
    const services = await appointmentsService.listServices();
    expect(Array.isArray(services)).toBe(true);
    expect(services.length).toBeGreaterThan(0);
    expect(services[0]).toEqual(
      expect.objectContaining({ id: expect.any(Number), name: expect.any(String) }),
    );
  });
});

describe('appointmentsService crear→cancelar (real)', () => {
  it('agenda una cita en un hueco disponible y la cancela', async () => {
    const now = new Date();
    let month = now.getMonth() + 2; // mes SIGUIENTE (1-based)
    let year = now.getFullYear();
    if (month > 12) {
      month -= 12;
      year += 1;
    }

    const days = await appointmentsService.getAvailableDays(month, year);
    const services = await appointmentsService.listServices();
    const pets = await petsService.listPets();

    // Requiere datos sembrados; si no hay disponibilidad, no se puede agendar.
    expect(days.length).toBeGreaterThan(0);
    expect(services.length).toBeGreaterThan(0);
    expect(pets.length).toBeGreaterThan(0);

    const dateStr = days[0]!; // ya es "YYYY-MM-DD"
    const vets = await appointmentsService.getAvailableVets(dateStr);
    expect(vets.length).toBeGreaterThan(0);

    const vet = vets[0]!;
    const scheduledAt = `${dateStr}T${vet.start_time ?? '09:00'}:00`;

    const created = await appointmentsService.createAppointment({
      pet_id: pets[0]!.id,
      service_id: services[0]!.id,
      assigned_to_id: vet.id,
      scheduled_at: scheduledAt,
      notes: 'Cita de prueba (integración)',
    });

    // Se cancela aunque falle una aserción: una cita pendiente que quede
    // ocupa el hueco y rompe las siguientes ejecuciones.
    try {
      expect(created.id).toEqual(expect.any(Number));
      expect(created.status).toBe('pending');

      // Contrato de zona horaria: el propietario no puede leer Configuración
      // General, así que la zona viene en cada cita y la app la adopta.
      expect(created.scheduled_at).toMatch(OFFSET_ISO);
      expect(created.time_zone).toEqual(expect.any(String));
      expect(getClinicTimeZone()).toBe(created.time_zone);
      // La hora sin offset que envió el asistente es la que se muestra, aunque
      // el dispositivo esté en otra zona.
      setClinicTimeZone('Asia/Tokyo');
      expect(formatClinicTime(created.scheduled_at, created.time_zone)).toBe(
        vet.start_time ?? '09:00',
      );
    } finally {
      const cancelled = await appointmentsService.cancelAppointment(
        created.id,
        'Prueba de integración',
      );
      expect(cancelled.status).toBe('cancelled');
    }
  }, 30000);
});

describe('appointmentsService horarios del servidor y edición (real)', () => {
  it('los horarios excluyen el ocupado y PATCH reprograma y vacía las notas', async () => {
    const { month, year } = (() => {
      const d = new Date();
      const m = d.getMonth() + 2;
      return m > 12
        ? { month: m - 12, year: d.getFullYear() + 1 }
        : { month: m, year: d.getFullYear() };
    })();
    const [days, services, pets] = await Promise.all([
      appointmentsService.getAvailableDays(month, year),
      appointmentsService.listServices(),
      petsService.listPets(),
    ]);
    const day = days[1] ?? days[0]!;
    const vet = (await appointmentsService.getAvailableVets(day))[0]!;
    const service = services[0]!;

    const before = await appointmentsService.getAvailableTimeSlots(
      day,
      vet.id,
      service.id,
    );
    expect(before.length).toBeGreaterThan(1);
    expect(before[0]).toEqual({
      time: expect.stringMatching(/^\d{2}:\d{2}$/),
      available: true,
    });

    const [first, second] = before;
    const created = await appointmentsService.createAppointment({
      pet_id: pets[0]!.id,
      service_id: service.id,
      assigned_to_id: vet.id,
      scheduled_at: `${day}T${first!.time}:00`,
      notes: 'Nota inicial',
    });
    try {
      const after = await appointmentsService.getAvailableTimeSlots(
        day,
        vet.id,
        service.id,
      );
      expect(after.map((s) => s.time)).not.toContain(first!.time);

      const moved = await appointmentsService.updateAppointment(created.id, {
        scheduled_at: `${day}T${second!.time}:00`,
        notes: '',
      });
      expect(moved.id).toBe(created.id);
      expect(formatClinicTime(moved.scheduled_at, moved.time_zone)).toBe(second!.time);
      expect(moved.notes ?? '').toBe('');

      // El detalle trae los pagos de la cita (se crea uno pendiente al agendar).
      const detail = await appointmentsService.getAppointment(created.id);
      expect(detail.payments?.length).toBeGreaterThan(0);
      expect(detail.payments![0]).toEqual(
        expect.objectContaining({ id: expect.any(Number), status: 'pending' }),
      );
    } finally {
      await appointmentsService.cancelAppointment(created.id, 'Prueba de integración');
    }
  }, 30000);

  it('PATCH de una cita cancelada responde 422 con el motivo', async () => {
    const list = await appointmentsService.listAppointments({ status: 'cancelled' });
    expect(list.length).toBeGreaterThan(0);
    await expect(
      appointmentsService.updateAppointment(list[0]!.id, { notes: 'x' }),
    ).rejects.toMatchObject({
      kind: 'validation',
      message: 'Solo se pueden modificar citas pendientes o confirmadas',
    });
  });
});
