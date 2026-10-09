/**
 * Integración REAL de las reglas de citas del backend (rama
 * `fix/functional-review-2026-10`):
 *  - la hora que envía la app (sin offset) es hora de pared de la clínica;
 *  - un veterinario no puede tener dos citas que se crucen (422 con mensaje);
 *  - "Eliminar" es borrado lógico y se bloquea (422) si hay consulta;
 *  - el detalle trae `allowed_status_transitions`.
 * Cada test limpia lo que crea.
 */
import * as authService from '@/services/auth';
import * as adminService from '@/services/admin';
import { fetchClinicTimeZone } from '@/services/clinicSettings';
import * as secureStore from '@/utils/secureStore';
import { ApiError } from '@/types/api';
import type { Pet } from '@/types/models';
import {
  clinicMonth,
  clinicWallDateTime,
  clinicWallTimeToInstant,
  formatClinicTime,
  getClinicTimeZone,
  setClinicTimeZone,
} from '@/utils/clinicTime';

const OFFSET_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

interface FreeSlot {
  day: string;
  time: string;
  vetId: number;
  serviceId: number;
}

/** Busca un hueco libre real (este mes o el siguiente de la clínica). */
async function findFreeSlot(): Promise<FreeSlot> {
  const services = await adminService.listAdminServices();
  const service = services[0];
  if (!service) throw new Error('El seed no tiene servicios');
  const { month, year } = clinicMonth();
  const months = [
    { month, year },
    month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year },
  ];
  for (const m of months) {
    const days = await adminService.getAdminAvailableDays(m.month, m.year);
    for (const day of days) {
      const vets = await adminService.getAdminAvailableVets(day);
      for (const vet of vets) {
        const slots = await adminService.getAdminTimeSlots(day, vet.id, service.id);
        const slot = slots.find((s) => s.available);
        if (slot) return { day, time: slot.time, vetId: vet.id, serviceId: service.id };
      }
    }
  }
  throw new Error('No hay huecos libres en el seed');
}

async function ownedPets(): Promise<Pet[]> {
  const pets = await adminService.listAdminPets();
  return pets.filter((p) => p.proprietary_id != null);
}

beforeAll(async () => {
  await authService.login('admin@pawcare.com', 'password123');
  setClinicTimeZone(await fetchClinicTimeZone());
});

afterAll(async () => {
  setClinicTimeZone(null);
  await secureStore.clearTokens();
});

describe('fetchClinicTimeZone', () => {
  it('el admin lee la zona horaria de Configuración General', async () => {
    const tz = await fetchClinicTimeZone();
    expect(tz).toEqual(expect.any(String));
    expect(() => new Intl.DateTimeFormat('es', { timeZone: tz! })).not.toThrow();
  });

  it('sin permiso (veterinario) devuelve null sin lanzar', async () => {
    await authService.login('vet@pawcare.com', 'password123');
    try {
      await expect(fetchClinicTimeZone()).resolves.toBeNull();
    } finally {
      await authService.login('admin@pawcare.com', 'password123');
    }
  });
});

describe('citas: hora de la clínica, solapes y eliminación', () => {
  it('la hora elegida se guarda como hora de pared de la clínica', async () => {
    const slot = await findFreeSlot();
    const [pet] = await ownedPets();
    const created = await adminService.createAdminAppointment({
      pet_id: pet!.id,
      service_id: slot.serviceId,
      owner_id: pet!.proprietary_id!,
      assigned_to_id: slot.vetId,
      scheduled_at: clinicWallDateTime(slot.day, slot.time),
    });
    try {
      expect(formatClinicTime(created.scheduled_at)).toBe(slot.time);
    } finally {
      await adminService.deleteAdminAppointment(created.id);
    }
  }, 60000);

  it('la respuesta trae la hora con el offset, la zona y el origen de la cita', async () => {
    const tz = await fetchClinicTimeZone();
    const slot = await findFreeSlot();
    const [pet] = await ownedPets();
    const created = await adminService.createAdminAppointment({
      pet_id: pet!.id,
      service_id: slot.serviceId,
      owner_id: pet!.proprietary_id!,
      assigned_to_id: slot.vetId,
      scheduled_at: clinicWallDateTime(slot.day, slot.time),
    });
    try {
      expect(created.scheduled_at).toMatch(OFFSET_ISO);
      expect(created.time_zone).toBe(tz);
      // El backend fija el origen: personal desde la app.
      expect(created.source).toBe('staff_mobile');
      // Se muestra en la zona de la cita aunque la conocida (o el teléfono) sea otra.
      setClinicTimeZone('Asia/Tokyo');
      expect(formatClinicTime(created.scheduled_at, created.time_zone)).toBe(slot.time);
      const detail = await adminService.getAdminAppointment(created.id);
      expect(detail.time_zone).toBe(tz);
      expect(formatClinicTime(detail.scheduled_at, detail.time_zone)).toBe(slot.time);
    } finally {
      setClinicTimeZone(tz);
      await adminService.deleteAdminAppointment(created.id);
    }
  }, 60000);

  it('una hora con offset explícito es un instante absoluto', async () => {
    const tz = (await fetchClinicTimeZone())!;
    const slot = await findFreeSlot();
    const [pet] = await ownedPets();
    const created = await adminService.createAdminAppointment({
      pet_id: pet!.id,
      service_id: slot.serviceId,
      owner_id: pet!.proprietary_id!,
      assigned_to_id: slot.vetId,
      scheduled_at: clinicWallTimeToInstant(slot.day, slot.time, tz),
    });
    try {
      expect(formatClinicTime(created.scheduled_at, created.time_zone)).toBe(slot.time);
    } finally {
      await adminService.deleteAdminAppointment(created.id);
    }
  }, 60000);

  it('el veterinario (sin acceso a Configuración General) adopta la zona de las citas', async () => {
    await authService.login('vet@pawcare.com', 'password123');
    try {
      setClinicTimeZone(null);
      const list = await adminService.listAdminAppointments();
      expect(list.length).toBeGreaterThan(0);
      expect(list[0]!.time_zone).toEqual(expect.any(String));
      expect(getClinicTimeZone()).toBe(list[0]!.time_zone);
    } finally {
      await authService.login('admin@pawcare.com', 'password123');
      setClinicTimeZone(await fetchClinicTimeZone());
    }
  }, 60000);

  it('un solape con otra cita del veterinario responde 422 con el motivo', async () => {
    const slot = await findFreeSlot();
    const [petA, petB] = await ownedPets();
    const base = {
      service_id: slot.serviceId,
      assigned_to_id: slot.vetId,
      scheduled_at: clinicWallDateTime(slot.day, slot.time),
    };
    const first = await adminService.createAdminAppointment({
      ...base,
      pet_id: petA!.id,
      owner_id: petA!.proprietary_id!,
    });
    try {
      const attempt = adminService.createAdminAppointment({
        ...base,
        pet_id: petB!.id,
        owner_id: petB!.proprietary_id!,
      });
      await expect(attempt).rejects.toBeInstanceOf(ApiError);
      await expect(attempt).rejects.toMatchObject({
        status: 422,
        message: expect.stringContaining('se cruza con otra cita del veterinario'),
      });
    } finally {
      await adminService.deleteAdminAppointment(first.id);
    }
  }, 60000);

  it('detalle con transiciones; eliminar se bloquea con consulta y luego es lógico', async () => {
    const slot = await findFreeSlot();
    const [pet] = await ownedPets();
    const appt = await adminService.createAdminAppointment({
      pet_id: pet!.id,
      service_id: slot.serviceId,
      owner_id: pet!.proprietary_id!,
      assigned_to_id: slot.vetId,
      scheduled_at: clinicWallDateTime(slot.day, slot.time),
    });

    const detail = await adminService.getAdminAppointment(appt.id);
    expect(detail.id).toBe(appt.id);
    expect(detail.allowed_status_transitions).toEqual(
      expect.arrayContaining(['confirmed', 'cancelled']),
    );

    const consultation = await adminService.createAdminConsultation({
      pet_id: pet!.id,
      appointment_id: appt.id,
      consultation_date: slot.day,
      diagnosis: 'QA bloqueo de eliminación',
    });

    await expect(adminService.deleteAdminAppointment(appt.id)).rejects.toMatchObject({
      status: 422,
      message: 'No se puede eliminar una cita que tiene una consulta registrada',
    });

    await adminService.deleteAdminConsultation(consultation.id);
    await adminService.deleteAdminAppointment(appt.id);

    // Borrado lógico: deja de existir para la API (detalle 404).
    await expect(adminService.getAdminAppointment(appt.id)).rejects.toMatchObject({
      kind: 'notFound',
    });
  }, 60000);
});
