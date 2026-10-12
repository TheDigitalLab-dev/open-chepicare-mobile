/**
 * Permisos de staff que la UI aplica antes de enviar (el backend los vuelve a
 * exigir). Usuarios REALES del backend sembrado + casos puros de la regla.
 */
import * as authService from '@/services/auth';
import type { StaffUser } from '@/types/models';
import { canRegisterVaccinations } from '@/utils/permissions';
import * as secureStore from '@/utils/secureStore';

afterAll(async () => {
  await secureStore.clearTokens();
});

describe('canRegisterVaccinations', () => {
  it('el admin sembrado (can_vaccinate: true) puede registrar vacunas', async () => {
    const admin = await authService.login('admin@pawcare.com', 'password123');
    expect(admin.type).toBe('User');
    expect(canRegisterVaccinations(admin)).toBe(true);
  });

  it('un dueño nunca puede', async () => {
    const owner = await authService.login('owner1@example.com', 'password123');
    expect(canRegisterVaccinations(owner)).toBe(false);
  });

  it('sin sesión no puede', () => {
    expect(canRegisterVaccinations(null)).toBe(false);
    expect(canRegisterVaccinations(undefined)).toBe(false);
  });

  const staff = (can_vaccinate?: boolean): StaffUser => ({
    type: 'User',
    id: 1,
    first_name: 'Ana',
    last_name: 'Pérez',
    email: 'ana@example.com',
    username: 'ana',
    role: 'vet',
    can_vaccinate,
  });

  it('staff con can_vaccinate: false no puede', () => {
    expect(canRegisterVaccinations(staff(false))).toBe(false);
  });

  it('staff sin el dato decide el backend (no se bloquea en la app)', () => {
    expect(canRegisterVaccinations(staff(undefined))).toBe(true);
  });
});
