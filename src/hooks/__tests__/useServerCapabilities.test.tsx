/**
 * `useServerCapabilities` contra el backend REAL: decide si la app muestra el
 * asistente (chat y dictado) según Configuración > IA del servidor.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useServerCapabilities } from '@/hooks/useServerCapabilities';
import * as authService from '@/services/auth';
import * as secureStore from '@/utils/secureStore';
import {
  AI_SETUP_TIMEOUT,
  applyAiSettings,
  DEGRADED_AI,
  patchAiSettings,
} from '@/testing/aiServer';

let restoreAi: () => Promise<void>;

beforeAll(async () => {
  restoreAi = await applyAiSettings(DEGRADED_AI);
  await authService.login('vet@pawcare.com', 'password123');
}, AI_SETUP_TIMEOUT);

afterAll(async () => {
  await secureStore.clearTokens();
  await restoreAi();
});

describe('useServerCapabilities', () => {
  it('carga las capacidades y la disponibilidad del asistente', async () => {
    const { result } = renderHook(() => useServerCapabilities());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.capabilities?.ai.enabled).toBe(true);
    expect(result.current.availability).toEqual({
      aiEnabled: true,
      canChat: true,
      canVoiceChat: true,
      canDictate: true,
    });
  });

  it('al recargar refleja que el admin apagó la IA', async () => {
    const { result } = renderHook(() => useServerCapabilities());
    await waitFor(() => expect(result.current.availability.canChat).toBe(true));

    await patchAiSettings({ agent_engine: 'none' });
    try {
      await act(() => result.current.reload());
      expect(result.current.availability.aiEnabled).toBe(false);
      expect(result.current.availability.canDictate).toBe(false);
    } finally {
      await patchAiSettings(DEGRADED_AI);
    }
  });
});
