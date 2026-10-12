import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/theme';
import { IconButton } from '@/components/ui';
import { formatRecordingDuration } from '@/services/assistant';

export interface ChatComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  sending: boolean;
  /** El servidor tiene transcripción: se permiten notas de voz. */
  voiceEnabled: boolean;
  isRecording: boolean;
  durationMillis: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
}

/** Barra inferior del chat: texto o nota de voz. */
export function ChatComposer(props: ChatComposerProps) {
  const { colors } = useTheme();
  const canSend = props.value.trim().length > 0 && !props.sending;

  if (props.isRecording) {
    return (
      <View
        style={[styles.bar, { borderColor: colors.border, backgroundColor: colors.card }]}
      >
        <IconButton
          icon="trash-outline"
          accessibilityLabel="Descartar nota de voz"
          color={colors.destructive}
          onPress={props.onCancelRecording}
        />
        <Text style={[styles.recording, { color: colors.destructive }]}>
          ● Grabando {formatRecordingDuration(props.durationMillis)}
        </Text>
        <IconButton
          icon="send"
          accessibilityLabel="Enviar nota de voz"
          color={colors.primary}
          onPress={props.onStopRecording}
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.bar, { borderColor: colors.border, backgroundColor: colors.card }]}
    >
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder="Escribe al asistente…"
        placeholderTextColor={colors.mutedForeground}
        keyboardType="default"
        autoCapitalize="sentences"
        multiline
        style={[
          styles.input,
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      />
      {canSend || !props.voiceEnabled ? (
        <IconButton
          icon="send"
          accessibilityLabel="Enviar mensaje"
          color={colors.primary}
          disabled={!canSend}
          onPress={props.onSend}
        />
      ) : (
        <IconButton
          icon="mic"
          accessibilityLabel="Grabar nota de voz"
          color={colors.primary}
          disabled={props.sending}
          onPress={props.onStartRecording}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  recording: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 10,
  },
});
