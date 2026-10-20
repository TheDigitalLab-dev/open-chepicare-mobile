/**
 * Reglas de presentación de los eventos de la clínica (lógica pura): cupos,
 * estado del botón de inscripción, "N inscritos de M", horario en la zona de
 * la clínica y si una inscripción todavía se puede cancelar.
 */
import type { ClinicEvent, EventRegistration } from '@/types/events';
import {
  canCancelRegistration,
  eventRegistrationState,
  eventScheduleLabel,
  eventSpotsLabel,
  registeredCountLabel,
  registrationStatusLabel,
} from '@/utils/clinicEvents';
import { formatClinicDate, formatClinicTime, setClinicConfig } from '@/utils/clinicTime';

function event(overrides: Partial<ClinicEvent> = {}): ClinicEvent {
  return {
    id: 1,
    slug: 'charla',
    title: 'Charla',
    description: null,
    location: 'Sede principal',
    starts_at: '2026-11-10T18:00:00-04:00',
    ends_at: '2026-11-10T19:00:00-04:00',
    registration_deadline: null,
    registration_closes_at: '2026-11-10T18:00:00-04:00',
    capacity: 25,
    registered_count: 1,
    spots_left: 24,
    is_full: false,
    registration_open: true,
    status: 'published',
    image_url: null,
    public_url: 'http://localhost:3000/eventos/charla',
    my_registration: null,
    ...overrides,
  };
}

function registration(overrides: Partial<EventRegistration> = {}): EventRegistration {
  return {
    id: 9,
    event_id: 1,
    source: 'owner',
    status: 'active',
    full_name: 'Carlos López',
    email: 'owner3@example.com',
    created_at: '2026-10-20T14:46:06-04:00',
    cancelled_at: null,
    event: event(),
    ...overrides,
  };
}

beforeEach(() =>
  setClinicConfig({ time_zone: 'America/Caracas', date_format: 'DD/MM/YYYY' }),
);
afterEach(() => setClinicConfig(null));

describe('eventSpotsLabel', () => {
  it('cuenta los cupos libres en singular y plural', () => {
    expect(eventSpotsLabel(event())).toBe('Quedan 24 cupos');
    expect(eventSpotsLabel(event({ spots_left: 1, registered_count: 24 }))).toBe(
      'Queda 1 cupo',
    );
  });

  it('"Cupo completo" cuando no queda ninguno', () => {
    expect(
      eventSpotsLabel(event({ spots_left: 0, registered_count: 25, is_full: true })),
    ).toBe('Cupo completo');
  });
});

describe('eventRegistrationState', () => {
  it('abierto, inscrito, lleno, cerrado y cancelado', () => {
    expect(eventRegistrationState(event())).toBe('open');
    expect(
      eventRegistrationState(
        event({ my_registration: registration(), registration_open: false }),
      ),
    ).toBe('registered');
    expect(
      eventRegistrationState(
        event({ is_full: true, spots_left: 0, registration_open: false }),
      ),
    ).toBe('full');
    expect(eventRegistrationState(event({ registration_open: false }))).toBe('closed');
    expect(
      eventRegistrationState(
        event({ status: 'cancelled', my_registration: registration() }),
      ),
    ).toBe('cancelled');
  });
});

describe('registeredCountLabel', () => {
  it('"N inscritos de M" con singular', () => {
    expect(registeredCountLabel(4, 40)).toBe('4 inscritos de 40');
    expect(registeredCountLabel(1, 25)).toBe('1 inscrito de 25');
    expect(registeredCountLabel(0, 3)).toBe('0 inscritos de 3');
  });
});

describe('eventScheduleLabel', () => {
  it('mismo día: fecha y rango de horas en la zona de la clínica', () => {
    const e = event();
    expect(eventScheduleLabel(e.starts_at, e.ends_at)).toBe(
      `${formatClinicDate(e.starts_at)} · ${formatClinicTime(e.starts_at)} – ${formatClinicTime(e.ends_at)}`,
    );
  });

  it('varios días: fecha y hora de inicio y de fin', () => {
    const starts = '2026-11-10T18:00:00-04:00';
    const ends = '2026-11-11T12:00:00-04:00';
    expect(eventScheduleLabel(starts, ends)).toBe(
      `${formatClinicDate(starts)} ${formatClinicTime(starts)} – ${formatClinicDate(ends)} ${formatClinicTime(ends)}`,
    );
  });

  it('el día es el de la clínica, no el del dispositivo', () => {
    // 23:30 en Caracas ya es el día siguiente en UTC.
    const starts = '2026-11-10T23:00:00-04:00';
    const ends = '2026-11-10T23:30:00-04:00';
    expect(eventScheduleLabel(starts, ends)).toContain(formatClinicDate(starts));
    expect(eventScheduleLabel(starts, ends)).not.toContain(' – 11/11');
  });
});

describe('inscripciones', () => {
  const now = Date.parse('2026-10-20T12:00:00-04:00');

  it('etiqueta de estado', () => {
    expect(registrationStatusLabel(registration())).toBe('Inscrito');
    expect(
      registrationStatusLabel(
        registration({ status: 'cancelled', cancelled_at: '2026-10-20T15:00:00-04:00' }),
      ),
    ).toBe('Cancelada');
  });

  it('solo se cancela una inscripción activa de un evento que no terminó', () => {
    expect(canCancelRegistration(registration(), now)).toBe(true);
    expect(canCancelRegistration(registration({ status: 'cancelled' }), now)).toBe(false);
    const past = event({
      starts_at: '2026-10-01T09:00:00-04:00',
      ends_at: '2026-10-01T10:00:00-04:00',
    });
    expect(canCancelRegistration(registration({ event: past }), now)).toBe(false);
  });
});
