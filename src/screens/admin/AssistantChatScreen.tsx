import { useCallback, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  type ListRenderItemInfo,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { AppHeader, MobileShell } from '@/components/layout';
import {
  AsyncBoundary,
  Button,
  EmptyState,
  InfoBanner,
  IconButton,
} from '@/components/ui';
import { ChatComposer, ChatMessageBubble, ListRow } from '@/components/domain';
import type { AdminMoreStackParamList } from '@/navigation/types';
import { useAiChat, useAiConversations } from '@/hooks/useAiChat';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useAssistant } from '@/session/AssistantProvider';
import { formatDateTime } from '@/utils/format';
import type { AiConversation, AiMessage } from '@/types/assistant';

type Rt = RouteProp<AdminMoreStackParamList, 'AssistantChat'>;

// --- Lista de conversaciones ---------------------------------------------------

function ConversationList({
  onOpen,
  onBack,
}: {
  onOpen: (id: number) => void;
  onBack?: () => void;
}) {
  const { conversations, loading, error, reload, create, remove } = useAiConversations();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const onCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      onOpen((await create()).id);
    } catch (e) {
      setCreateError(
        e instanceof Error ? e.message : 'No se pudo crear la conversación.',
      );
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = (conversation: AiConversation) => {
    Alert.alert('Eliminar conversación', '¿Deseas eliminar esta conversación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => void remove(conversation.id).catch(() => undefined),
      },
    ]);
  };

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Asistente IA" onBack={onBack} />}
      contentStyle={styles.listContent}
    >
      <Button
        label="Nueva conversación"
        fullWidth
        loading={creating}
        onPress={onCreate}
      />
      {createError ? <InfoBanner tone="destructive" message={createError} /> : null}
      <AsyncBoundary
        loading={loading && conversations.length === 0}
        error={error}
        onRetry={reload}
        empty={conversations.length === 0}
        emptyIcon="chatbubbles-outline"
        emptyTitle="Sin conversaciones"
        emptyDescription="Pregunta por un paciente o pide registrar algo, por texto o con una nota de voz."
      >
        {conversations.map((conversation) => (
          <ListRow
            key={conversation.id}
            title={conversation.title ?? 'Conversación'}
            subtitle={formatDateTime(
              conversation.last_message_at ?? conversation.created_at,
            )}
            showChevron
            onPress={() => onOpen(conversation.id)}
            trailing={() => (
              <IconButton
                icon="trash-outline"
                accessibilityLabel="Eliminar conversación"
                onPress={() => confirmDelete(conversation)}
              />
            )}
          />
        ))}
      </AsyncBoundary>
    </MobileShell>
  );
}

// --- Conversación -----------------------------------------------------------------

function Conversation({ id, onBack }: { id: number; onBack: () => void }) {
  const { availability } = useAssistant();
  const chat = useAiChat(id);
  const recorder = useVoiceRecorder();
  const [draft, setDraft] = useState('');

  const onSend = useCallback(async () => {
    const text = draft;
    setDraft('');
    await chat.sendText(text);
  }, [draft, chat]);

  const onStopRecording = useCallback(async () => {
    const audio = await recorder.stop();
    if (audio) await chat.sendVoice(audio);
  }, [recorder, chat]);

  const { busyToolCallId, confirm, reject } = chat;
  const renderMessage = useCallback(
    ({ item }: ListRenderItemInfo<AiMessage>) => (
      <ChatMessageBubble
        message={item}
        busyToolCallId={busyToolCallId}
        onConfirm={(toolCallId) => void confirm(toolCallId)}
        onReject={(toolCallId) => void reject(toolCallId)}
      />
    ),
    [busyToolCallId, confirm, reject],
  );

  const messages = chat.conversation?.messages ?? [];
  const notice = recorder.error ?? chat.actionError?.message ?? null;

  return (
    <MobileShell
      header={
        <AppHeader title={chat.conversation?.title ?? 'Asistente IA'} onBack={onBack} />
      }
      contentPadding={0}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AsyncBoundary
          loading={chat.loading}
          error={chat.error}
          onRetry={chat.reload}
          empty={false}
        >
          <FlatList
            style={styles.flex}
            contentContainerStyle={styles.messages}
            data={messages}
            keyExtractor={(message) => String(message.id)}
            renderItem={renderMessage}
            ListEmptyComponent={
              <EmptyState
                icon="sparkles-outline"
                title="¿En qué te ayudo?"
                description="Ej.: «¿Qué vacunas le faltan a Max?» o «Registra desparasitación con Drontal para Luna». Lo sensible queda como propuesta para que lo confirmes."
              />
            }
          />
        </AsyncBoundary>
        {notice ? (
          <View style={styles.notice}>
            <InfoBanner tone="destructive" message={notice} />
          </View>
        ) : null}
        <ChatComposer
          value={draft}
          onChangeText={setDraft}
          onSend={() => void onSend()}
          sending={chat.sending}
          voiceEnabled={availability.canVoiceChat}
          isRecording={recorder.isRecording}
          durationMillis={recorder.durationMillis}
          onStartRecording={() => void recorder.start()}
          onStopRecording={() => void onStopRecording()}
          onCancelRecording={() => void recorder.cancel()}
        />
      </KeyboardAvoidingView>
    </MobileShell>
  );
}

// --- Pantalla ---------------------------------------------------------------------

/**
 * Chat con el asistente IA (texto y notas de voz). Vistas internas: lista de
 * conversaciones y conversación. Con "Sin IA" en el servidor no está disponible.
 */
export function AssistantChatScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rt>();
  const { availability } = useAssistant();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const [openId, setOpenId] = useState<number | null>(params?.conversationId ?? null);

  if (!availability.canChat) {
    return (
      <MobileShell header={<AppHeader title="Asistente IA" onBack={back} />}>
        <EmptyState
          icon="sparkles-outline"
          title="Asistente no disponible"
          description={
            availability.aiEnabled
              ? 'Tu usuario no tiene permiso para usar el asistente.'
              : 'Este servidor tiene la opción «Sin inteligencia artificial». El administrador puede activarla en Configuración > IA.'
          }
        />
      </MobileShell>
    );
  }

  if (openId !== null) {
    return <Conversation key={openId} id={openId} onBack={() => setOpenId(null)} />;
  }
  return <ConversationList onOpen={setOpenId} onBack={back} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { gap: 12, paddingBottom: 32 },
  messages: { padding: 16, gap: 12, flexGrow: 1 },
  notice: { paddingHorizontal: 16, paddingBottom: 8 },
});
