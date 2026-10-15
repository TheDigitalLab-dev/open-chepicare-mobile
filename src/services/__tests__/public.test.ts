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

  it('productos paginados con búsqueda en el servidor (antes solo los 12 primeros)', async () => {
    const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
    const raw = (await (await fetch(`${BASE}/public/products?per_page=12`)).json()) as {
      pagination: { total_items: number; total_pages: number };
    };
    const first = await publicService.listProductsPage({}, 1);
    expect(first.total).toBe(raw.pagination.total_items);
    expect(first.totalPages).toBe(Math.ceil(raw.pagination.total_items / first.perPage));

    // Se llega a todos recorriendo páginas.
    const all = [...first.items];
    for (let page = 2; page <= first.totalPages; page += 1) {
      all.push(...(await publicService.listProductsPage({}, page)).items);
    }
    expect(new Set(all.map((p) => p.id)).size).toBe(first.total);

    if (all.length > 0) {
      const target = all[all.length - 1]!;
      const found = await publicService.listProductsPage({ search: target.name }, 1);
      expect(found.items.map((p) => p.id)).toContain(target.id);
    }
  });

  it('datos de contacto reales de la clínica (no inventados)', async () => {
    const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
    const landing = (await (await fetch(`${BASE}/landing`)).json()) as {
      config: { contact_info: Record<string, string> };
    };
    const contact = await publicService.getClinicContact();
    expect(contact).toEqual(expect.objectContaining(landing.config.contact_info));
  });
});
