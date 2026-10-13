/**
 * Integración REAL del servicio del asistente IA contra el backend
 * (open-chepicare-web, rama feat/voice-dictation-mcp). Sin respuestas mockeadas: el
 * servidor procesa el dictado y el chat de verdad y termina en sus estados de
 * degradación reales (sin claves de STT/IA en el entorno de pruebas).
 */
import { randomUUID } from 'node:crypto';

import * as adminService from '@/services/admin';
import * as authService from '@/services/auth';
import * as assistant from '@/services/assistant';
import * as secureStore from '@/utils/secureStore';
import { ApiError } from '@/types/api';
import {
  AI_SETUP_TIMEOUT,
  applyAiSettings,
  DEGRADED_AI,
  patchAiSettings,
  SAMPLE_M4A_BYTES,
  waitFor,
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

const audio = () => ({
  blob: new Blob([SAMPLE_M4A_BYTES], { type: 'audio/mp4' }),
  name: 'dictado.m4a',
});

describe('assistant: dictado de consulta (real)', () => {
  it('crea la sesión, sube el audio y el servidor la procesa hasta un estado final', async () => {
    const clientRequestId = randomUUID();
    const created = await assistant.createVoiceDictation({
      pet_id: petId,
      client_request_id: clientRequestId,
    });
    expect(created.status).toBe('awaiting_audio');
    expect(created.source).toBe('mobile');
    expect(created.pet_id).toBe(petId);

    // Reintento idempotente: mismo client_request_id → mismo dictado.
    const again = await assistant.createVoiceDictation({
      pet_id: petId,
      client_request_id: clientRequestId,
    });
    expect(again.id).toBe(created.id);

    const received = await assistant.uploadVoiceDictationAudio(created.id, audio());
    expect(received.status).toBe('received');

    const final = await waitFor(async () => {
      const d = await assistant.getVoiceDictation(created.id);
      return assistant.isFinalDictationStatus(d.status) ? d : null;
    });
    // Sin servidor de transcripción alcanzable el servidor marca `failed` con
    // el motivo real (degradación controlada, no una excepción).
    expect(final.status).toBe('failed');
    expect(final.error_message).toMatch(/transcripci/i);
    expect(final.transcribing_at).not.toBeNull();

    const { voice_dictations } = await assistant.listVoiceDictations({ pet_id: petId });
    expect(voice_dictations.some((d) => d.id === created.id)).toBe(true);
  }, 30000);

  it('no admite subir dos veces el audio del mismo dictado (422 legible)', async () => {
    const created = await assistant.createVoiceDictation({
      pet_id: petId,
      client_request_id: randomUUID(),
    });
    await assistant.uploadVoiceDictationAudio(created.id, audio());
    await expect(
      assistant.uploadVoiceDictationAudio(created.id, audio()),
    ).rejects.toMatchObject({
      kind: 'validation',
      message: expect.stringMatching(/ya tiene su audio/),
    });
  });

  it('404 al consultar un dictado ajeno o inexistente', async () => {
    await expect(assistant.getVoiceDictation(99999999)).rejects.toMatchObject({
      kind: 'notFound',
    });
  });

  it('describe el progreso por etapas', () => {
    expect(assistant.dictationStep('received')).toBe(0);
    expect(assistant.dictationStep('transcribing')).toBe(1);
    expect(assistant.dictationStep('interpreting')).toBe(2);
    expect(assistant.dictationStep('ready')).toBe(3);
    expect(assistant.dictationStep('reviewed')).toBe(3);
    expect(assistant.DICTATION_STATUS_LABEL.interpreting).toBe('Interpretando');
    expect(assistant.isFinalDictationStatus('interpreting')).toBe(false);
    expect(assistant.isFinalDictationStatus('ready')).toBe(true);
  });
});

describe('assistant: chat (real)', () => {
  it('crea una conversación, envía un mensaje y recibe la respuesta del servidor', async () => {
    const conversation = await assistant.createConversation({ title: 'QA chat móvil' });
    expect(conversation.title).toBe('QA chat móvil');

    const sent = await assistant.sendMessage(conversation.id, '¿Qué vacunas tiene Max?');
    expect(sent.user_message.role).toBe('user');
    expect(sent.user_message.content).toBe('¿Qué vacunas tiene Max?');
    expect(sent.assistant_message.role).toBe('assistant');

    const answered = await waitFor(async () => {
      const full = await assistant.getConversation(conversation.id);
      const reply = full.messages.find((m) => m.id === sent.assistant_message.id);
      return reply && assistant.isFinalMessageStatus(reply.status) ? reply : null;
    });
    // El binario del agente no existe en este entorno: falla con motivo real.
    expect(answered.status).toBe('failed');
    expect(answered.error_message).toMatch(/agente/i);

    const { conversations } = await assistant.listConversations();
    expect(conversations.some((c) => c.id === conversation.id)).toBe(true);

    await assistant.deleteConversation(conversation.id);
    await expect(assistant.getConversation(conversation.id)).rejects.toMatchObject({
      kind: 'notFound',
    });
  }, 30000);

  it('acepta una nota de voz como mensaje', async () => {
    const conversation = await assistant.createConversation({});
    const sent = await assistant.sendVoiceMessage(conversation.id, audio());
    expect(sent.user_message.input_mode).toBe('voice');
    await assistant.deleteConversation(conversation.id);
  });

  it('confirmar una propuesta inexistente responde 404', async () => {
    await expect(assistant.confirmToolCall(99999999)).rejects.toMatchObject({
      kind: 'notFound',
    });
    await expect(assistant.rejectToolCall(99999999)).rejects.toMatchObject({
      kind: 'notFound',
    });
  });
});

describe('assistant: IA deshabilitada en el servidor (real)', () => {
  it('responde 409 ai_disabled y la app lo distingue', async () => {
    await patchAiSettings({ agent_engine: 'none' });
    try {
      const error = await assistant
        .createVoiceDictation({ pet_id: petId, client_request_id: randomUUID() })
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).kind).toBe('conflict');
      expect(assistant.isAiDisabledError(error)).toBe(true);
      expect((error as ApiError).message).toMatch(/deshabilitada/i);
    } finally {
      await patchAiSettings(DEGRADED_AI);
    }
  });
});

describe('assistant: grabación y presentación', () => {
  it('convierte la URI de expo-audio en el archivo a subir', () => {
    expect(assistant.audioFileFromRecording('file:///cache/Audio/rec-1.m4a')).toEqual({
      uri: 'file:///cache/Audio/rec-1.m4a',
      name: 'rec-1.m4a',
      type: 'audio/mp4',
    });
    expect(assistant.audioFileFromRecording('file:///x/nota.webm').type).toBe(
      'audio/webm',
    );
    expect(assistant.audioFileFromRecording('file:///x/sin-extension')).toMatchObject({
      name: 'nota-de-voz.m4a',
      type: 'audio/mp4',
    });
  });

  it('nombra en español cada acción del agente', () => {
    expect(assistant.toolCallLabel('register_deworming')).toBe(
      'Registrar desparasitación',
    );
    expect(assistant.toolCallLabel('create_consultation')).toBe('Crear la consulta');
    // Una tool nueva del servidor se muestra legible aunque la app no la conozca.
    expect(assistant.toolCallLabel('send_owner_summary')).toBe('send owner summary');
  });

  it('formatea la duración de la grabación', () => {
    expect(assistant.formatRecordingDuration(0)).toBe('0:00');
    expect(assistant.formatRecordingDuration(65_400)).toBe('1:05');
    expect(assistant.MAX_RECORDING_SECONDS).toBe(15 * 60);
  });
});

describe('assistant: resumen de propuestas', () => {
  const call = (tool_name: string, input: Record<string, unknown>) =>
    ({ tool_name, input }) as Parameters<typeof assistant.toolCallSummary>[0];

  it('resume lo clínicamente relevante de cada acción', () => {
    expect(
      assistant.toolCallSummary(
        call('register_deworming', { pet_id: 1, product_name: 'Drontal' }),
      ),
    ).toBe('Drontal');
    expect(
      assistant.toolCallSummary(
        call('add_prescription', {
          consultation_id: 3,
          items: [
            { medication_name: 'Amoxicilina', dose: '250 mg' },
            { medication_name: 'Meloxicam' },
          ],
        }),
      ),
    ).toBe('Amoxicilina 250 mg · Meloxicam');
    expect(
      assistant.toolCallSummary(
        call('update_medical_profile', { pet_id: 1, add_allergies: ['Penicilina'] }),
      ),
    ).toBe('Alergias: Penicilina');
    expect(assistant.toolCallSummary(call('search_pets', { query: 'Max' }))).toBe('Max');
  });

  it('sin datos reconocibles devuelve cadena vacía', () => {
    expect(assistant.toolCallSummary(call('list_services', {}))).toBe('');
  });
});
