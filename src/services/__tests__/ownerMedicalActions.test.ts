/**
 * Integración REAL de las acciones médicas del propietario contra el backend:
 * subir archivos y cargar resultados de un examen, completar medicamentos y el
 * tratamiento en el servidor y descargar la receta en PDF (renovando la sesión
 * si el access token venció). Los datos los crea el personal del seed.
 */
import * as authService from '@/services/auth';
import * as medical from '@/services/medical';
import * as petsService from '@/services/pets';
import { absoluteServerUrl } from '@/utils/serverUrl';
import * as secureStore from '@/utils/secureStore';
import {
  completeLabExamAsStaff,
  createTreatmentConsultation,
  SAMPLE_PDF_BYTES,
  SAMPLE_PNG_BYTES,
  type TreatmentConsultation,
} from '@/testing/medicalData';

const OWNER = 'owner1@example.com';
const OTHER_OWNER = 'owner2@example.com';

let fixture: TreatmentConsultation;

beforeAll(async () => {
  await authService.login(OWNER, 'password123');
  const pets = await petsService.listPets();
  fixture = await createTreatmentConsultation(pets[0]!.id);
}, 30000);

afterAll(async () => {
  await fixture?.cleanup();
  await secureStore.clearTokens();
});

beforeEach(async () => {
  if (!(await secureStore.hasSession())) await authService.login(OWNER, 'password123');
});

const pdf = () => ({
  blob: new Blob([SAMPLE_PDF_BYTES], { type: 'application/pdf' }),
  name: 'hemograma.pdf',
});

describe('exámenes de laboratorio', () => {
  it('sube un PDF al examen y el archivo queda accesible en el servidor', async () => {
    const attachment = await medical.uploadLabExamFile(
      fixture.labExamId,
      pdf(),
      'Resultados',
    );

    expect(attachment).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        filename: 'hemograma.pdf',
        content_type: 'application/pdf',
        description: 'Resultados',
      }),
    );
    // `file_url` es relativa: se resuelve contra el servidor activo.
    expect(attachment.file_url.startsWith('/')).toBe(true);
    const res = await fetch(absoluteServerUrl(attachment.file_url)!);
    expect(res.ok).toBe(true);
    expect(new TextDecoder().decode((await res.arrayBuffer()).slice(0, 5))).toBe('%PDF-');
  });

  it('acepta también una imagen y rechaza lo que no es un archivo permitido', async () => {
    const png = await medical.uploadLabExamFile(fixture.labExamId, {
      blob: new Blob([SAMPLE_PNG_BYTES], { type: 'image/png' }),
      name: 'muestra.png',
    });
    expect(png.content_type).toBe('image/png');

    await expect(
      medical.uploadLabExamFile(fixture.labExamId, {
        blob: new Blob(['hola'], { type: 'text/plain' }),
        name: 'nota.txt',
      }),
    ).rejects.toMatchObject({ status: 422, kind: 'validation' });
  });

  it('carga los resultados: el examen pasa a "en proceso" con sus valores', async () => {
    const exam = await medical.updateLabExamResults(fixture.labExamId, {
      Hemoglobina: '13 g/dL',
      Leucocitos: '8000',
    });

    expect(exam.status).toBe('in_progress');
    expect(exam.results).toEqual({ Hemoglobina: '13 g/dL', Leucocitos: '8000' });
    const consultations = await medical.listConsultations(
      (await petsService.listPets())[0]!.id,
    );
    const listed = consultations
      .find((c) => c.id === fixture.consultationId)!
      .lab_exams.find((e) => e.id === fixture.labExamId)!;
    expect(listed.results).toEqual({ Hemoglobina: '13 g/dL', Leucocitos: '8000' });
  });

  it('el examen de otra familia no existe para este propietario (404)', async () => {
    await authService.login(OTHER_OWNER, 'password123');
    try {
      await expect(
        medical.uploadLabExamFile(fixture.labExamId, pdf()),
      ).rejects.toMatchObject({ status: 404, kind: 'notFound' });
      await expect(
        medical.updateLabExamResults(fixture.labExamId, { a: '1' }),
      ).rejects.toMatchObject({ status: 404 });
      await expect(
        medical.completePrescriptionItem(fixture.itemIds[0]!),
      ).rejects.toMatchObject({ status: 404 });
      await expect(
        medical.downloadRecipePdf(fixture.consultationId),
      ).rejects.toMatchObject({
        status: 404,
      });
    } finally {
      await secureStore.clearTokens();
    }
  });

  it('un examen que la clínica ya completó no admite archivos ni resultados (422)', async () => {
    await completeLabExamAsStaff(fixture.consultationId, fixture.labExamId);

    await expect(
      medical.uploadLabExamFile(fixture.labExamId, pdf()),
    ).rejects.toMatchObject({
      status: 422,
      message: 'Solo se pueden cargar archivos a exámenes pendientes o en progreso',
    });
    await expect(
      medical.updateLabExamResults(fixture.labExamId, { Hemoglobina: '12' }),
    ).rejects.toMatchObject({ status: 422 });
  });
});

describe('receta en PDF', () => {
  it('descarga el PDF con su nombre de archivo', async () => {
    const recipe = await medical.downloadRecipePdf(fixture.consultationId);

    expect(recipe.filename).toMatch(/^receta-[\w.-]+\.pdf$/);
    expect(new TextDecoder().decode(recipe.bytes.slice(0, 5))).toBe('%PDF-');
  });

  it('con el access token vencido renueva la sesión y descarga igual', async () => {
    const refresh = (await secureStore.getRefreshToken())!;
    await secureStore.setTokens({ access: 'vencido', refresh });

    const recipe = await medical.downloadRecipePdf(fixture.consultationId);

    expect(new TextDecoder().decode(recipe.bytes.slice(0, 5))).toBe('%PDF-');
    expect(await secureStore.getAccessToken()).not.toBe('vencido');
  });
});

describe('tratamiento en el servidor', () => {
  it('completa los medicamentos uno a uno y el último cierra el tratamiento', async () => {
    const [first, second] = fixture.itemIds;

    const one = await medical.completePrescriptionItem(first!);
    expect(one.item.id).toBe(first);
    expect(one.item.completed_at).toEqual(expect.any(String));
    expect(one.consultationCompleted).toBe(false);

    await expect(medical.completePrescriptionItem(first!)).rejects.toMatchObject({
      status: 422,
      message: 'El medicamento ya fue completado',
    });

    const two = await medical.completePrescriptionItem(second!);
    expect(two.consultationCompleted).toBe(true);

    await expect(medical.completeTreatment(fixture.consultationId)).rejects.toMatchObject(
      {
        status: 422,
        message: 'El tratamiento ya fue completado',
      },
    );
  });

  it('completa el tratamiento de una consulta sin pasar por los medicamentos', async () => {
    const pets = await petsService.listPets();
    const other = await createTreatmentConsultation(pets[0]!.id);
    try {
      const consultation = await medical.completeTreatment(other.consultationId);
      expect(consultation.id).toBe(other.consultationId);
      expect(consultation.treatment_completed_at).toEqual(expect.any(String));

      const listed = (await medical.listConsultations(pets[0]!.id)).find(
        (c) => c.id === other.consultationId,
      );
      expect(listed?.treatment_completed_at).toEqual(expect.any(String));
    } finally {
      await other.cleanup();
    }
  }, 30000);
});

describe('recipeFilename', () => {
  it('usa el nombre de Content-Disposition', () => {
    expect(
      medical.recipeFilename('attachment; filename="receta-max-2026-10-13.pdf"', 7),
    ).toBe('receta-max-2026-10-13.pdf');
  });

  it('nunca deja rutas ni caracteres raros en el nombre del archivo', () => {
    expect(medical.recipeFilename('attachment; filename="../../etc/receta.pdf"', 7)).toBe(
      'receta.pdf',
    );
    expect(medical.recipeFilename('attachment; filename="receta Max ñ.pdf"', 7)).toBe(
      'receta_Max__.pdf',
    );
  });

  it('sin cabecera, o sin un .pdf válido, usa receta-<id>.pdf', () => {
    expect(medical.recipeFilename(null, 7)).toBe('receta-7.pdf');
    expect(medical.recipeFilename('attachment; filename="..pdf"', 7)).toBe(
      'receta-7.pdf',
    );
    expect(medical.recipeFilename('attachment; filename="receta.exe"', 7)).toBe(
      'receta-7.pdf',
    );
  });
});
