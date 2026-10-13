import { formatLabResults } from '@/utils/labResults';

describe('formatLabResults', () => {
  it('muestra los pares parámetro → valor de la columna JSON', () => {
    expect(
      formatLabResults({ globulos_rojos: '6.8 x10^12/L', hematocrito: 45, ayuno: true }),
    ).toBe('Globulos rojos: 6.8 x10^12/L · Hematocrito: 45 · Ayuno: Sí');
  });

  it('acepta el texto libre de registros antiguos', () => {
    expect(formatLabResults('Sin hallazgos')).toBe('Sin hallazgos');
  });

  it('sin resultados devuelve undefined (no hay subtítulo)', () => {
    expect(formatLabResults(null)).toBeUndefined();
    expect(formatLabResults(undefined)).toBeUndefined();
    expect(formatLabResults({})).toBeUndefined();
    expect(formatLabResults('  ')).toBeUndefined();
    expect(formatLabResults({ glucosa: null, urea: '' })).toBeUndefined();
  });
});
