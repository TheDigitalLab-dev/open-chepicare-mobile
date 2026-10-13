/**
 * Servicio de Apadrinamientos (owner) contra el backend real `../pawcare-web`.
 * Controller JSON: sponsorships (index/show/create/update). Requiere Owner (Bearer).
 */
import type { Sponsorship, SponsorshipRecurrence } from '@/types/models';
import { api } from './api';
import { fetchAllPages } from './pagination';

export interface SponsorshipInput {
  pet_id: number;
  amount: number;
  recurrence: SponsorshipRecurrence;
  notes?: string;
}

export async function listSponsorships(): Promise<Sponsorship[]> {
  return fetchAllPages<'sponsorships', Sponsorship>('/sponsorships', 'sponsorships');
}

/** Detalle con la mascota y sus gastos (`expenses`). */
export async function getSponsorship(id: number): Promise<Sponsorship> {
  const { sponsorship } = await api.get<{ sponsorship: Sponsorship }>(
    `/sponsorships/${id}`,
  );
  return sponsorship;
}

/** Apadrina una mascota disponible para adopción. */
export async function createSponsorship(input: SponsorshipInput): Promise<Sponsorship> {
  const { sponsorship } = await api.post<{ sponsorship: Sponsorship }>('/sponsorships', {
    sponsorship: input,
  });
  return sponsorship;
}

/** Cancela un apadrinamiento activo (422 si ya está cancelado o completado). */
export async function cancelSponsorship(id: number): Promise<Sponsorship> {
  const { sponsorship } = await api.patch<{ sponsorship: Sponsorship }>(
    `/sponsorships/${id}`,
    { sponsorship: { cancel: true } },
  );
  return sponsorship;
}
