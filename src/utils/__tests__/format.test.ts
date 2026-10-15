import { formatMoney } from '@/utils/format';

describe('formatMoney', () => {
  it('formatea los importes numéricos del backend', () => {
    expect(formatMoney(500, 'USD')).toBe('USD 500');
    // Con centavos, siempre dos decimales («30,50», no «30,5»).
    expect(formatMoney(30.5, 'USD')).toBe('USD 30,50');
    expect(formatMoney(12.345, 'USD')).toBe('USD 12,35');
    expect(formatMoney(1500)).toBe('$1.500');
  });

  it('sigue aceptando un texto numérico (datos guardados por versiones anteriores)', () => {
    expect(formatMoney('500.0', 'USD')).toBe('USD 500');
    expect(formatMoney('20.5', 'USD')).toBe('USD 20,50');
  });

  it('un importe ilegible o ausente no se muestra como NaN ni como 0', () => {
    expect(formatMoney('abc', 'USD')).toBe('—');
    expect(formatMoney(Number.NaN, 'USD')).toBe('—');
    expect(formatMoney(null, 'USD')).toBe('—');
    expect(formatMoney(undefined, 'USD')).toBe('—');
    expect(formatMoney('', 'USD')).toBe('—');
  });
});
