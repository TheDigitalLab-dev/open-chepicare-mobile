/**
 * Push del asistente: interpretación del `data` que envía el backend
 * (categoría `asistente`) y destino al tocar la notificación.
 */
import {
  assistantPushTarget,
  parseAssistantPush,
  registerThisDevice,
  unregisterThisDevice,
} from '@/services/pushNotifications';
import * as secureStore from '@/utils/secureStore';

const dictationReady = {
  category: 'asistente',
  entity: 'voice_dictation',
  entity_id: 42,
  event_key: 'voice_dictation-42-ready',
  consultation_id: 7,
  pet_id: 3,
};

const chatReply = {
  category: 'asistente',
  entity: 'ai_message',
  entity_id: 99,
  event_key: 'ai_message-99-completed',
  conversation_id: 5,
};

describe('parseAssistantPush', () => {
  it('acepta los payloads del asistente', () => {
    expect(parseAssistantPush(dictationReady)).toEqual(dictationReady);
    expect(parseAssistantPush(chatReply)).toEqual(chatReply);
  });

  it('ignora otras categorías o payloads incompletos', () => {
    expect(parseAssistantPush({ ...dictationReady, category: 'citas' })).toBeNull();
    expect(parseAssistantPush({ ...chatReply, conversation_id: undefined })).toBeNull();
    expect(parseAssistantPush({ category: 'asistente', entity: 'otro' })).toBeNull();
    expect(parseAssistantPush(null)).toBeNull();
    expect(parseAssistantPush('texto')).toBeNull();
  });

  it('tolera ids serializados como texto (FCM convierte data a strings)', () => {
    expect(
      parseAssistantPush({
        ...dictationReady,
        entity_id: '42',
        consultation_id: '7',
        pet_id: '3',
      }),
    ).toEqual(dictationReady);
  });
});

describe('assistantPushTarget', () => {
  it('un dictado con consulta abre la consulta', () => {
    expect(assistantPushTarget(parseAssistantPush(dictationReady)!)).toEqual({
      screen: 'consultation',
      consultationId: 7,
    });
  });

  it('un dictado fallido sin consulta abre la ficha de la mascota', () => {
    const failed = parseAssistantPush({
      ...dictationReady,
      event_key: 'voice_dictation-42-failed',
      consultation_id: null,
    })!;
    expect(assistantPushTarget(failed)).toEqual({ screen: 'pet', petId: 3 });
  });

  it('una respuesta del chat abre la conversación', () => {
    expect(assistantPushTarget(parseAssistantPush(chatReply)!)).toEqual({
      screen: 'chat',
      conversationId: 5,
    });
  });
});

describe('registerThisDevice', () => {
  it('sin token Expo disponible (sin projectId de EAS) no registra ni guarda nada', async () => {
    await expect(registerThisDevice()).resolves.toBeNull();
    expect(await secureStore.getPushToken()).toBeNull();
    // Dar de baja sin token registrado es inocuo.
    await expect(unregisterThisDevice()).resolves.toBeUndefined();
  });
});
