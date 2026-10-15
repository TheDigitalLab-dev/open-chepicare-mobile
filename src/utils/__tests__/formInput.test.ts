/**
 * Entradas numéricas y de fecha de los formularios (lógica pura). En teclados
 * Android en español la tecla decimal escribe una coma: `Number("4,5")` es NaN
 * y JSON lo enviaba como `null` (peso y temperatura se perdían en silencio).
 */
import { isValidDayKey, parseDecimalInput } from '@/utils/formInput';

describe('parseDecimalInput', () => {
  it.each([
    ['4.5', 4.5],
    ['4,5', 4.5],
    [' 38,2 ', 38.2],
    ['12', 12],
    ['0,75', 0.75],
  ])('%s → %s', (text, value) => {
    expect(parseDecimalInput(text)).toEqual({ ok: true, value });
  });

  it('vacío es «sin valor» (campo opcional)', () => {
    expect(parseDecimalInput('  ')).toEqual({ ok: true, value: undefined });
  });

  it.each(['abc', '4,5,1', '4.5.1', '1e3', '-', '4,'])('rechaza %s', (text) => {
    expect(parseDecimalInput(text)).toEqual({ ok: false });
  });
});

describe('isValidDayKey', () => {
  it.each(['2026-07-15', '2024-02-29'])('acepta %s', (day) => {
    expect(isValidDayKey(day)).toBe(true);
  });

  it.each(['2026-7-15', '15/07/2026', '2026-02-30', '2026-13-01', '2025-02-29', ''])(
    'rechaza %s',
    (day) => {
      expect(isValidDayKey(day)).toBe(false);
    },
  );
});
