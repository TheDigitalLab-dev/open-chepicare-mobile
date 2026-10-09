/**
 * Hora de la clínica (lógica pura). Regla del backend (`ClinicTime`): en la BD
 * todo es UTC; lo que el usuario escribe o ve es hora de pared de la clínica
 * (Configuración General → zona horaria). Un datetime SIN offset se interpreta
 * en la zona de la clínica.
 */
import {
  clinicDayKey,
  clinicMonth,
  clinicWallDateTime,
  clinicWallTimeToInstant,
  formatClinicDate,
  formatClinicDateTime,
  formatClinicTime,
  getClinicTimeZone,
  learnClinicTimeZone,
  setClinicTimeZone,
} from '@/utils/clinicTime';
import { formatDate, formatDateTime } from '@/utils/format';

afterEach(() => setClinicTimeZone(null));

describe('setClinicTimeZone', () => {
  it('acepta una zona IANA válida', () => {
    setClinicTimeZone('America/Caracas');
    expect(getClinicTimeZone()).toBe('America/Caracas');
  });

  it('ignora una zona inválida (se usa la del dispositivo)', () => {
    setClinicTimeZone('Marte/Olympus');
    expect(getClinicTimeZone()).toBeUndefined();
  });
});

describe('formato en la zona de la clínica', () => {
  // 15:00 UTC = 11:00 en Caracas (UTC-4) = 00:00 del día 16 en Tokio (UTC+9).
  const instant = '2026-03-15T15:00:00.000Z';

  it('muestra la hora de pared de la clínica, no la del dispositivo', () => {
    setClinicTimeZone('America/Caracas');
    expect(formatClinicTime(instant)).toBe('11:00');
    expect(formatClinicDateTime(instant)).toContain('15');
    expect(formatClinicDateTime(instant)).toContain('11:00');
  });

  it('cambia de día cuando la zona de la clínica lo exige', () => {
    setClinicTimeZone('Asia/Tokyo');
    expect(formatClinicTime(instant)).toBe('00:00');
    expect(formatClinicDate(instant)).toContain('16');
  });

  it('formatDateTime de utils/format usa la zona de la clínica', () => {
    setClinicTimeZone('America/Caracas');
    expect(formatDateTime(instant)).toBe(formatClinicDateTime(instant));
  });

  it('una fecha sin hora ("YYYY-MM-DD") es un día de calendario: nunca se corre', () => {
    setClinicTimeZone('America/Caracas');
    expect(formatClinicDate('2026-03-15')).toContain('15');
    expect(formatDate('2026-03-15')).toContain('15');
    setClinicTimeZone('Asia/Tokyo');
    expect(formatDate('2026-03-15')).toContain('15');
  });

  it('valores vacíos o inválidos', () => {
    expect(formatClinicDateTime(null)).toBe('—');
    expect(formatClinicDate(undefined)).toBe('—');
    expect(formatClinicDateTime('no-es-fecha')).toBe('no-es-fecha');
  });
});

describe('clinicMonth', () => {
  it('el mes de la clínica, no el del dispositivo', () => {
    setClinicTimeZone('America/Caracas');
    // 1 de abril 02:00 UTC = 31 de marzo 22:00 en Caracas.
    expect(clinicMonth(new Date('2026-04-01T02:00:00Z'))).toEqual({
      month: 3,
      year: 2026,
    });
  });
});

describe('clinicWallDateTime', () => {
  it('envía la hora de pared SIN offset (el backend la interpreta en la clínica)', () => {
    expect(clinicWallDateTime('2026-03-15', '09:30')).toBe('2026-03-15T09:30:00');
  });
});

describe('respuestas con el offset de la clínica y `time_zone` (contrato e8ad843)', () => {
  // Las respuestas de citas traen la hora con el offset de la clínica.
  const withOffset = '2026-03-15T09:00:00-04:00';

  it('interpreta el offset: es el mismo instante que su equivalente en UTC', () => {
    setClinicTimeZone('America/Caracas');
    expect(formatClinicTime(withOffset)).toBe('09:00');
    expect(formatClinicTime(withOffset)).toBe(
      formatClinicTime('2026-03-15T13:00:00.000Z'),
    );
  });

  it('la zona de la cita manda sobre la conocida y sobre la del dispositivo', () => {
    setClinicTimeZone('Asia/Tokyo');
    expect(formatClinicTime(withOffset, 'America/Caracas')).toBe('09:00');
    expect(formatClinicDateTime(withOffset, 'America/Caracas')).toContain('09:00');
    expect(formatClinicDate(withOffset, 'America/Caracas')).toContain('15');
    expect(formatDateTime(withOffset, 'America/Caracas')).toBe(
      formatClinicDateTime(withOffset, 'America/Caracas'),
    );
  });

  it('una zona de la cita inválida o ausente cae en la zona conocida', () => {
    setClinicTimeZone('Asia/Tokyo');
    expect(formatClinicTime(withOffset, 'Marte/Olympus')).toBe('22:00');
    expect(formatClinicTime(withOffset, null)).toBe('22:00');
  });

  it('learnClinicTimeZone adopta la zona de una respuesta, pero no la borra si falta', () => {
    learnClinicTimeZone('America/Caracas');
    expect(getClinicTimeZone()).toBe('America/Caracas');
    learnClinicTimeZone(undefined);
    learnClinicTimeZone('Marte/Olympus');
    expect(getClinicTimeZone()).toBe('America/Caracas');
  });
});

describe('clinicWallTimeToInstant', () => {
  it('convierte la hora de pared de la clínica en un instante con offset explícito', () => {
    expect(clinicWallTimeToInstant('2026-03-15', '09:30', 'America/Caracas')).toBe(
      '2026-03-15T13:30:00.000Z',
    );
    expect(clinicWallTimeToInstant('2026-03-15', '09:30', 'Asia/Tokyo')).toBe(
      '2026-03-15T00:30:00.000Z',
    );
  });

  it('respeta el horario de verano de la fecha (New York)', () => {
    expect(clinicWallTimeToInstant('2026-01-15', '09:00', 'America/New_York')).toBe(
      '2026-01-15T14:00:00.000Z',
    );
    expect(clinicWallTimeToInstant('2026-07-15', '09:00', 'America/New_York')).toBe(
      '2026-07-15T13:00:00.000Z',
    );
  });
});

describe('clinicDayKey', () => {
  it('el día civil de la clínica para un instante', () => {
    // 02:00 UTC del 16 = 22:00 del 15 en Caracas.
    expect(clinicDayKey('2026-03-16T02:00:00.000Z', 'America/Caracas')).toBe(
      '2026-03-15',
    );
    expect(clinicDayKey('2026-03-15T22:00:00-04:00', 'Asia/Tokyo')).toBe('2026-03-16');
  });
});
