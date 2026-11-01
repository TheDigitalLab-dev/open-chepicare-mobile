import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useLabExam } from '@/hooks/useLabExam';
import * as auth from '@/services/auth';
import { listPets } from '@/services/pets';
import { uploadLabExamFile } from '@/services/medical';
import {
  createTreatmentConsultation,
  SAMPLE_PNG_BYTES,
  type TreatmentConsultation,
} from '@/testing/medicalData';
import { clearTokens } from '@/utils/secureStore';

let fixture: TreatmentConsultation;
afterAll(async () => {
  await fixture?.cleanup();
  await clearTokens();
});

it('recupera fotos al volver a abrir el examen y permite subir desde el perfil veterinario', async () => {
  await auth.login('owner1@example.com', 'password123');
  const petId = (await listPets())[0]!.id;
  fixture = await createTreatmentConsultation(petId);
  const png = (name: string) => ({
    blob: new Blob([SAMPLE_PNG_BYTES], { type: 'image/png' }),
    name,
  });
  const attachment = await uploadLabExamFile(
    fixture.labExamId,
    png('owner-persistente.png'),
  );
  const owner = renderHook(() =>
    useLabExam(petId, fixture.consultationId, fixture.labExamId),
  );
  await waitFor(
    () =>
      expect(owner.result.current.uploads.map((file) => file.id)).toContain(
        attachment.id,
      ),
    { timeout: 10000 },
  );
  owner.unmount();
  await auth.login('vet@chepicare.com', 'password123');
  const vet = renderHook(() =>
    useLabExam(petId, fixture.consultationId, fixture.labExamId, 'staff'),
  );
  await waitFor(
    () =>
      expect(vet.result.current.uploads.map((file) => file.id)).toContain(attachment.id),
    { timeout: 10000 },
  );
  await act(async () => vet.result.current.uploadFiles([png('vet-persistente.png')]));
  expect(vet.result.current.actionError).toBeNull();
  vet.unmount();
  await auth.login('owner1@example.com', 'password123');
  const reopened = renderHook(() =>
    useLabExam(petId, fixture.consultationId, fixture.labExamId),
  );
  await waitFor(
    () =>
      expect(reopened.result.current.uploads.map((file) => file.filename)).toEqual(
        expect.arrayContaining(['owner-persistente.png', 'vet-persistente.png']),
      ),
    { timeout: 10000 },
  );
}, 30000);
