/**
 * Hook del examen de laboratorio del propietario contra el backend REAL: subir
 * archivos (desde el selector del sistema, un shim de plataforma que entrega
 * archivos reales) y cargar resultados.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { useLabExam } from '@/hooks/useLabExam';
import * as authService from '@/services/auth';
import * as petsService from '@/services/pets';
import * as secureStore from '@/utils/secureStore';
import {
  completeLabExamAsStaff,
  createTreatmentConsultation,
  SAMPLE_PDF_BYTES,
  SAMPLE_PNG_BYTES,
  type TreatmentConsultation,
} from '@/testing/medicalData';

const WAIT = { timeout: 10000 };

let petId: number;
let fixture: TreatmentConsultation;

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
  petId = (await petsService.listPets())[0]!.id;
  fixture = await createTreatmentConsultation(petId);
}, 30000);

afterAll(async () => {
  await fixture?.cleanup();
  await secureStore.clearTokens();
});

async function renderExam() {
  const hook = renderHook(() =>
    useLabExam(petId, fixture.consultationId, fixture.labExamId),
  );
  await waitFor(() => expect(hook.result.current.exam).not.toBeNull(), WAIT);
  return hook;
}

const plain = (rows: { parameter: string; value: string }[]) =>
  rows.map(({ parameter, value }) => ({ parameter, value }));

const pdfFile = (name = 'hemograma.pdf') => ({
  blob: new Blob([SAMPLE_PDF_BYTES], { type: 'application/pdf' }),
  name,
});

describe('useLabExam', () => {
  it('carga el examen pendiente, editable y con una fila de resultados vacía', async () => {
    const { result } = await renderExam();

    expect(result.current.exam!.status).toBe('pending');
    expect(result.current.editable).toBe(true);
    expect(plain(result.current.rows)).toEqual([{ parameter: '', value: '' }]);
    expect(result.current.uploads).toEqual([]);
  });

  it('sube varios archivos y los lista', async () => {
    const { result } = await renderExam();

    await act(() =>
      result.current.uploadFiles([
        pdfFile(),
        { blob: new Blob([SAMPLE_PNG_BYTES], { type: 'image/png' }), name: 'frotis.png' },
      ]),
    );

    expect(result.current.actionError).toBeNull();
    expect(result.current.uploading).toBeNull();
    expect(result.current.uploads.map((u) => u.filename)).toEqual([
      'hemograma.pdf',
      'frotis.png',
    ]);
    expect(result.current.notice).toBe('2 archivos enviados a la clínica.');
  });

  it('si un archivo falla, sube los demás y dice cuál falló', async () => {
    const { result } = await renderExam();

    await act(() =>
      result.current.uploadFiles([
        { blob: new Blob(['hola'], { type: 'text/plain' }), name: 'nota.txt' },
        pdfFile('orina.pdf'),
      ]),
    );

    expect(result.current.uploads.map((u) => u.filename)).toEqual(['orina.pdf']);
    expect(result.current.actionError).toMatch(/^No se pudo subir «nota\.txt»: /);
  });

  it('elige documentos con el selector del sistema; cancelar no hace nada', async () => {
    const { result } = await renderExam();

    await act(() => result.current.uploadFromDocuments());
    expect(result.current.uploads).toEqual([]);
    expect(result.current.actionError).toBeNull();

    const file = new Blob([SAMPLE_PDF_BYTES], { type: 'application/pdf' });
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'blob:pdf',
          name: 'quimica.pdf',
          mimeType: 'application/pdf',
          file,
        } as never,
      ],
    });
    await act(() => result.current.uploadFromDocuments());

    expect(result.current.uploads.map((u) => u.filename)).toEqual(['quimica.pdf']);
  });

  it('elige fotos de la galería', async () => {
    const { result } = await renderExam();
    const file = new Blob([SAMPLE_PNG_BYTES], { type: 'image/png' });
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'blob:img',
          fileName: 'muestra.png',
          mimeType: 'image/png',
          width: 1,
          height: 1,
          file,
        } as never,
      ],
    });

    await act(() => result.current.uploadFromGallery());

    expect(result.current.uploads.map((u) => u.filename)).toEqual(['muestra.png']);
  });

  it('valida los resultados en el teléfono antes de enviarlos', async () => {
    const { result } = await renderExam();

    act(() => result.current.setRow(0, { parameter: 'Glucosa' }));
    await act(() => result.current.saveResults());

    expect(result.current.actionError).toBe('Falta el valor de «Glucosa».');
    expect(result.current.exam!.status).toBe('pending');
  });

  it('guarda los resultados: el examen queda en proceso con sus valores', async () => {
    const { result } = await renderExam();

    act(() => {
      result.current.setRow(0, { parameter: 'Hemoglobina', value: '13 g/dL' });
      result.current.addRow();
    });
    act(() => result.current.setRow(1, { parameter: 'Leucocitos', value: '8000' }));
    act(() => {
      result.current.addRow();
      result.current.removeRow(2);
    });
    expect(result.current.rows).toHaveLength(2);
    // Claves estables y distintas para la lista de la pantalla.
    expect(new Set(result.current.rows.map((r) => r.key)).size).toBe(2);
    await act(() => result.current.saveResults());

    expect(result.current.actionError).toBeNull();
    expect(result.current.notice).toBe('Resultados guardados.');
    expect(result.current.exam!.status).toBe('in_progress');
    expect(result.current.exam!.results).toEqual({
      Hemoglobina: '13 g/dL',
      Leucocitos: '8000',
    });

    // Otra pantalla (recarga): las filas parten de lo guardado en el servidor.
    const again = await renderExam();
    expect(plain(again.result.current.rows)).toEqual([
      { parameter: 'Hemoglobina', value: '13 g/dL' },
      { parameter: 'Leucocitos', value: '8000' },
    ]);
  });

  it('un examen que la clínica completó ya no es editable', async () => {
    await completeLabExamAsStaff(fixture.consultationId, fixture.labExamId);
    const { result } = await renderExam();

    expect(result.current.exam!.status).toBe('completed');
    expect(result.current.editable).toBe(false);
  });
});
