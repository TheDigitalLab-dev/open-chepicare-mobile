/**
 * Integración REAL de patrocinios del owner contra `../pawcare-web`.
 */
import * as authService from '@/services/auth';
import * as sponsorshipsService from '@/services/sponsorships';
import * as secureStore from '@/utils/secureStore';

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

describe('sponsorshipsService', () => {
  it('lista los patrocinios del owner', async () => {
    const list = await sponsorshipsService.listSponsorships();
    expect(Array.isArray(list)).toBe(true);
    if (list.length > 0) {
      expect(list[0]).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          amount: expect.any(Number),
          status: expect.any(String),
        }),
      );
      const detail = await sponsorshipsService.getSponsorship(list[0]!.id);
      expect(detail.id).toBe(list[0]!.id);
    }
  });
});
