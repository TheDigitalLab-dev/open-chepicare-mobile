/**
 * Integración REAL de los endpoints públicos (sin auth) contra `../open-chepicare-web`.
 */
import * as publicService from '@/services/public';

describe('publicService (sin autenticación)', () => {
  it('lista productos públicos', async () => {
    const products = await publicService.listProducts();
    expect(Array.isArray(products)).toBe(true);
    if (products.length > 0) {
      expect(products[0]).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          sale_price: expect.any(String),
        }),
      );
    }
  });

  it('lista mascotas en adopción', async () => {
    const pets = await publicService.listAdoptionPets();
    expect(Array.isArray(pets)).toBe(true);
  });

  it('lista los servicios del landing', async () => {
    const services = await publicService.listPublicServices();
    expect(Array.isArray(services)).toBe(true);
  });
});
