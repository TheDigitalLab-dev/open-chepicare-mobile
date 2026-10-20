import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { Badge, Button } from '@/components/ui';

export interface EventRegistrationRowProps {
  title: string;
  scheduleLabel: string;
  statusLabel: string;
  active: boolean;
  /** Si se puede cancelar (activa y el evento no terminó). */
  canCancel: boolean;
  cancelling: boolean;
  onOpen: () => void;
  onCancel: () => void;
}

/** Una fila de "Mis inscripciones": abre el evento y permite cancelar. */
export function EventRegistrationRow({
  title,
  scheduleLabel,
  statusLabel,
  active,
  canCancel,
  cancelling,
  onOpen,
  onCancel,
}: EventRegistrationRowProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: colors.eventClinic,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${scheduleLabel}. ${statusLabel}`}
        accessibilityHint="Abre el detalle del evento"
        onPress={onOpen}
        style={({ pressed }) => [styles.body, { opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={styles.headerRow}>
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              { color: colors.foreground },
              !active && styles.cancelled,
            ]}
          >
            {title}
          </Text>
          <Badge label={statusLabel} variant={active ? 'success' : 'outline'} />
        </View>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {scheduleLabel}
        </Text>
      </Pressable>
      {canCancel ? (
        <Button
          label="Cancelar inscripción"
          variant="outline"
          size="sm"
          loading={cancelling}
          disabled={cancelling}
          accessibilityLabel={`Cancelar inscripción en ${title}`}
          onPress={onCancel}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: 10, padding: 14, borderWidth: 1, borderLeftWidth: 4, borderRadius: 12 },
  body: { gap: 4 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { flex: 1, fontSize: 16, fontWeight: '600' },
  cancelled: { textDecorationLine: 'line-through' },
  meta: { fontSize: 13 },
});
