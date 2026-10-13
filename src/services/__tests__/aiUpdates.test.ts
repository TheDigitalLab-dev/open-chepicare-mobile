/**
 * Tiempo real del asistente: cliente ActionCable REAL (`/cable`, canal
 * `AiUpdatesChannel`) autenticado con `Authorization: Bearer`, contra el
 * backend en ejecución. El servidor procesa un dictado de verdad y la app
 * recibe cada cambio de estado por el WebSocket.
 */
import { randomUUID } from 'node:crypto';

import * as authService from '@/services/auth';
import * as assistant from '@/services/assistant';
import * as adminService from '@/services/admin';
import {
  cableUrlFor,
  connectAiUpdates,
  type AiUpdatesStatus,
} from '@/services/aiUpdates';
import * as secureStore from '@/utils/secureStore';
import type { AiUpdate } from '@/types/assistant';
import {
  AI_SETUP_TIMEOUT,
  applyAiSettings,
  DEGRADED_AI,
  SAMPLE_M4A_BYTES,
  waitFor,
} from '@/testing/aiServer';

let restoreAi: () => Promise<void>;

beforeAll(async () => {
  restoreAi = await applyAiSettings(DEGRADED_AI);
}, AI_SETUP_TIMEOUT);

afterAll(async () => {
  await secureStore.clearTokens();
  await restoreAi();
});

describe('cableUrlFor', () => {
  it('deriva ws/wss del servidor configurado', () => {
    expect(cableUrlFor('http://192.168.1.5:3000')).toBe('ws://192.168.1.5:3000/cable');
    expect(cableUrlFor('https://clinica.example.com')).toBe(
      'wss://clinica.example.com/cable',
    );
  });
});

describe('connectAiUpdates (real)', () => {
  it('se suscribe con Bearer y recibe el progreso del dictado', async () => {
    await authService.login('vet@chepicare.com', 'password123');
    const petId = (await adminService.listAdminPets())[0]!.id;

    const statuses: AiUpdatesStatus[] = [];
    const updates: AiUpdate[] = [];
    const connection = connectAiUpdates({
      onStatus: (s) => statuses.push(s),
      onUpdate: (u) => updates.push(u),
    });
    try {
      await waitFor(async () => statuses.includes('connected'));

      const dictation = await assistant.createVoiceDictation({
        pet_id: petId,
        client_request_id: randomUUID(),
      });
      await assistant.uploadVoiceDictationAudio(dictation.id, {
        blob: new Blob([SAMPLE_M4A_BYTES], { type: 'audio/mp4' }),
        name: 'dictado.m4a',
      });

      const final = await waitFor(async () =>
        updates.find(
          (u) =>
            u.type === 'voice_dictation' &&
            u.voice_dictation.id === dictation.id &&
            assistant.isFinalDictationStatus(u.voice_dictation.status),
        ),
      );
      expect(final.type).toBe('voice_dictation');
      // Llegaron también las etapas intermedias (recibido/transcribiendo).
      const seen = updates
        .filter(
          (u) => u.type === 'voice_dictation' && u.voice_dictation.id === dictation.id,
        )
        .map((u) => (u.type === 'voice_dictation' ? u.voice_dictation.status : null));
      expect(seen).toContain('transcribing');
    } finally {
      connection.close();
    }
    expect(statuses[statuses.length - 1]).toBe('closed');
  }, 30000);

  it('sin sesión el servidor rechaza la conexión y no reintenta en bucle', async () => {
    await secureStore.clearTokens();
    const statuses: AiUpdatesStatus[] = [];
    const connection = connectAiUpdates({
      onStatus: (s) => statuses.push(s),
      onUpdate: () => {},
    });
    try {
      await waitFor(async () => statuses.includes('unauthorized'));
    } finally {
      connection.close();
    }
    expect(statuses).not.toContain('connected');
  }, 20000);
});
