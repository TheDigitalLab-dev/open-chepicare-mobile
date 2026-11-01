/**
 * Integración REAL del servicio de pedidos de tienda contra `../open-chepicare-web`.
 * Los pedidos públicos no requieren autenticación.
 */
import * as ordersService from '@/services/orders';
import * as publicService from '@/services/public';
import { File, Paths } from 'expo-file-system';
import { SAMPLE_PNG_BYTES } from '@/testing/medicalData';

describe('ordersService (pedidos reales de tienda)', () => {
  it('crea un pedido en tienda física con productos reales', async () => {
    const products = await publicService.listProducts();
    if (products.length === 0) return;

    const order = await ordersService.createProductOrder({
      contact_name: 'QA Comprador',
      contact_email: 'qa-buyer@example.com',
      contact_phone: '04140000000',
      payment_method: 'in_store',
      items: [{ product_id: products[0]!.id, quantity: 1 }],
    });

    expect(order.id).toEqual(expect.any(Number));
    expect(order.status).toEqual(expect.any(String));
    expect(order.payment_method).toBe('in_store');
    expect(typeof order.message).toBe('string');
  }, 20000);

  it('marca correctamente qué métodos requieren comprobante', () => {
    expect(ordersService.requiresPaymentProof('transfer')).toBe(true);
    expect(ordersService.requiresPaymentProof('mobile_payment')).toBe(true);
    expect(ordersService.requiresPaymentProof('in_store')).toBe(false);
  });

  it('sube un comprobante desde un archivo local real', async () => {
    const [product] = await publicService.listProducts();
    expect(product).toBeDefined();
    const order = await ordersService.createProductOrder({
      contact_name: 'QA Comprobante nativo',
      contact_email: 'qa-proof@example.com',
      contact_phone: '04140000000',
      payment_method: 'transfer',
      transaction_id: `QA-${Date.now()}`,
      items: [{ product_id: product!.id, quantity: 1 }],
    });
    const file = new File(Paths.cache, 'comprobante-qa.png');
    file.create({ overwrite: true });
    file.write(SAMPLE_PNG_BYTES);
    const response = await ordersService.uploadOrderProof(order.id, {
      uri: file.uri,
      name: 'comprobante-qa.png',
      type: 'image/png',
    });
    expect(response.success).toBe(true);
  }, 20000);
});
