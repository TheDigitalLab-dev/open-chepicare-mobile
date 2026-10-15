/**
 * Chat con el asistente contra el backend REAL. El "modelo" es el doble del
 * CLI de terceros (`src/testing/agent-bin/claude`), que llama de verdad al MCP
 * del servidor: la búsqueda se ejecuta y la desparasitación queda propuesta.
 * La app confirma/rechaza la propuesta y el servidor la aplica de verdad.
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useAiChat, useAiConversations } from '@/hooks/useAiChat';
import * as assistant from '@/services/assistant';
import * as authService from '@/services/auth';
import * as secureStore from '@/utils/secureStore';
import type { AiMessage } from '@/types/assistant';
import {
  AI_SETUP_TIMEOUT,
  applyAiSettings,
  SAMPLE_M4A_BYTES,
  TEST_AGENT_AI,
} from '@/testing/aiServer';

let restoreAi: () => Promise<void>;

beforeAll(async () => {
  restoreAi = await applyAiSettings(TEST_AGENT_AI);
  await authService.login('vet@chepicare.com', 'password123');
}, AI_SETUP_TIMEOUT);

afterAll(async () => {
  await secureStore.clearTokens();
  await restoreAi();
});

const lastAssistant = (messages: AiMessage[] | undefined) =>
  [...(messages ?? [])].reverse().find((m) => m.role === 'assistant');

describe('useAiConversations', () => {
  it('crea, lista y elimina conversaciones', async () => {
    const { result } = renderHook(() => useAiConversations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();

    let id = 0;
    await act(async () => {
      id = (await result.current.create('QA conversación')).id;
    });
    expect(result.current.conversations.some((c) => c.id === id)).toBe(true);

    await act(() => result.current.remove(id));
    expect(result.current.conversations.some((c) => c.id === id)).toBe(false);
  });
});

describe('useAiChat', () => {
  it('envía texto, recibe la respuesta en vivo y confirma la propuesta', async () => {
    const conversation = await assistant.createConversation({ title: 'QA chat hook' });
    const { result, unmount } = renderHook(() => useAiChat(conversation.id));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.conversation?.messages).toEqual([]);

    await act(() => result.current.sendText('Desparasita a Max'));
    expect(result.current.conversation?.messages[0]?.content).toBe('Desparasita a Max');

    await waitFor(
      () =>
        expect(lastAssistant(result.current.conversation?.messages)?.status).toBe(
          'completed',
        ),
      { timeout: 20000 },
    );
    const reply = lastAssistant(result.current.conversation?.messages)!;
    expect(reply.content).toMatch(/desparasitación/i);
    const proposal = reply.tool_calls.find((t) => t.status === 'proposed');
    expect(proposal?.tool_name).toBe('register_deworming');

    await act(() => result.current.confirm(proposal!.id));
    const decided = lastAssistant(result.current.conversation?.messages)!.tool_calls.find(
      (t) => t.id === proposal!.id,
    );
    expect(decided?.status).toBe('executed');
    expect(decided?.target_type).toBe('Deworming');

    unmount();
    await assistant.deleteConversation(conversation.id);
  }, 40000);

  it('rechaza una propuesta y la deja registrada como rechazada', async () => {
    const conversation = await assistant.createConversation({});
    const { result, unmount } = renderHook(() => useAiChat(conversation.id));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.sendText('Desparasita a Max'));
    await waitFor(
      () =>
        expect(
          lastAssistant(result.current.conversation?.messages)?.tool_calls.some(
            (t) => t.status === 'proposed',
          ),
        ).toBe(true),
      { timeout: 20000 },
    );
    const proposal = lastAssistant(
      result.current.conversation?.messages,
    )!.tool_calls.find((t) => t.status === 'proposed')!;

    await act(() => result.current.reject(proposal.id));
    expect(
      lastAssistant(result.current.conversation?.messages)!.tool_calls.find(
        (t) => t.id === proposal.id,
      )?.status,
    ).toBe('rejected');

    unmount();
    await assistant.deleteConversation(conversation.id);
  }, 40000);

  it('envía una nota de voz y muestra el error real de transcripción', async () => {
    const conversation = await assistant.createConversation({});
    const { result, unmount } = renderHook(() => useAiChat(conversation.id));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() =>
      result.current.sendVoice({
        blob: new Blob([SAMPLE_M4A_BYTES], { type: 'audio/mp4' }),
        name: 'nota.m4a',
      }),
    );
    expect(result.current.conversation?.messages[0]?.input_mode).toBe('voice');
    await waitFor(
      () =>
        expect(lastAssistant(result.current.conversation?.messages)?.status).toBe(
          'failed',
        ),
      { timeout: 20000 },
    );

    unmount();
    await assistant.deleteConversation(conversation.id);
  }, 40000);

  it('no envía mensajes vacíos', async () => {
    const conversation = await assistant.createConversation({});
    const { result, unmount } = renderHook(() => useAiChat(conversation.id));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.sendText('   '));
    expect(result.current.conversation?.messages).toEqual([]);
    unmount();
    await assistant.deleteConversation(conversation.id);
  });

  it('si el envío falla lo informa (la pantalla devuelve el texto al campo)', async () => {
    const conversation = await assistant.createConversation({});
    const { result, unmount } = renderHook(() => useAiChat(conversation.id));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await assistant.deleteConversation(conversation.id); // ya no existe: 404 real
    let sent = true;
    await act(async () => {
      sent = await result.current.sendText('Hola');
    });
    expect(sent).toBe(false);
    expect(result.current.actionError).not.toBeNull();

    let empty = true;
    await act(async () => {
      empty = await result.current.sendText('  ');
    });
    expect(empty).toBe(false);
    unmount();
  });
});
