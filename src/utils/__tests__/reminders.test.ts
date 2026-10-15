import {
  appointmentReminders,
  clinicAgendaReminders,
  dewormingReminders,
  pendingPaymentReminders,
  sponsorshipReminders,
  vaccinationReminders,
  vaccinationScheduleReminders,
} from '@/utils/reminders';
import { setClinicConfig, setClinicTimeZone } from '@/utils/clinicTime';

const NOW = '2026-07-14T12:00:00.000Z';

afterEach(() => setClinicConfig(null));

describe('appointmentReminders', () => {
  const base = {
    pet: { id: 1, name: 'Luna', species: 'dog' },
    service: { id: 2, name: 'Consulta general' },
  };

  it('genera avisos 24 h y 2 h antes de una cita futura', () => {
    const specs = appointmentReminders(
      [
        {
          id: 10,
          scheduled_at: '2026-07-16T15:00:00.000Z',
          status: 'confirmed',
          ...base,
        },
      ],
      NOW,
    );

    expect(specs).toHaveLength(2);
    expect(specs[0]).toMatchObject({
      identifier: 'appt-10-24h',
      triggerAt: '2026-07-15T15:00:00.000Z',
    });
    expect(specs[1]).toMatchObject({
      identifier: 'appt-10-2h',
      triggerAt: '2026-07-16T13:00:00.000Z',
    });
    expect(specs[0]!.body).toContain('Luna');
    expect(specs[0]!.body).toContain('Consulta general');
  });

  it('el texto usa la hora de la clínica que trae la cita (`time_zone`)', () => {
    const specs = appointmentReminders(
      [
        {
          id: 13,
          scheduled_at: '2026-07-16T11:00:00-04:00',
          time_zone: 'America/Caracas',
          status: 'confirmed',
          ...base,
        },
      ],
      NOW,
    );
    expect(specs[0]!.triggerAt).toBe('2026-07-15T15:00:00.000Z');
    expect(specs[0]!.body).toContain('11:00');
  });

  it('omite los avisos cuyo momento ya pasó (cita en menos de 24 h)', () => {
    const specs = appointmentReminders(
      [{ id: 11, scheduled_at: '2026-07-15T08:00:00.000Z', status: 'pending', ...base }],
      NOW,
    );
    // Solo el de 2 h antes (el de 24 h antes ya quedó en el pasado).
    expect(specs.map((s) => s.identifier)).toEqual(['appt-11-2h']);
  });

  it('ignora citas canceladas, completadas o pasadas', () => {
    const specs = appointmentReminders(
      [
        {
          id: 12,
          scheduled_at: '2026-07-16T15:00:00.000Z',
          status: 'cancelled',
          ...base,
        },
        {
          id: 13,
          scheduled_at: '2026-07-16T15:00:00.000Z',
          status: 'completed',
          ...base,
        },
        {
          id: 14,
          scheduled_at: '2026-07-01T15:00:00.000Z',
          status: 'confirmed',
          ...base,
        },
      ],
      NOW,
    );
    expect(specs).toEqual([]);
  });
});

describe('vaccinationReminders', () => {
  it('avisa 3 días antes del vencimiento', () => {
    const specs = vaccinationReminders(
      [{ id: 9, vaccine_name: 'Antirrábica', next_due_date: '2026-07-30' }],
      NOW,
    );

    expect(specs).toHaveLength(1);
    expect(specs[0]!.identifier).toBe('vacc-9-due');
    expect(specs[0]!.title).toContain('Vacuna');
    expect(specs[0]!.body).toContain('Antirrábica');
    expect(specs[0]!.body).toContain('30 de julio');
  });

  it('las 9:00 y el día son de la clínica, no del teléfono', () => {
    // Fecha solo-día: 27 jul (30 − 3) a las 9:00 en Caracas = 13:00 UTC,
    // sea cual sea la zona del teléfono.
    setClinicTimeZone('America/Caracas');
    const [caracas] = vaccinationReminders(
      [{ id: 9, vaccine_name: 'Antirrábica', next_due_date: '2026-07-30' }],
      NOW,
    );
    expect(caracas!.triggerAt).toBe('2026-07-27T13:00:00.000Z');
    expect(caracas!.body).toContain('30 de julio');

    // En Tokio (UTC+9) las 9:00 del 27 son las 00:00 UTC del mismo día.
    setClinicTimeZone('Asia/Tokyo');
    const [tokyo] = vaccinationReminders(
      [{ id: 9, vaccine_name: 'Antirrábica', next_due_date: '2026-07-30' }],
      NOW,
    );
    expect(tokyo!.triggerAt).toBe('2026-07-27T00:00:00.000Z');
    expect(tokyo!.body).toContain('30 de julio');
  });

  it('omite vacunas sin fecha próxima o con aviso ya vencido', () => {
    const specs = vaccinationReminders(
      [
        { id: 1, vaccine_name: 'Parvo', next_due_date: null },
        { id: 2, vaccine_name: 'Moquillo', next_due_date: '2026-07-10' },
      ],
      NOW,
    );
    expect(specs).toEqual([]);
  });
});

describe('dewormingReminders', () => {
  it('avisa 3 días antes de la próxima aplicación (O4)', () => {
    const specs = dewormingReminders(
      [{ id: 4, product_name: 'Drontal', next_due_date: '2026-07-25' }],
      NOW,
    );
    expect(specs).toHaveLength(1);
    expect(specs[0]!.identifier).toBe('dew-4-due');
    expect(specs[0]!.body).toContain('Drontal');
    expect(specs[0]!.category).toBe('vacunas');
    expect(specs[0]!.body).toContain('25 de julio');
  });

  it('calcula el aviso en la zona de la clínica', () => {
    setClinicTimeZone('America/Caracas');
    const [spec] = dewormingReminders(
      [{ id: 4, product_name: 'Drontal', next_due_date: '2026-07-25' }],
      NOW,
    );
    expect(spec!.triggerAt).toBe('2026-07-22T13:00:00.000Z');
  });

  it('omite sin fecha o en el pasado', () => {
    expect(
      dewormingReminders(
        [
          { id: 1, product_name: 'A', next_due_date: null },
          { id: 2, product_name: 'B', next_due_date: '2026-07-01' },
        ],
        NOW,
      ),
    ).toEqual([]);
  });
});

describe('pendingPaymentReminders', () => {
  it('recuerda mañana a las 10:00 los pagos pendientes y vencidos (O8)', () => {
    const specs = pendingPaymentReminders(
      [
        { id: 1, status: 'pending', amount: 25, currency: 'USD' },
        { id: 2, status: 'overdue', amount: 10, currency: 'USD' },
        { id: 3, status: 'completed', amount: 99, currency: 'USD' },
      ],
      NOW,
    );
    expect(specs.map((s) => s.identifier)).toEqual(['pay-1-pending', 'pay-2-pending']);
    expect(specs[1]!.title).toContain('vencido');
    expect(specs[0]!.category).toBe('pagos');
  });

  it('"mañana a las 10:00" es de la clínica', () => {
    // NOW = 14 jul 08:00 en Caracas → mañana 15 jul 10:00 = 14:00 UTC.
    setClinicTimeZone('America/Caracas');
    const [spec] = pendingPaymentReminders(
      [{ id: 1, status: 'pending', amount: 25, currency: 'USD' }],
      NOW,
    );
    expect(spec!.triggerAt).toBe('2026-07-15T14:00:00.000Z');

    // A las 21:00 del 14 en Caracas (01:00 UTC del 15) "mañana" sigue siendo el 15.
    const [late] = pendingPaymentReminders(
      [{ id: 1, status: 'pending', amount: 25, currency: 'USD' }],
      '2026-07-15T01:00:00.000Z',
    );
    expect(late!.triggerAt).toBe('2026-07-15T14:00:00.000Z');
  });
});

describe('clinicAgendaReminders', () => {
  it('programa el resumen de mañana a las 7:30 con el conteo de citas (A3/V2)', () => {
    const specs = clinicAgendaReminders(
      [
        { id: 1, scheduled_at: '2026-07-15T14:00:00.000Z', status: 'confirmed' },
        { id: 2, scheduled_at: '2026-07-15T16:00:00.000Z', status: 'pending' },
        { id: 3, scheduled_at: '2026-07-15T18:00:00.000Z', status: 'cancelled' },
        { id: 4, scheduled_at: '2026-07-20T18:00:00.000Z', status: 'confirmed' },
      ],
      NOW,
    );
    expect(specs).toHaveLength(1);
    expect(specs[0]!.identifier).toBe('agenda-2026-07-15');
    expect(specs[0]!.body).toContain('2 citas');
    const trigger = new Date(specs[0]!.triggerAt);
    expect(trigger.getHours()).toBe(7);
    expect(trigger.getMinutes()).toBe(30);
  });

  it('cuenta los días y programa las 7:30 en la zona de la clínica (`time_zone`)', () => {
    // NOW = 14 jul 08:00 en Caracas; mañana en la clínica es el 15.
    const tz = 'America/Caracas';
    const specs = clinicAgendaReminders(
      [
        // 15 jul 22:00 en Caracas (16 jul 02:00 UTC): cuenta para el 15.
        {
          id: 1,
          scheduled_at: '2026-07-15T22:00:00-04:00',
          status: 'confirmed',
          time_zone: tz,
        },
        // 16 jul 00:30 en Caracas: no es del 15.
        {
          id: 2,
          scheduled_at: '2026-07-16T00:30:00-04:00',
          status: 'pending',
          time_zone: tz,
        },
      ],
      NOW,
    );
    expect(specs).toHaveLength(1);
    expect(specs[0]!.identifier).toBe('agenda-2026-07-15');
    expect(specs[0]!.body).toContain('1 cita');
    // 7:30 en Caracas = 11:30 UTC.
    expect(specs[0]!.triggerAt).toBe('2026-07-15T11:30:00.000Z');
  });

  it('sin citas mañana, no hay resumen', () => {
    expect(
      clinicAgendaReminders(
        [{ id: 4, scheduled_at: '2026-07-20T18:00:00.000Z', status: 'confirmed' }],
        NOW,
      ),
    ).toEqual([]);
  });
});

describe('vaccinationScheduleReminders', () => {
  it('avisa el día previo a la vacunación programada de la clínica (A10)', () => {
    const specs = vaccinationScheduleReminders(
      [
        {
          id: 7,
          schedule_type: 'Refuerzo anual',
          start_date: '2026-07-20',
          status: 'pending',
          pet: { name: 'Rocky' },
        },
        {
          id: 8,
          schedule_type: 'Primaria',
          start_date: null,
          status: 'pending',
          pet: null,
        },
      ],
      NOW,
    );
    expect(specs).toHaveLength(1);
    expect(specs[0]!.identifier).toBe('vsched-7');
    expect(specs[0]!.body).toContain('Rocky');
    expect(specs[0]!.body).toContain('20 de julio');
    expect(specs[0]!.category).toBe('agenda');
  });

  it('el aviso nombra el tipo de esquema en español, no el enum del backend', () => {
    const [spec] = vaccinationScheduleReminders(
      [
        {
          id: 9,
          schedule_type: 'puppy_dog',
          start_date: '2026-07-20',
          status: 'active',
          pet: { name: 'Rocky' },
        },
      ],
      NOW,
    );
    expect(spec!.body).toBe('Rocky — Esquema cachorro (perro) el 20 de julio');
    expect(spec!.body).not.toContain('puppy_dog');
  });

  it('avisa el día previo a las 8:00 de la clínica', () => {
    setClinicTimeZone('America/Caracas');
    const [spec] = vaccinationScheduleReminders(
      [
        {
          id: 7,
          schedule_type: 'Refuerzo anual',
          start_date: '2026-07-20',
          status: 'pending',
          pet: { name: 'Rocky' },
        },
      ],
      NOW,
    );
    expect(spec!.triggerAt).toBe('2026-07-19T12:00:00.000Z');
  });
});

describe('sponsorshipReminders', () => {
  it('avisa 5 días antes del fin del apadrinamiento activo (O10)', () => {
    const specs = sponsorshipReminders(
      [
        { id: 3, status: 'active', end_date: '2026-07-25', pet: { name: 'Milo' } },
        { id: 4, status: 'cancelled', end_date: '2026-07-25', pet: null },
      ],
      NOW,
    );
    expect(specs).toHaveLength(1);
    expect(specs[0]!.identifier).toBe('sponsor-3-renewal');
    expect(specs[0]!.body).toContain('Milo');
    expect(specs[0]!.body).toContain('25 de julio');
  });

  it('avisa 5 días antes a las 9:00 de la clínica', () => {
    setClinicTimeZone('America/Caracas');
    const [spec] = sponsorshipReminders(
      [{ id: 3, status: 'active', end_date: '2026-07-25', pet: { name: 'Milo' } }],
      NOW,
    );
    expect(spec!.triggerAt).toBe('2026-07-20T13:00:00.000Z');
  });

  it('omite el aviso si su momento en la clínica ya pasó', () => {
    // Fin el 19 → aviso el 14 a las 9:00 de Tokio (00:00 UTC), antes de NOW.
    setClinicTimeZone('Asia/Tokyo');
    expect(
      sponsorshipReminders(
        [{ id: 3, status: 'active', end_date: '2026-07-19', pet: null }],
        NOW,
      ),
    ).toEqual([]);
  });
});
