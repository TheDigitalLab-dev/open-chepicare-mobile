/**
 * Hook de la foto de la mascota contra el backend REAL. La galería del sistema
 * es un shim de plataforma que entrega una imagen real que se sube de verdad.
 */
import { act, renderHook } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import { usePetPhoto } from '@/hooks/usePetPhoto';
import * as authService from '@/services/auth';
import * as petsService from '@/services/pets';
import type { Pet } from '@/types/models';
import * as secureStore from '@/utils/secureStore';
import { SAMPLE_PDF_BYTES, SAMPLE_PNG_BYTES } from '@/testing/medicalData';

let pet: Pet;

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
  pet = await petsService.createPet({
    name: `Foto hook ${Date.now()}`,
    species: 'cat',
    sex: 'female',
  });
});

afterAll(async () => {
  await petsService.deletePet(pet.id).catch(() => undefined);
  await secureStore.clearTokens();
});

function pickOnce(blob: Blob, fileName: string) {
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
    canceled: false,
    assets: [
      {
        uri: 'blob:x',
        fileName,
        mimeType: blob.type,
        width: 1,
        height: 1,
        file: blob,
      } as never,
    ],
  });
}

describe('usePetPhoto', () => {
  it('cancelar la galería no cambia nada', async () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => usePetPhoto(pet.id, onChange));

    await act(() => result.current.pickAndUpload());

    expect(onChange).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.busy).toBe(false);
  });

  it('sube la foto elegida y entrega la mascota actualizada', async () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => usePetPhoto(pet.id, onChange));
    pickOnce(new Blob([SAMPLE_PNG_BYTES], { type: 'image/png' }), 'gato.png');

    await act(() => result.current.pickAndUpload());

    expect(result.current.error).toBeNull();
    const updated = onChange.mock.calls[0]![0] as Pet;
    expect(updated.photo_url).toEqual(expect.any(String));
    expect((await petsService.getPet(pet.id)).photo_url).toBe(updated.photo_url);
  });

  it('un archivo que no es imagen muestra el error del servidor', async () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => usePetPhoto(pet.id, onChange));
    pickOnce(new Blob([SAMPLE_PDF_BYTES], { type: 'application/pdf' }), 'doc.pdf');

    await act(() => result.current.pickAndUpload());

    expect(onChange).not.toHaveBeenCalled();
    expect(result.current.error).toEqual(expect.any(String));
    expect(result.current.busy).toBe(false);
  });

  it('quita la foto', async () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => usePetPhoto(pet.id, onChange));

    await act(() => result.current.remove());

    expect(result.current.error).toBeNull();
    expect((onChange.mock.calls[0]![0] as Pet).photo_url ?? null).toBeNull();
  });
});
