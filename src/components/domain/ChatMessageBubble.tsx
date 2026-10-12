import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { MESSAGE_STATUS_LABEL, isFinalMessageStatus } from '@/services/assistant';
import type { AiMessage } from '@/types/assistant';
import { ToolCallRow } from './ToolCallRow';

export interface ChatMessageBubbleProps {
  message: AiMessage;
  busyToolCallId: number | null;
  onConfirm: (toolCallId: number) => void;
  onReject: (toolCallId: number) => void;
}

/** Texto visible del mensaje (una nota de voz aún sin transcribir se rotula). */
function bubbleText(message: AiMessage): string {
  if (message.content) return message.content;
  if (message.role === 'user' && message.input_mode === 'voice') return '🎙️ Nota de voz';
  return isFinalMessageStatus(message.status) ? 'Sin respuesta' : '';
}

function BubbleBody({ message, mine }: { message: AiMessage; mine: boolean }) {
  const { colors } = useTheme();
  const textColor = mine ? colors.primaryForeground : colors.foreground;
  const metaColor = mine ? colors.primaryForeground : colors.mutedForeground;
  const text = bubbleText(message);
  const working = !isFinalMessageStatus(message.status);
  const transcribed = mine && message.input_mode === 'voice' && Boolean(message.content);
  return (
    <>
      {transcribed ? (
        <Text style={[styles.meta, { color: metaColor }]}>🎙️ Transcripción</Text>
      ) : null}
      {text ? <Text style={[styles.text, { color: textColor }]}>{text}</Text> : null}
      {working ? (
        <View style={styles.status}>
          <ActivityIndicator
            size="small"
            color={mine ? colors.primaryForeground : colors.primary}
          />
          <Text style={[styles.meta, { color: metaColor }]}>
            {MESSAGE_STATUS_LABEL[message.status]}…
          </Text>
        </View>
      ) : null}
      {message.status === 'failed' && message.error_message ? (
        <Text
          style={[
            styles.meta,
            { color: mine ? colors.primaryForeground : colors.destructive },
          ]}
        >
          {message.error_message}
        </Text>
      ) : null}
    </>
  );
}

/** Mensaje del chat con el asistente (texto o nota de voz) y sus acciones. */
export function ChatMessageBubble({
  message,
  busyToolCallId,
  onConfirm,
  onReject,
}: ChatMessageBubbleProps) {
  const { colors } = useTheme();
  const mine = message.role === 'user';
  const actions = message.tool_calls.filter((call) => call.risk !== 'read');
  const bubbleColors = mine
    ? { backgroundColor: colors.primary }
    : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 };

  return (
    <View style={[styles.wrap, mine ? styles.mine : styles.theirs]}>
      <View style={[styles.bubble, bubbleColors]}>
        <BubbleBody message={message} mine={mine} />
      </View>
      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((call) => (
            <ToolCallRow
              key={call.id}
              call={call}
              busy={busyToolCallId === call.id}
              onConfirm={() => onConfirm(call.id)}
              onReject={() => onReject(call.id)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { maxWidth: '88%', gap: 6 },
  mine: { alignSelf: 'flex-end' },
  theirs: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  text: { fontSize: 15 },
  meta: { fontSize: 12 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actions: { gap: 6 },
});
