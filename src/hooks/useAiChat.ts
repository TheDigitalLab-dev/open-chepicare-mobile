/**
 * Chat con el asistente IA (texto y notas de voz), con las mismas tools,
 * permisos y auditoría que el dictado.
 *
 * - `useAiConversations`: conversaciones persistentes del usuario.
 * - `useAiChat(id)`: mensajes de una conversación; la respuesta del asistente
 *   avanza en vivo (pendiente → transcribiendo → pensando → completado) por
 *   ActionCable, con polling de respaldo. Las propuestas del agente se
 *   confirman o rechazan desde el propio mensaje.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  confirmToolCall,
  createConversation,
  deleteConversation,
  getConversation,
  isAiDisabledError,
  isFinalMessageStatus,
  listConversations,
  rejectToolCall,
  sendMessage,
  sendVoiceMessage,
} from '@/services/assistant';
import type { AiUpdatesStatus } from '@/services/aiUpdates';
import { toApiError, type ApiError } from '@/types/api';
import type {
  AiConversation,
  AiConversationWithMessages,
  AiMessage,
  AiToolCall,
  AudioSource,
  SentMessages,
} from '@/types/assistant';
import { useAiUpdates } from './useAiUpdates';
import { useAsync } from './useAsync';

// --- Conversaciones -----------------------------------------------------------

export interface AiConversationsState {
  conversations: AiConversation[];
  loading: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
  create: (title?: string) => Promise<AiConversation>;
  remove: (id: number) => Promise<void>;
}

export function useAiConversations(): AiConversationsState {
  const { data, loading, error, reload } = useAsync(() => listConversations());
  // Cambios locales (crear/eliminar) sobre la última página cargada.
  const [local, setLocal] = useState<AiConversation[] | null>(null);
  const conversations = local ?? data?.conversations ?? [];
  const latest = useRef(conversations);

  useEffect(() => {
    latest.current = conversations;
  });

  const create = useCallback(async (title?: string) => {
    const created = await createConversation(title ? { title } : {});
    setLocal([created, ...latest.current]);
    return created;
  }, []);

  const remove = useCallback(async (id: number) => {
    await deleteConversation(id);
    setLocal(latest.current.filter((c) => c.id !== id));
  }, []);

  const reloadAll = useCallback(async () => {
    setLocal(null);
    await reload();
  }, [reload]);

  return { conversations, loading, error, reload: reloadAll, create, remove };
}

// --- Mensajes de una conversación -------------------------------------------------

export interface AiChatState {
  conversation: AiConversationWithMessages | null;
  loading: boolean;
  /** Error al cargar la conversación. */
  error: ApiError | null;
  /** Error al enviar o decidir una propuesta. */
  actionError: ApiError | null;
  aiDisabled: boolean;
  sending: boolean;
  busyToolCallId: number | null;
  liveStatus: AiUpdatesStatus;
  reload: () => Promise<void>;
  sendText: (text: string) => Promise<void>;
  sendVoice: (audio: AudioSource) => Promise<void>;
  confirm: (toolCallId: number) => Promise<void>;
  reject: (toolCallId: number) => Promise<void>;
}

const POLL_MS = 3_000;
const SAFETY_POLL_MS = 10_000;

function mergeMessages(current: AiMessage[], incoming: AiMessage[]): AiMessage[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) {
    const prev = byId.get(m.id);
    // Un mensaje terminado no vuelve a un estado intermedio (respuestas cruzadas).
    if (prev && isFinalMessageStatus(prev.status) && !isFinalMessageStatus(m.status))
      continue;
    byId.set(m.id, m);
  }
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

function withToolCall(messages: AiMessage[], call: AiToolCall): AiMessage[] {
  return messages.map((m) =>
    m.tool_calls.some((t) => t.id === call.id)
      ? { ...m, tool_calls: m.tool_calls.map((t) => (t.id === call.id ? call : t)) }
      : m,
  );
}

export function useAiChat(conversationId: number | null): AiChatState {
  const [conversation, setConversation] = useState<AiConversationWithMessages | null>(
    null,
  );
  const [loading, setLoading] = useState(conversationId !== null);
  const [error, setError] = useState<ApiError | null>(null);
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [sending, setSending] = useState(false);
  const [busyToolCallId, setBusyToolCallId] = useState<number | null>(null);
  const idRef = useRef(conversationId);

  useEffect(() => {
    idRef.current = conversationId;
  });

  const upsert = useCallback((incoming: AiMessage[]) => {
    setConversation((c) =>
      c && incoming.some((m) => m.conversation_id === c.id)
        ? {
            ...c,
            messages: mergeMessages(
              c.messages,
              incoming.filter((m) => m.conversation_id === c.id),
            ),
          }
        : c,
    );
  }, []);

  const reload = useCallback(async () => {
    const id = idRef.current;
    if (id === null) return;
    try {
      const fresh = await getConversation(id);
      if (idRef.current !== id) return;
      setConversation((c) =>
        c && c.id === id
          ? { ...fresh, messages: mergeMessages(c.messages, fresh.messages) }
          : fresh,
      );
      setError(null);
    } catch (e) {
      if (idRef.current === id) setError(toApiError(e));
    } finally {
      if (idRef.current === id) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (conversationId === null) return undefined;
    // Diferido para no encadenar renders dentro del efecto (como useAsync).
    const timer = setTimeout(() => void reload(), 0);
    return () => clearTimeout(timer);
  }, [conversationId, reload]);

  const liveStatus = useAiUpdates((update) => {
    if (update.type === 'ai_message') upsert([update.message]);
  }, conversationId !== null);

  const waiting =
    conversation?.messages.some((m) => !isFinalMessageStatus(m.status)) ?? false;
  useEffect(() => {
    if (!waiting) return undefined;
    const every = liveStatus === 'connected' ? SAFETY_POLL_MS : POLL_MS;
    const timer = setInterval(() => void reload(), every);
    return () => clearInterval(timer);
  }, [waiting, liveStatus, reload]);

  const send = useCallback(
    async (request: (id: number) => Promise<SentMessages>) => {
      const id = idRef.current;
      if (id === null) return;
      setSending(true);
      setActionError(null);
      try {
        const sent = await request(id);
        upsert([sent.user_message, sent.assistant_message]);
      } catch (e) {
        setActionError(toApiError(e));
      } finally {
        setSending(false);
      }
    },
    [upsert],
  );

  const sendText = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (content.length === 0) return;
      await send((id) => sendMessage(id, content));
    },
    [send],
  );

  const sendVoice = useCallback(
    (audio: AudioSource) => send((id) => sendVoiceMessage(id, audio)),
    [send],
  );

  const decide = useCallback(
    async (toolCallId: number, action: (id: number) => Promise<AiToolCall>) => {
      setBusyToolCallId(toolCallId);
      setActionError(null);
      try {
        const call = await action(toolCallId);
        setConversation((c) =>
          c ? { ...c, messages: withToolCall(c.messages, call) } : c,
        );
      } catch (e) {
        setActionError(toApiError(e));
      } finally {
        setBusyToolCallId(null);
      }
    },
    [],
  );

  const confirm = useCallback((id: number) => decide(id, confirmToolCall), [decide]);
  const reject = useCallback((id: number) => decide(id, rejectToolCall), [decide]);

  return {
    conversation,
    loading,
    error,
    actionError,
    aiDisabled: isAiDisabledError(actionError) || isAiDisabledError(error),
    sending,
    busyToolCallId,
    liveStatus,
    reload,
    sendText,
    sendVoice,
    confirm,
    reject,
  };
}
