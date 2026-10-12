import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { Badge, Button, type BadgeVariant } from '@/components/ui';
import {
  TOOL_CALL_STATUS_LABEL,
  toolCallLabel,
  toolCallSummary,
} from '@/services/assistant';
import type { AiToolCall } from '@/types/assistant';

const STATUS_VARIANT: Record<AiToolCall['status'], BadgeVariant> = {
  executed: 'success',
  proposed: 'warning',
  rejected: 'outline',
  failed: 'destructive',
  denied: 'destructive',
};

export interface ToolCallRowProps {
  call: AiToolCall;
  busy?: boolean;
  onConfirm?: () => void;
  onReject?: () => void;
}

/** Una acción del agente: qué hizo/propone, su estado y, si espera, confirmar/rechazar. */
export function ToolCallRow({ call, busy, onConfirm, onReject }: ToolCallRowProps) {
  const { colors } = useTheme();
  const summary = toolCallSummary(call);
  const pending = call.status === 'proposed';
  return (
    <View
      style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {toolCallLabel(call.tool_name)}
        </Text>
        <Badge
          label={TOOL_CALL_STATUS_LABEL[call.status]}
          variant={STATUS_VARIANT[call.status]}
        />
      </View>
      {summary ? (
        <Text style={[styles.summary, { color: colors.mutedForeground }]}>{summary}</Text>
      ) : null}
      {call.error_message ? (
        <Text style={[styles.summary, { color: colors.destructive }]}>
          {call.error_message}
        </Text>
      ) : null}
      {pending && onConfirm && onReject ? (
        <View style={styles.actions}>
          <Button
            label="Rechazar"
            variant="outline"
            size="sm"
            disabled={busy}
            onPress={onReject}
            style={styles.action}
          />
          <Button
            label="Confirmar"
            size="sm"
            loading={busy}
            disabled={busy}
            onPress={onConfirm}
            style={styles.action}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderWidth: 1, borderRadius: 8, padding: 10, gap: 6 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  summary: { fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1 },
});
