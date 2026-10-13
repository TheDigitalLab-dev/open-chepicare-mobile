import { formatMoney } from '@/utils/format';

describe('formatMoney', () => {
  it('formatea números y los decimales que el backend serializa como texto', () => {
    expect(formatMoney(500, 'USD')).toBe('USD 500');
    // `payment_summary_json` del detalle de cita envía BigDecimal: "500.0".
    expect(formatMoney('500.0', 'USD')).toBe('USD 500');
    expect(formatMoney('20.5', 'USD')).toBe('USD 20,5');
  });

  it('un importe ilegible no se muestra como NaN', () => {
    expect(formatMoney('abc', 'USD')).toBe('—');
  });
});
