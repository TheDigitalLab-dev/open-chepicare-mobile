/**
 * Integración REAL del servicio de Eventos de la clínica contra
 * `../open-chepicare-web` (seeds demo: "Jornada de vacunación", "Feria de
 * adopción" llena 3/3 y "Charla: nutrición de tu mascota").
 *
 * Usa `owner3@example.com` (sin inscripciones en el seed) y deja todo como
 * estaba: cada inscripción creada se cancela de verdad.
 */
import * as authService from '@/services/auth';
import * as eventsService from '@/services/events';
import { ApiError } from '@/types/api';
import type { ClinicEvent } from '@/types/events';
import { getClinicTimeZone, setClinicTimeZone } from '@/utils/clinicTime';
import * as secureStore from '@/utils/secureStore';

const OWNER = 'owner3@example.com';

async function expectApiError(
  promise: Promise<unknown>,
  status: number,
  code?: string,
): Promise<ApiError> {
  try {
    await promise;
  } catch (e) {
    expect(e).toBeInstanceOf(ApiError);
    const error = e as ApiError;
    expect(error.status).toBe(status);
    if (code) expect(error.code).toBe(code);
    return error;
  }
  throw new Error(`Se esperaba un error ${status}`);
}

/** Evento abierto en el que el propietario aún no está inscrito. */
async function openEvent(): Promise<ClinicEvent> {
  const { events } = await eventsService.listOwnerEvents();
  const event = events.find((e) => e.registration_open && !e.my_registration);
  if (!event) throw new Error('El seed demo debe tener un evento con cupo');
  return event;
}

afterAll(async () => {
  setClinicTimeZone(null);
  await secureStore.clearTokens();
});

describe('eventsService (propietario)', () => {
  const created: number[] = [];

  beforeAll(async () => {
    await authService.login(OWNER, 'password123');
  });

  afterAll(async () => {
    await authService.login(OWNER, 'password123');
    for (const id of created) {
      await eventsService.cancelEventRegistration(id).catch(() => undefined);
    }
  });

  it('lista los eventos publicados próximos con cupo y aprende la zona de la clínica', async () => {
    setClinicTimeZone(null);
    const res = await eventsService.listOwnerEvents();
    expect(getClinicTimeZone()).toBe(res.time_zone);
    expect(res.events.length).toBeGreaterThanOrEqual(3);

    const starts = res.events.map((e) => e.starts_at);
    expect([...starts].sort((a, b) => Date.parse(a) - Date.parse(b))).toEqual(starts);
    for (const e of res.events) {
      expect(e.status).not.toBe('draft');
      expect(Date.parse(e.ends_at)).toBeGreaterThan(Date.now());
      expect(e.spots_left).toBe(Math.max(e.capacity - e.registered_count, 0));
      expect(e.is_full).toBe(e.spots_left === 0);
    }
    const full = res.events.find((e) => e.title === 'Feria de adopción')!;
    expect(full.is_full).toBe(true);
    expect(full.registration_open).toBe(false);
  });

  it('muestra el detalle de un evento y 404 si no existe', async () => {
    const event = await openEvent();
    const res = await eventsService.getOwnerEvent(event.id);
    expect(res.event.id).toBe(event.id);
    expect(res.event.title).toBe(event.title);
    expect(res.event.my_registration).toBeNull();

    await expectApiError(eventsService.getOwnerEvent(99999999), 404);
  });

  it('se inscribe con un toque, no repite, aparece en Mis inscripciones y cancela', async () => {
    const event = await openEvent();

    const { registration } = await eventsService.registerForEvent(event.id);
    created.push(registration.id);
    expect(registration.source).toBe('owner');
    expect(registration.status).toBe('active');
    expect(registration.email).toBe(OWNER);
    expect(registration.event.id).toBe(event.id);
    expect(registration.event.registered_count).toBe(event.registered_count + 1);
    expect(registration.event.spots_left).toBe(event.spots_left - 1);

    const detail = await eventsService.getOwnerEvent(event.id);
    expect(detail.event.my_registration?.id).toBe(registration.id);

    const duplicate = await expectApiError(
      eventsService.registerForEvent(event.id),
      409,
      'duplicate',
    );
    expect(duplicate.kind).toBe('conflict');
    expect(duplicate.message).toBe('Este correo ya está inscrito en el evento');

    const mine = await eventsService.listMyEventRegistrations();
    expect(mine.registrations.map((r) => r.id)).toContain(registration.id);

    const { registration: cancelled } = await eventsService.cancelEventRegistration(
      registration.id,
    );
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancelled_at).not.toBeNull();
    expect(cancelled.event.registered_count).toBe(event.registered_count);

    const again = await expectApiError(
      eventsService.cancelEventRegistration(registration.id),
      422,
    );
    expect(again.message).toBe('La inscripción ya está cancelada');

    // Tras cancelar puede volver a inscribirse (y se cancela al terminar).
    const { registration: second } = await eventsService.registerForEvent(event.id, {
      notes: 'Voy con mi perro',
    });
    created.push(second.id);
    expect(second.status).toBe('active');
  });

  it('no deja inscribirse en un evento con el cupo completo', async () => {
    const { events } = await eventsService.listOwnerEvents();
    const full = events.find((e) => e.is_full && !e.my_registration)!;
    const error = await expectApiError(
      eventsService.registerForEvent(full.id),
      409,
      'full',
    );
    expect(error.message).toBe('Cupo completo');
  });

  it('no cancela inscripciones ajenas', async () => {
    await expectApiError(eventsService.cancelEventRegistration(99999999), 404);
  });

  it('el propietario no accede al resumen del personal', async () => {
    const error = await expectApiError(eventsService.getStaffEventsSummary(), 403);
    expect(error.kind).toBe('forbidden');
  });
});

describe('eventsService (personal)', () => {
  it('el veterinario ve SOLO el resumen: id, título, fechas, cupo e inscritos', async () => {
    await authService.login('vet@chepicare.com', 'password123');
    const res = await eventsService.getStaffEventsSummary();
    expect(res.time_zone).toBeTruthy();
    expect(res.events.length).toBeGreaterThanOrEqual(3);
    for (const e of res.events) {
      expect(Object.keys(e).sort()).toEqual(
        ['capacity', 'ends_at', 'id', 'registered_count', 'starts_at', 'title'].sort(),
      );
    }
    const full = res.events.find((e) => e.title === 'Feria de adopción')!;
    expect(full.registered_count).toBe(full.capacity);
  });

  it('el personal no usa los endpoints del propietario', async () => {
    await authService.login('admin@chepicare.com', 'password123');
    await expectApiError(eventsService.listOwnerEvents(), 403);
  });
});
