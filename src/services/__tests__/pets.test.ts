/**
 * Integración REAL del servicio de Mascotas contra `../open-chepicare-web`.
 * Inicia sesión con un owner sembrado y opera sobre sus mascotas reales.
 */
import * as authService from '@/services/auth';
import * as petsService from '@/services/pets';
import * as secureStore from '@/utils/secureStore';

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

describe('petsService.listPets', () => {
  it('devuelve las mascotas reales del owner autenticado', async () => {
    const pets = await petsService.listPets();

    expect(pets.length).toBeGreaterThanOrEqual(1);
    expect(pets[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
        species: expect.any(String),
      }),
    );
  });
});

describe('petsService CRUD (crea, lee, actualiza y elimina de verdad)', () => {
  let createdId: number;

  it('crea una mascota', async () => {
    const pet = await petsService.createPet({
      name: 'QA-Mascota',
      species: 'dog',
      sex: 'male',
      breed: 'Mestizo',
    });

    createdId = pet.id;
    expect(pet.id).toEqual(expect.any(Number));
    expect(pet.name).toBe('QA-Mascota');
    expect(pet.species).toBe('dog');
  });

  it('obtiene y actualiza la mascota creada', async () => {
    const updated = await petsService.updatePet(createdId, { name: 'QA-Mascota-2' });
    expect(updated.name).toBe('QA-Mascota-2');

    const fetched = await petsService.getPet(createdId);
    expect(fetched.name).toBe('QA-Mascota-2');
  });

  it('elimina (soft) la mascota; luego responde 404', async () => {
    await petsService.deletePet(createdId);
    await expect(petsService.getPet(createdId)).rejects.toMatchObject({ status: 404 });
  });
});

describe('petsService: vaciar campos opcionales', () => {
  it('raza, nacimiento y señas en null se borran en el servidor', async () => {
    const pet = await petsService.createPet({
      name: 'QA Vaciar',
      species: 'dog',
      sex: 'male',
      breed: 'Mestizo',
      birth_date: '2024-01-15',
      distinctive_features: 'Mancha blanca',
    });
    try {
      const cleared = await petsService.updatePet(pet.id, {
        breed: null,
        birth_date: null,
        distinctive_features: null,
      });
      expect(cleared.breed ?? null).toBeNull();
      expect(cleared.birth_date ?? null).toBeNull();
      expect(cleared.distinctive_features ?? null).toBeNull();
    } finally {
      await petsService.deletePet(pet.id);
    }
  });
});
