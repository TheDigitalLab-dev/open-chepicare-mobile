/**
 * Integración REAL de la búsqueda en el servidor para los selectores del staff.
 * Las listas del backend son paginadas (25 por defecto): un selector que solo
 * carga la primera página no ofrece al resto de dueños, mascotas o servicios.
 * `services-list` acepta `search` desde la rama `fix/functional-review-2026-10`.
 */
import * as authService from '@/services/auth';
import * as adminService from '@/services/admin';
import * as secureStore from '@/utils/secureStore';

let owner1Id: number;

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
  owner1Id = (await authService.fetchCurrentUser()).id;
  await authService.login('admin@pawcare.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

describe('búsqueda de dueños', () => {
  it('encuentra a un dueño por correo aunque no esté en la primera página', async () => {
    const owners = await adminService.listAdminOwners({ search: 'owner1@example.com' });
    expect(owners.map((o) => o.email)).toContain('owner1@example.com');
    expect(owners.every((o) => /owner1@example\.com/i.test(o.email))).toBe(true);
  });
});

describe('búsqueda de servicios', () => {
  it('filtra por nombre en el servidor', async () => {
    const all = await adminService.listAdminServices();
    const target = all[all.length - 1]!;
    const found = await adminService.listAdminServices({ search: target.name });
    expect(found.map((s) => s.id)).toContain(target.id);
    expect(found.length).toBeLessThanOrEqual(all.length);
  });

  it('un término sin coincidencias devuelve vacío', async () => {
    await expect(
      adminService.listAdminServices({ search: 'zzz-no-existe-qa' }),
    ).resolves.toEqual([]);
  });
});

describe('mascotas de un dueño', () => {
  it('trae TODAS las mascotas del dueño (no filtra en la primera página)', async () => {
    const pets = await adminService.listAdminPetsByOwner(owner1Id);
    expect(pets.length).toBeGreaterThan(0);
    expect(pets.every((p) => p.proprietary_id === owner1Id)).toBe(true);
  });
});

describe('búsqueda de mascotas', () => {
  it('encuentra por nombre', async () => {
    const [first] = await adminService.listAdminPetsByOwner(owner1Id);
    const found = await adminService.listAdminPets({ search: first!.name });
    expect(found.map((p) => p.id)).toContain(first!.id);
  });
});
