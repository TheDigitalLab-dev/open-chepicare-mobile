/**
 * Servicio de Patrocinios (owner) contra el backend real `../pawcare-web`.
 * Controller JSON: sponsorships (index/show). Requiere Owner (Bearer).
 */
import type { Sponsorship } from '@/types/models';
import { api } from './api';

export async function listSponsorships(): Promise<Sponsorship[]> {
  const { sponsorships } = await api.get<{ sponsorships: Sponsorship[] }>(
    '/sponsorships',
  );
  return sponsorships;
}

export async function getSponsorship(id: number): Promise<Sponsorship> {
  const { sponsorship } = await api.get<{ sponsorship: Sponsorship }>(
    `/sponsorships/${id}`,
  );
  return sponsorship;
}
