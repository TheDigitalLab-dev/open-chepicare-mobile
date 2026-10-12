/**
 * `useVoiceDictation` contra el backend REAL: crea la sesión, sube la nota de
 * voz y sigue el progreso por ActionCable (con polling de respaldo) hasta el
 * estado final que el servidor determine. Sin claves de STT el servidor
 * termina en `failed` con el motivo real (degradación controlada).
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useVoiceDictation } from '@/hooks/useVoiceDictation';
import * as adminService from '@/services/admin';
import * as authService from '@/services/auth';
import * as secureStore from '@/utils/secureStore';
import type { AudioSource } from '@/types/assistant';
import {
  AI_SETUP_TIMEOUT,
  applyAiSettings,
  DEGRADED_AI,
  patchAiSettings,
  SAMPLE_M4A_BYTES,
} from '@/testing/aiServer';

let restoreAi: () => Promise<void>;
let petId: number;

beforeAll(async () => {
  restoreAi = await applyAiSettings(DEGRADED_AI);
  await authService.login('vet@pawcare.com', 'password123');
  petId = (await adminService.listAdminPets())[0]!.id;
}, AI_SETUP_TIMEOUT);

afterAll(async () => {
  await secureStore.clearTokens();
  await restoreAi();
});

const audio = (): AudioSource => ({
  blob: new Blob([SAMPLE_M4A_BYTES], { type: 'audio/mp4' }),
  name: 'dictado.m4a',
});

describe('useVoiceDictation', () => {
  it('envía la nota, sigue el progreso en vivo y termina con el resultado del servidor', async () => {
    const onApplied = jest.fn();
    const { result, unmount } = renderHook(() => useVoiceDictation({ petId, onApplied }));
    expect(result.current.phase).toBe('idle');
    await waitFor(() => expect(result.current.liveStatus).toBe('connected'), {
      timeout: 10000,
    });

    await act(() => result.current.submit(audio()));
    expect(['processing', 'done']).toContain(result.current.phase);
    expect(result.current.dictation?.pet_id).toBe(petId);
    expect(result.current.dictation?.source).toBe('mobile');

    await waitFor(() => expect(result.current.phase).toBe('done'), { timeout: 15000 });
    expect(result.current.dictation?.status).toBe('failed');
    expect(result.current.dictation?.error_message).toMatch(/transcripci/i);
    expect(result.current.error).toBeNull();
    // Nada se aplicó: no hay que refrescar la consulta.
    expect(onApplied).not.toHaveBeenCalled();

    // Revisar un dictado que no quedó listo devuelve el error real del servidor.
    await act(() => result.current.review([]));
    expect(result.current.error?.message).toMatch(/no está listo/i);

    act(() => result.current.reset());
    expect(result.current.phase).toBe('idle');
    expect(result.current.dictation).toBeNull();
    unmount();
  }, 30000);

  it('con la IA apagada informa "deshabilitada" sin romper la pantalla', async () => {
    await patchAiSettings({ agent_engine: 'none' });
    try {
      const { result } = renderHook(() => useVoiceDictation({ petId }));
      await act(() => result.current.submit(audio()));
      expect(result.current.phase).toBe('error');
      expect(result.current.aiDisabled).toBe(true);
      expect(result.current.error?.message).toMatch(/deshabilitad/i);
    } finally {
      await patchAiSettings(DEGRADED_AI);
    }
  });
});
