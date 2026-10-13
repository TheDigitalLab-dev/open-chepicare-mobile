/**
 * Integración REAL de la foto de la mascota (propietario): subir, cambiar y
 * quitar, contra `POST/DELETE /pets/:id/photo`. Se usa una mascota creada por
 * el propio test, que se elimina al terminar.
 */
import * as authService from '@/services/auth';
import * as petsService from '@/services/pets';
import type { Pet } from '@/types/models';
import { absoluteServerUrl } from '@/utils/serverUrl';
import * as secureStore from '@/utils/secureStore';
import { SAMPLE_PDF_BYTES, SAMPLE_PNG_BYTES } from '@/testing/medicalData';

let pet: Pet;

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
  pet = await petsService.createPet({
    name: `Foto QA ${Date.now()}`,
    species: 'dog',
    sex: 'male',
  });
});

afterAll(async () => {
  await petsService.deletePet(pet.id).catch(() => undefined);
  await secureStore.clearTokens();
});

const png = (name = 'luna.png') => ({
  blob: new Blob([SAMPLE_PNG_BYTES], { type: 'image/png' }),
  name,
});

describe('foto de la mascota', () => {
  it('sube una foto: la URL (relativa) sirve la imagen del servidor activo', async () => {
    expect(pet.photo_url ?? null).toBeNull();

    const updated = await petsService.uploadPetPhoto(pet.id, png());

    expect(updated.id).toBe(pet.id);
    expect(updated.photo_url).toEqual(expect.any(String));
    const url = absoluteServerUrl(updated.photo_url)!;
    expect(url.startsWith(process.env.EXPO_PUBLIC_API_BASE_URL!)).toBe(true);
    const res = await fetch(url);
    expect(res.ok).toBe(true);
    expect(res.headers.get('content-type')).toContain('image/png');
    expect((await petsService.getPet(pet.id)).photo_url).toBe(updated.photo_url);
  });

  it('cambiarla reemplaza la URL', async () => {
    const before = (await petsService.getPet(pet.id)).photo_url;

    const changed = await petsService.uploadPetPhoto(pet.id, png('otra.png'));

    expect(changed.photo_url).toEqual(expect.any(String));
    expect(changed.photo_url).not.toBe(before);
  });

  it('un archivo que no es imagen se rechaza con 422', async () => {
    await expect(
      petsService.uploadPetPhoto(pet.id, {
        blob: new Blob([SAMPLE_PDF_BYTES], { type: 'application/pdf' }),
        name: 'doc.pdf',
      }),
    ).rejects.toMatchObject({ status: 422, kind: 'validation' });
  });

  it('quitarla deja la mascota sin foto', async () => {
    const cleared = await petsService.deletePetPhoto(pet.id);
    expect(cleared.photo_url ?? null).toBeNull();
  });

  it('la mascota de otra familia no existe para este propietario (404)', async () => {
    await authService.login('owner2@example.com', 'password123');
    try {
      await expect(petsService.uploadPetPhoto(pet.id, png())).rejects.toMatchObject({
        status: 404,
      });
    } finally {
      await authService.login('owner1@example.com', 'password123');
    }
  });
});

describe('absoluteServerUrl', () => {
  it('antepone el servidor a las rutas relativas y respeta las absolutas', () => {
    const base = process.env.EXPO_PUBLIC_API_BASE_URL!;
    expect(absoluteServerUrl('/rails/active_storage/x.png')).toBe(
      `${base}/rails/active_storage/x.png`,
    );
    expect(absoluteServerUrl('https://cdn.example.com/a.png')).toBe(
      'https://cdn.example.com/a.png',
    );
    expect(absoluteServerUrl(null)).toBeNull();
    expect(absoluteServerUrl('')).toBeNull();
  });
});
