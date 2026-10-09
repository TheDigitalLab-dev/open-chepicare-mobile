/**
 * Hora de la clínica (lógica pura). Regla del backend (`ClinicTime`): en la BD
 * todo es UTC; lo que el usuario escribe o ve es hora de pared de la clínica
 * (Configuración General → zona horaria). Un datetime SIN offset se interpreta
 * en la zona de la clínica.
 */
import {
  clinicMonth,
  clinicWallDateTime,
  formatClinicDate,
  formatClinicDateTime,
  formatClinicTime,
  getClinicTimeZone,
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
