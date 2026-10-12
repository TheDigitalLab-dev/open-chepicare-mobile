/**
 * Integración REAL de las capacidades del servidor (`GET /auth/mobile/capabilities`):
 * la app decide si muestra chat y dictado según lo que reporta SU servidor.
 */
import * as authService from '@/services/auth';
import * as server from '@/services/server';
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
}, AI_SETUP_TIMEOUT);

afterAll(async () => {
  await secureStore.clearTokens();
  await restoreAi();
});

describe('server: capacidades (real)', () => {
  it('sin sesión es público: informa la IA pero no permisos de usuario', async () => {
    await secureStore.clearTokens();
    const caps = await server.getCapabilities();
    expect(caps.server.name.length).toBeGreaterThan(0);
    expect(caps.pairing).toEqual({ enabled: true, qr_version: 1 });
    expect(caps.ai.enabled).toBe(true);
    expect(caps.user).toBeNull();
    // Sin usuario no se habilita nada en la UI.
    expect(server.assistantAvailability(caps)).toEqual({
      aiEnabled: true,
      canChat: false,
      canVoiceChat: false,
      canDictate: false,
    });
  });

  it('con sesión de veterinario habilita chat, voz y dictado', async () => {
    await authService.login('vet@pawcare.com', 'password123');
    const caps = await server.getCapabilities();
    expect(caps.user).toEqual({ can_chat: true, can_dictate: true });
    expect(server.assistantAvailability(caps)).toEqual({
      aiEnabled: true,
      canChat: true,
      canVoiceChat: true,
      canDictate: true,
    });
  });

  it('con "Sin inteligencia artificial" oculta chat y dictado', async () => {
    await authService.login('vet@pawcare.com', 'password123');
    await patchAiSettings({ agent_engine: 'none' });
    try {
      const caps = await server.getCapabilities();
      expect(caps.ai.enabled).toBe(false);
      expect(caps.ai.engine).toBe('none');
      expect(server.assistantAvailability(caps)).toEqual({
        aiEnabled: false,
        canChat: false,
        canVoiceChat: false,
        canDictate: false,
      });
    } finally {
      await patchAiSettings(DEGRADED_AI);
    }
  });

  it('sin capacidades conocidas (servidor caído) no habilita nada', () => {
    expect(server.assistantAvailability(null)).toEqual({
      aiEnabled: false,
      canChat: false,
      canVoiceChat: false,
      canDictate: false,
    });
  });
});
