/**
 * E2E (app completa + backend real): lo que el propietario hace con la historia
 * clínica de su mascota —
 *  1. subir archivos y cargar resultados de un examen de laboratorio;
 *  2. completar medicamentos y el tratamiento en el servidor;
 *  3. descargar y compartir la receta en PDF (también con el access vencido);
 *  4. subir, cambiar y quitar la foto de la mascota.
 * Los selectores del sistema, el menú de compartir y el sistema de archivos
 * son shims de plataforma (jest.setup.ts): los archivos y el PDF son reales.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

import {
  E2E_WAIT,
  answerAlert,
  findText,
  loginThroughUi,
  pressButton,
  renderApp,
} from '@/testing/renderApp';
import {
  createTreatmentConsultation,
  SAMPLE_PDF_BYTES,
  SAMPLE_PNG_BYTES,
  type TreatmentConsultation,
} from '@/testing/medicalData';
import * as authService from '@/services/auth';
import * as medicalService from '@/services/medical';
import * as petsService from '@/services/pets';
import type { Pet } from '@/types/models';
import { formatDate } from '@/utils/format';
import * as secureStore from '@/utils/secureStore';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('node:fs') as { readFileSync(p: string): Uint8Array };

let pet: Pet;
let fixture: TreatmentConsultation;

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
  pet = (await petsService.listPets())[0]!;
  fixture = await createTreatmentConsultation(pet.id);
  await secureStore.clearTokens();
}, 30000);

afterAll(async () => {
  await fixture?.cleanup();
});

afterEach(async () => {
  await secureStore.clearTokens();
});

/** Login → Mascotas → ficha → Consultas → la consulta del fixture. */
async function openFixtureConsultation() {
  renderApp();
  await loginThroughUi('owner1@example.com');
  fireEvent.press(screen.getAllByText('Mascotas').at(-1)!);
  fireEvent.press(await findText(pet.name));
  await pressButton('Consultas');
  fireEvent.press(await findText(`Otitis ${fixture.label}`));
  await findText('Diagnóstico');
}

it('sube archivos y carga los resultados de un examen de laboratorio', async () => {
  await openFixtureConsultation();
  await pressButton('Ver exámenes de laboratorio (1)');
  fireEvent.press(await findText(`Hemograma ${fixture.label}`));
  await findText(/^archivos$/i);
  expect(screen.getAllByText('Pendiente').length).toBeGreaterThan(0);

  // 1. Un PDF desde el selector de documentos del sistema.
  jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValueOnce({
    canceled: false,
    assets: [
      {
        uri: 'blob:informe',
        name: 'informe-lab.pdf',
        mimeType: 'application/pdf',
        file: new Blob([SAMPLE_PDF_BYTES], { type: 'application/pdf' }),
      } as never,
    ],
  });
  await pressButton('Subir PDF o documento');
  await findText('Archivo enviado a la clínica.');
  expect(screen.getByText('informe-lab.pdf')).toBeTruthy();

  // 2. Una foto de la galería.
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
    canceled: false,
    assets: [
      {
        uri: 'blob:foto',
        fileName: 'frotis.png',
        mimeType: 'image/png',
        width: 1,
        height: 1,
        file: new Blob([SAMPLE_PNG_BYTES], { type: 'image/png' }),
      } as never,
    ],
  });
  await pressButton('Elegir fotos de la galería');
  await findText('frotis.png');

  // 3. Resultados: una fila a medias no se envía.
  const parameter = screen.getByLabelText('Parámetro 1');
  expect(parameter.props.keyboardType).toBe('default');
  fireEvent.changeText(parameter, 'Hemoglobina');
  await pressButton('Guardar resultados');
  await findText('Falta el valor de «Hemoglobina».');

  fireEvent.changeText(screen.getByLabelText('Valor 1'), '13 g/dL');
  expect(screen.getByLabelText('Valor 1').props.keyboardType).toBe('default');
  await pressButton('Agregar parámetro');
  fireEvent.changeText(
    await waitFor(() => screen.getByLabelText('Parámetro 2'), E2E_WAIT),
    'Leucocitos',
  );
  fireEvent.changeText(screen.getByLabelText('Valor 2'), '8000');
  await pressButton('Guardar resultados');
  await findText('Resultados guardados.');
  await findText('En proceso');

  // En el servidor: en proceso y con los valores cargados.
  const exam = (await medicalService.listConsultations(pet.id))
    .find((c) => c.id === fixture.consultationId)!
    .lab_exams.find((e) => e.id === fixture.labExamId)!;
  expect(exam.status).toBe('in_progress');
  expect(exam.results).toEqual({ Hemoglobina: '13 g/dL', Leucocitos: '8000' });

  // De vuelta en la lista, el examen muestra sus resultados.
  fireEvent.press(screen.getByRole('button', { name: 'Volver' }));
  await findText('Hemoglobina: 13 g/dL · Leucocitos: 8000');
}, 120000);

it('completa medicamentos y el tratamiento en el servidor y comparte la receta en PDF', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const share = jest.mocked(Sharing.shareAsync);
  share.mockClear();
  await openFixtureConsultation();

  // 2a. Un medicamento: queda completado en el servidor y en la pantalla.
  await pressButton(`Marcar completado: Amoxicilina ${fixture.label}`);
  await findText('Medicamento marcado como completado.');
  expect(screen.getAllByText('Completado')).toHaveLength(1);
  await expect(
    medicalService.completePrescriptionItem(fixture.itemIds[0]!),
  ).rejects.toMatchObject({ status: 422, message: 'El medicamento ya fue completado' });

  // 2b. El tratamiento completo (con confirmación).
  await pressButton('Completar tratamiento');
  await act(async () => answerAlert(alert, 'Sí, completar'));
  await findText('¡Tratamiento completado!');
  const listed = (await medicalService.listConsultations(pet.id)).find(
    (c) => c.id === fixture.consultationId,
  )!;
  expect(listed.treatment_completed_at).toEqual(expect.any(String));
  await findText(`Completado el ${formatDate(listed.treatment_completed_at)}`);
  // Con el tratamiento completo, ningún medicamento ofrece acciones.
  expect(screen.queryByRole('button', { name: /^Marcar completado/ })).toBeNull();

  // 3. Receta en PDF con el access token vencido: se renueva y se comparte.
  const refresh = (await secureStore.getRefreshToken())!;
  await secureStore.setTokens({ access: 'vencido', refresh });
  await pressButton('Descargar receta (PDF)');
  await findText('Receta lista para compartir.');
  expect(share).toHaveBeenCalledTimes(1);
  const [uri, options] = share.mock.calls[0]!;
  expect(options).toEqual(expect.objectContaining({ mimeType: 'application/pdf' }));
  const pdf = fs.readFileSync(uri.replace('file://', ''));
  expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe('%PDF-');
  expect(await secureStore.getAccessToken()).not.toBe('vencido');
  alert.mockRestore();
}, 120000);

it('sube, cambia y quita la foto de la mascota', async () => {
  await authService.login('owner1@example.com', 'password123');
  const photoPet = await petsService.createPet({
    name: `Pelusa ${Date.now().toString(36)}`,
    species: 'cat',
    sex: 'female',
  });
  await secureStore.clearTokens();
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const pick = (name: string) =>
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: `blob:${name}`,
          fileName: name,
          mimeType: 'image/png',
          width: 1,
          height: 1,
          file: new Blob([SAMPLE_PNG_BYTES], { type: 'image/png' }),
        } as never,
      ],
    });
  try {
    renderApp();
    await loginThroughUi('owner1@example.com');
    fireEvent.press(screen.getAllByText('Mascotas').at(-1)!);
    fireEvent.press(await findText(photoPet.name));
    await waitFor(() => screen.getByLabelText(`${photoPet.name} sin foto`), E2E_WAIT);

    // Subir
    pick('pelusa.png');
    await pressButton('Subir foto');
    const avatar = await waitFor(
      () => screen.getByLabelText(`Foto de ${photoPet.name}`),
      E2E_WAIT,
    );
    const first = (await petsService.getPet(photoPet.id)).photo_url!;
    expect(first).toEqual(expect.any(String));
    // La imagen se pide al servidor activo (la URL del backend es relativa).
    expect(avatar.props.source).toEqual([
      expect.objectContaining({ uri: `${process.env.EXPO_PUBLIC_API_BASE_URL}${first}` }),
    ]);

    // Cambiar
    pick('pelusa-2.png');
    await pressButton('Cambiar foto');
    await waitFor(async () => {
      const now = (await petsService.getPet(photoPet.id)).photo_url;
      expect(now).toEqual(expect.any(String));
      expect(now).not.toBe(first);
    }, E2E_WAIT);

    // Quitar (con confirmación)
    await pressButton('Quitar foto');
    await act(async () => answerAlert(alert, 'Sí, quitar'));
    await waitFor(() => screen.getByLabelText(`${photoPet.name} sin foto`), E2E_WAIT);
    expect((await petsService.getPet(photoPet.id)).photo_url ?? null).toBeNull();
    expect(screen.getByRole('button', { name: 'Subir foto' })).toBeTruthy();
  } finally {
    alert.mockRestore();
    await authService.login('owner1@example.com', 'password123');
    await petsService.deletePet(photoPet.id).catch(() => undefined);
  }
}, 120000);
