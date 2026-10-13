/**
 * Hook de la consulta del propietario contra el backend REAL: completar
 * medicamentos y el tratamiento en el servidor (reflejado en el estado) y
 * guardar/compartir la receta en PDF. Solo el menú de compartir y el sistema de
 * archivos son shims de plataforma (ver jest.setup.ts); el PDF es el real.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Sharing from 'expo-sharing';

import { useConsultationCare } from '@/hooks/useConsultationCare';
import * as authService from '@/services/auth';
import * as petsService from '@/services/pets';
import * as secureStore from '@/utils/secureStore';
import {
  createTreatmentConsultation,
  type TreatmentConsultation,
} from '@/testing/medicalData';

const WAIT = { timeout: 10000 };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('node:fs') as { readFileSync(p: string): Uint8Array };

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

async function renderCare(consultationId = fixture.consultationId) {
  const hook = renderHook(() => useConsultationCare(petId, consultationId));
  await waitFor(() => expect(hook.result.current.consultation).not.toBeNull(), WAIT);
  return hook;
}

describe('useConsultationCare', () => {
  it('carga la consulta con sus medicamentos pendientes', async () => {
    const { result } = await renderCare();
    const items = result.current.consultation!.prescriptions[0]!.items;

    expect(items.map((i) => i.id)).toEqual(fixture.itemIds);
    expect(items.every((i) => !result.current.isItemCompleted(i))).toBe(true);
    expect(result.current.treatmentCompleted).toBe(false);
  });

  it('una consulta ajena o inexistente queda como no encontrada', async () => {
    const { result } = renderHook(() => useConsultationCare(petId, 999999));
    await waitFor(() => expect(result.current.loading).toBe(false), WAIT);
    expect(result.current.consultation).toBeNull();
    expect(result.current.notFound).toBe(true);
  });

  it('completa un medicamento en el servidor y lo refleja', async () => {
    const { result } = await renderCare();
    const first = result.current.consultation!.prescriptions[0]!.items[0]!;

    await act(() => result.current.completeItem(first.id));

    expect(result.current.actionError).toBeNull();
    expect(result.current.isItemCompleted(first)).toBe(true);
    expect(result.current.notice).toBe('Medicamento marcado como completado.');
    expect(result.current.treatmentCompleted).toBe(false);
  });

  it('si ya estaba completado (otro dispositivo) lo muestra completado, sin error', async () => {
    const { result } = await renderCare();
    const first = result.current.consultation!.prescriptions[0]!.items[0]!;
    expect(result.current.isItemCompleted(first)).toBe(false);

    await act(() => result.current.completeItem(first.id));

    expect(result.current.actionError).toBeNull();
    expect(result.current.isItemCompleted(first)).toBe(true);
    expect(result.current.notice).toBe('Este medicamento ya estaba completado.');
  });

  it('el último medicamento cierra el tratamiento en el servidor', async () => {
    const { result } = await renderCare();
    const [first, second] = result.current.consultation!.prescriptions[0]!.items;

    await act(() => result.current.completeItem(second!.id));

    await waitFor(() => expect(result.current.treatmentCompleted).toBe(true), WAIT);
    expect(result.current.consultation!.treatment_completed_at).toEqual(
      expect.any(String),
    );
    expect(result.current.isItemCompleted(first!)).toBe(true);
    expect(result.current.notice).toBe('¡Tratamiento completado!');
  });

  it('completa el tratamiento de una consulta en el servidor', async () => {
    const other = await createTreatmentConsultation(petId);
    try {
      const { result } = await renderCare(other.consultationId);

      await act(() => result.current.completeTreatment());

      expect(result.current.actionError).toBeNull();
      expect(result.current.treatmentCompleted).toBe(true);
      expect(
        result.current.consultation!.prescriptions[0]!.items.every((i) =>
          result.current.isItemCompleted(i),
        ),
      ).toBe(true);
      expect(result.current.notice).toBe('¡Tratamiento completado!');
    } finally {
      await other.cleanup();
    }
  }, 30000);

  it('guarda la receta en PDF y abre el menú de compartir', async () => {
    const share = jest.mocked(Sharing.shareAsync);
    share.mockClear();
    const { result } = await renderCare();

    await act(() => result.current.exportRecipe());

    expect(result.current.actionError).toBeNull();
    expect(share).toHaveBeenCalledTimes(1);
    const [uri, options] = share.mock.calls[0]!;
    expect(uri).toMatch(/^file:\/\/.+\/receta-[\w.-]+\.pdf$/);
    expect(options).toEqual(expect.objectContaining({ mimeType: 'application/pdf' }));
    const saved = fs.readFileSync(uri.replace('file://', ''));
    expect(new TextDecoder().decode(saved.slice(0, 5))).toBe('%PDF-');
  });

  it('sin menú de compartir el PDF queda guardado y se avisa', async () => {
    jest.mocked(Sharing.isAvailableAsync).mockResolvedValueOnce(false);
    const { result } = await renderCare();

    await act(() => result.current.exportRecipe());

    expect(result.current.actionError).toBeNull();
    expect(result.current.notice).toMatch(/^Receta guardada en el teléfono/);
  });

  it('un error del servidor se muestra y no deja la acción colgada', async () => {
    const { result } = await renderCare();
    await secureStore.clearTokens();
    try {
      await act(() => result.current.exportRecipe());
      expect(result.current.actionError).toBe(
        'Tu sesión expiró. Inicia sesión nuevamente.',
      );
      expect(result.current.busy).toBeNull();
    } finally {
      await authService.login('owner1@example.com', 'password123');
    }
  });
});
