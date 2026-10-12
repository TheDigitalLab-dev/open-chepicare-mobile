/**
 * Hora de la clínica (lógica pura). Regla del backend (`ClinicTime`): en la BD
 * todo es UTC; lo que el usuario escribe o ve es hora de pared de la clínica
 * (Configuración General → zona horaria). Un datetime SIN offset se interpreta
 * en la zona de la clínica.
 */
import {
  clinicDayKey,
  clinicMonth,
  clinicToday,
  clinicWallDateTime,
  clinicWallTimeToInstant,
  formatClinicDate,
  formatClinicDateTime,
  formatClinicTime,
  getClinicTimeZone,
  learnClinicTimeZone,
  setClinicConfig,
  setClinicTimeZone,
} from '@/utils/clinicTime';
import { formatDate, formatDateTime } from '@/utils/format';

afterEach(() => setClinicConfig(null));

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

describe('setClinicConfig: zona y formatos de la sesión (`clinic` de /auth/mobile/*)', () => {
  // 15:00 UTC = 11:00 en Caracas = 00:00 del día 16 en Tokio.
  const instant = '2026-03-15T15:00:00.000Z';
  const caracas = {
    time_zone: 'America/Caracas',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
  } as const;

  it('aplica la zona de la clínica', () => {
    setClinicConfig(caracas);
    expect(getClinicTimeZone()).toBe('America/Caracas');
    expect(formatClinicTime(instant)).toBe('11:00');
  });

  it('date_format decide el orden de la fecha (también en días de calendario)', () => {
    setClinicConfig(caracas);
    expect(formatClinicDate(instant)).toBe('15/03/2026');
    expect(formatDate('2026-03-15')).toBe('15/03/2026');

    setClinicConfig({ ...caracas, date_format: 'MM/DD/YYYY' });
    expect(formatClinicDate(instant)).toBe('03/15/2026');

    setClinicConfig({ ...caracas, date_format: 'YYYY-MM-DD' });
    expect(formatClinicDate(instant)).toBe('2026-03-15');
    expect(formatDate('2026-03-15')).toBe('2026-03-15');
  });

  it('time_format 12h muestra la hora con a. m. / p. m.', () => {
    setClinicConfig({ ...caracas, time_format: '12h' });
    expect(formatClinicTime(instant)).toMatch(/^11:00\s?a\.?\s?m\.?$/i);
    expect(formatClinicDateTime(instant)).toMatch(/11:00\s?a\.?\s?m\.?$/i);
    expect(formatClinicTime('2026-03-15T19:30:00Z')).toMatch(/^3:30\s?p\.?\s?m\.?$/i);

    setClinicConfig({ ...caracas, time_zone: 'Asia/Tokyo', time_format: '12h' });
    expect(formatClinicTime(instant)).toMatch(/^12:00\s?a\.?\s?m\.?$/i);
  });

  it('sin configuración: zona del dispositivo, DD/MM/YYYY y 24 h (defaults del backend)', () => {
    setClinicConfig({
      ...caracas,
      time_zone: 'Asia/Tokyo',
      time_format: '12h',
      date_format: 'YYYY-MM-DD',
    });

    setClinicConfig(null);

    expect(getClinicTimeZone()).toBeUndefined();
    expect(formatDate('2026-03-15')).toBe('15/03/2026');
    expect(formatClinicTime(instant, 'America/Caracas')).toBe('11:00');
  });

  it('valores desconocidos caen en los defaults', () => {
    setClinicConfig({
      time_zone: 'Marte/Olympus',
      date_format: 'DD-MM',
      time_format: '36h',
    });

    expect(getClinicTimeZone()).toBeUndefined();
    expect(formatDate('2026-03-15')).toBe('15/03/2026');
    expect(formatClinicTime(instant, 'America/Caracas')).toBe('11:00');
  });
});

describe('clinicToday', () => {
  // 1 de abril 02:00 UTC = 31 de marzo 22:00 en Caracas = 1 de abril 11:00 en Tokio.
  const boundary = new Date('2026-04-01T02:00:00Z');

  it('"hoy" de la clínica, no el del teléfono', () => {
    setClinicConfig({ time_zone: 'America/Caracas' });
    expect(clinicToday(boundary)).toBe('2026-03-31');

    setClinicConfig({ time_zone: 'Asia/Tokyo' });
    expect(clinicToday(boundary)).toBe('2026-04-01');
  });
});
