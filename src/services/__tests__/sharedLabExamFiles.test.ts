import * as auth from '@/services/auth';
import { File, Paths } from 'expo-file-system';
import { uploadLabExamFile } from '@/services/medical';
import {
  getOwnerLabExam,
  getStaffLabExam,
  uploadStaffLabExamFile,
} from '@/services/labExams';
import {
  createTreatmentConsultation,
  SAMPLE_PNG_BYTES,
  type TreatmentConsultation,
} from '@/testing/medicalData';
import { clearTokens } from '@/utils/secureStore';
import { absoluteServerUrl } from '@/utils/serverUrl';

let fixture: TreatmentConsultation;
afterAll(async () => {
  await fixture?.cleanup();
  await clearTokens();
});

it('conserva las fotos del propietario y veterinario y permite verlas desde ambos perfiles', async () => {
  await auth.login('owner1@example.com', 'password123');
  fixture = await createTreatmentConsultation(1);
  const ownerPhoto = await uploadLabExamFile(fixture.labExamId, {
    blob: new Blob([SAMPLE_PNG_BYTES], { type: 'image/png' }),
    name: 'resultado-owner.png',
  });
  const localPhoto = new File(Paths.cache, 'resultado-galeria.png');
  localPhoto.create({ overwrite: true });
  localPhoto.write(SAMPLE_PNG_BYTES);
  const galleryPhoto = await uploadLabExamFile(fixture.labExamId, {
    uri: localPhoto.uri,
    name: 'resultado-galeria.png',
    type: 'image/png',
  });
  expect(galleryPhoto.content_type).toBe('image/png');
  expect(
    (await getOwnerLabExam(fixture.labExamId)).attachments.map((item) => item.id),
  ).toContain(ownerPhoto.id);
  await auth.login('vet@chepicare.com', 'password123');
  expect(
    (await getStaffLabExam(fixture.consultationId, fixture.labExamId)).attachments.map(
      (item) => item.id,
    ),
  ).toContain(ownerPhoto.id);
  const vetPhoto = await uploadStaffLabExamFile(
    fixture.consultationId,
    fixture.labExamId,
    {
      blob: new Blob([SAMPLE_PNG_BYTES], { type: 'image/png' }),
      name: 'resultado-vet.png',
    },
  );
  await auth.login('owner1@example.com', 'password123');
  const persisted = await getOwnerLabExam(fixture.labExamId);
  expect(persisted.pet.id).toBe(1);
  expect(persisted.pet.name).toBeTruthy();
  expect(persisted.pet.proprietary?.full_name).toBeTruthy();
  expect(persisted.attachments.map((item) => item.id)).toEqual(
    expect.arrayContaining([ownerPhoto.id, galleryPhoto.id, vetPhoto.id]),
  );
  const downloaded = await fetch(
    absoluteServerUrl(
      persisted.attachments.find((item) => item.id === vetPhoto.id)!.file_url,
    )!,
  );
  expect(downloaded.ok).toBe(true);
  expect(new Uint8Array(await downloaded.arrayBuffer())).toEqual(SAMPLE_PNG_BYTES);
  await auth.login('owner2@example.com', 'password123');
  await expect(getOwnerLabExam(fixture.labExamId)).rejects.toMatchObject({ status: 404 });
}, 30000);
