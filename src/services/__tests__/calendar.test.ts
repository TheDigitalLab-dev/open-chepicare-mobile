/**
 * Integración REAL del servicio de Calendario contra `../open-chepicare-web`:
 * `GET /owner-calendar-events` (propietario) y `GET /admin/calendar-events`
 * (personal). Las citas canceladas se crean y cancelan de verdad.
 */
import * as appointmentsService from '@/services/appointments';
import * as authService from '@/services/auth';
import * as calendarService from '@/services/calendar';
import * as eventsService from '@/services/events';
import * as petsService from '@/services/pets';
import { bookFreshAppointment } from '@/testing/ownerData';
import { ApiError } from '@/types/api';
import { CALENDAR_EVENT_TYPES } from '@/types/calendar';
import { monthGridRange } from '@/utils/calendarGrid';
import {
  clinicDayKey,
  clinicMonth,
  getClinicTimeZone,
  setClinicTimeZone,
} from '@/utils/clinicTime';
import { shiftMonth } from '@/utils/schedule';
import * as secureStore from '@/utils/secureStore';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

afterAll(async () => {
  setClinicTimeZone(null);
  await secureStore.clearTokens();
});

describe('calendarService (propietario)', () => {
  beforeAll(async () => {
    await authService.login('owner1@example.com', 'password123');
  });

  it('trae los eventos del rango, solo de sus mascotas, y aprende la zona de la clínica', async () => {
    setClinicTimeZone(null);
    const range = monthGridRange(clinicMonth());
    const res = await calendarService.getOwnerCalendarEvents(range);

    expect(res.range.start).toBe(range.start);
    expect(res.range.end).toBe(range.end);
    expect(getClinicTimeZone()).toBe(res.range.time_zone);
    expect(res.allowed_types).toEqual([...CALENDAR_EVENT_TYPES]);
    expect(typeof res.can_create_appointment).toBe('boolean');
    // El seed demo deja citas y tratamientos en el mes actual.
    expect(res.events.some((e) => e.type === 'appointment')).toBe(true);
    expect(res.events.some((e) => e.type === 'prescription')).toBe(true);

    const myPetIds = new Set((await petsService.listPets()).map((p) => p.id));
    for (const event of res.events) {
      expect(event.start_date).toMatch(DAY);
      expect(event.end_date >= event.start_date).toBe(true);
      // Un evento del rango toca al menos un día del rango.
      expect(event.end_date >= range.start && event.start_date <= range.end).toBe(true);
      expect(event.status).not.toBe('cancelled');
      // Los eventos de la clínica no son de una mascota.
      if (event.type === 'clinic_event') expect(event.pet).toBeNull();
      else expect(myPetIds.has(event.pet.id)).toBe(true);
    }
  });

  it('incluye los eventos de la clínica en los que está inscrito (sin mascota)', async () => {
    const { events: upcoming } = await eventsService.listOwnerEvents();
    const registered = upcoming.find((e) => e.my_registration)!;
    expect(registered).toBeDefined();
    const day = clinicDayKey(registered.starts_at);
    const res = await calendarService.getOwnerCalendarEvents({
      start: day,
      end: day,
      types: ['clinic_event'],
    });
    const item = res.events.find((e) => e.id === `clinic_event-${registered.id}`);
    expect(item).toEqual(
      expect.objectContaining({
        type: 'clinic_event',
        record_id: registered.id,
        title: registered.title,
        pet: null,
        status: 'published',
        starts_at: registered.starts_at,
        ends_at: registered.ends_at,
      }),
    );
    if (item?.type !== 'clinic_event') throw new Error('Se esperaba un clinic_event');
    expect(item.details.registration_id).toBe(registered.my_registration!.id);
    expect(item.details.slug).toBe(registered.slug);
    // Los que no tienen inscripción activa no salen.
    const notMine = upcoming.filter((e) => !e.my_registration).map((e) => e.id);
    expect(res.events.some((e) => notMine.includes(e.record_id))).toBe(false);
  });

  it('filtra por tipos', async () => {
    const range = monthGridRange(clinicMonth());
    const res = await calendarService.getOwnerCalendarEvents({
      ...range,
      types: ['prescription'],
    });
    expect(res.filters.types).toEqual(['prescription']);
    expect(res.events.length).toBeGreaterThan(0);
    expect(res.events.every((e) => e.type === 'prescription')).toBe(true);
  });

  it('oculta las canceladas por defecto y las muestra con includeCancelled', async () => {
    const appointment = await bookFreshAppointment(5);
    await appointmentsService.cancelAppointment(appointment.id, 'Prueba calendario');
    const day = clinicDayKey(appointment.scheduled_at, appointment.time_zone);
    const range = { start: day, end: day, types: ['appointment' as const] };
    const id = `appointment-${appointment.id}`;

    const hidden = await calendarService.getOwnerCalendarEvents(range);
    expect(hidden.events.map((e) => e.id)).not.toContain(id);

    const shown = await calendarService.getOwnerCalendarEvents({
      ...range,
      includeCancelled: true,
    });
    expect(shown.filters.include_cancelled).toBe(true);
    const event = shown.events.find((e) => e.id === id);
    expect(event).toEqual(
      expect.objectContaining({
        type: 'appointment',
        status: 'cancelled',
        record_id: appointment.id,
      }),
    );
  });

  it('rechaza un rango de más de 62 días con el mensaje del servidor', async () => {
    const start = monthGridRange(clinicMonth()).start;
    const end = monthGridRange(shiftMonth(clinicMonth(), 2)).end;
    const error = await calendarService
      .getOwnerCalendarEvents({ start, end })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).message).toMatch(/62 días/);
  });

  it('el propietario no puede usar el endpoint del personal', async () => {
    const error = await calendarService
      .getStaffCalendarEvents(monthGridRange(clinicMonth()))
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('forbidden');
  });
});

describe('calendarService (personal)', () => {
  it('el veterinario ve por defecto SUS citas y puede pedir toda la clínica u otro veterinario', async () => {
    const vet = await authService.login('vet@chepicare.com', 'password123');
    const range = monthGridRange(clinicMonth());

    const mine = await calendarService.getStaffCalendarEvents(range);
    expect(mine.filters.vet_id).toBe(vet.id);
    expect(mine.allowed_types).not.toContain('prescription');
    expect(mine.vets.some((v) => v.id === vet.id)).toBe(true);
    const mineAppointments = mine.events.flatMap((e) =>
      e.type === 'appointment' ? [e] : [],
    );
    expect(mineAppointments.length).toBeGreaterThan(0);
    expect(mineAppointments.every((e) => e.details.assigned_to?.id === vet.id)).toBe(
      true,
    );
    // El personal ve el dueño de cada cita.
    expect(mineAppointments[0]!.details.owner).toEqual(
      expect.objectContaining({ id: expect.any(Number), full_name: expect.any(String) }),
    );

    const all = await calendarService.getStaffCalendarEvents({ ...range, vetId: 'all' });
    expect(all.filters.vet_id).toBeNull();
    const allAppointments = all.events.filter((e) => e.type === 'appointment');
    expect(allAppointments.length).toBeGreaterThanOrEqual(mineAppointments.length);

    const other = mine.vets.find((v) => v.id !== vet.id)!;
    const theirs = await calendarService.getStaffCalendarEvents({
      ...range,
      vetId: other.id,
      types: ['appointment'],
    });
    expect(theirs.filters.vet_id).toBe(other.id);
    expect(
      theirs.events.every(
        (e) => e.type === 'appointment' && e.details.assigned_to?.id === other.id,
      ),
    ).toBe(true);

    const me = await calendarService.getStaffCalendarEvents({ ...range, vetId: 'me' });
    expect(me.filters.vet_id).toBe(vet.id);
  });

  it('el admin ve por defecto toda la clínica', async () => {
    await authService.login('admin@chepicare.com', 'password123');
    const res = await calendarService.getStaffCalendarEvents(
      monthGridRange(clinicMonth()),
    );
    expect(res.filters.vet_id).toBeNull();
    expect(res.can_create_appointment).toBe(true);
  });
});
