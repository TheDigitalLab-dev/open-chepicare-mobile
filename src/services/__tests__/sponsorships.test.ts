/**
 * Integración REAL de patrocinios del owner contra `../open-chepicare-web`: lista,
 * detalle con gastos, alta y cancelación.
 */
import * as authService from '@/services/auth';
import * as publicService from '@/services/public';
import * as sponsorshipsService from '@/services/sponsorships';
import * as secureStore from '@/utils/secureStore';

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

describe('sponsorshipsService', () => {
  it('lista los patrocinios del owner y abre el detalle con sus gastos', async () => {
    const list = await sponsorshipsService.listSponsorships();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        amount: expect.any(Number),
        status: expect.stringMatching(/^(active|cancelled|completed)$/),
      }),
    );
    const detail = await sponsorshipsService.getSponsorship(list[0]!.id);
    expect(detail.id).toBe(list[0]!.id);
    expect(Array.isArray(detail.expenses)).toBe(true);
  });

  it('apadrina una mascota en adopción y luego cancela el apadrinamiento', async () => {
    const pets = await publicService.listAdoptionPets();
    expect(pets.length).toBeGreaterThan(0);

    const created = await sponsorshipsService.createSponsorship({
      pet_id: pets[0]!.id,
      amount: 5,
      recurrence: 'one_time',
    });
    expect(created.status).toBe('active');

    const cancelled = await sponsorshipsService.cancelSponsorship(created.id);
    expect(cancelled.status).toBe('cancelled');

    // Cancelar dos veces no es válido: el backend lo rechaza con 422.
    await expect(sponsorshipsService.cancelSponsorship(created.id)).rejects.toMatchObject(
      {
        kind: 'validation',
      },
    );
  });

  it('un apadrinamiento inexistente o ajeno responde 404', async () => {
    await expect(sponsorshipsService.getSponsorship(99999999)).rejects.toMatchObject({
      kind: 'notFound',
    });
  });
});
