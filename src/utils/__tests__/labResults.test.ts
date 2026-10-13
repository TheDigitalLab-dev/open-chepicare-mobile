import { formatLabResults, resultRowsFrom, resultsFromRows } from '@/utils/labResults';

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

describe('resultRowsFrom', () => {
  it('convierte los resultados guardados en filas editables', () => {
    expect(
      resultRowsFrom({ Hemoglobina: '13 g/dL', Positivo: true, Vacío: null }),
    ).toEqual([
      { parameter: 'Hemoglobina', value: '13 g/dL' },
      { parameter: 'Positivo', value: 'Sí' },
      { parameter: 'Vacío', value: '' },
    ]);
  });

  it('sin resultados (o texto libre antiguo) empieza con una fila vacía', () => {
    expect(resultRowsFrom(null)).toEqual([{ parameter: '', value: '' }]);
    expect(resultRowsFrom({})).toEqual([{ parameter: '', value: '' }]);
    expect(resultRowsFrom('Normal')).toEqual([
      { parameter: 'Resultado', value: 'Normal' },
    ]);
  });
});

describe('resultsFromRows', () => {
  it('arma el JSON con las filas completas y recorta espacios', () => {
    expect(
      resultsFromRows([
        { parameter: ' Hemoglobina ', value: ' 13 g/dL ' },
        { parameter: '', value: '' },
        { parameter: 'Leucocitos', value: '8000' },
      ]),
    ).toEqual({ ok: true, results: { Hemoglobina: '13 g/dL', Leucocitos: '8000' } });
  });

  it('exige al menos un parámetro con valor', () => {
    expect(resultsFromRows([{ parameter: '', value: '' }])).toEqual({
      ok: false,
      error: 'Agrega al menos un parámetro con su valor.',
    });
  });

  it('una fila a medias no se descarta en silencio', () => {
    expect(resultsFromRows([{ parameter: 'Glucosa', value: '' }])).toEqual({
      ok: false,
      error: 'Falta el valor de «Glucosa».',
    });
    expect(resultsFromRows([{ parameter: '', value: '90' }])).toEqual({
      ok: false,
      error: 'Falta el nombre del parámetro con valor «90».',
    });
  });

  it('no admite parámetros repetidos', () => {
    expect(
      resultsFromRows([
        { parameter: 'Glucosa', value: '90' },
        { parameter: 'glucosa ', value: '95' },
      ]),
    ).toEqual({ ok: false, error: 'El parámetro «glucosa» está repetido.' });
  });
});
