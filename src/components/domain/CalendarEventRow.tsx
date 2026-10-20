import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { eventTypeColor, useTheme } from '@/theme';
import { CALENDAR_EVENT_TYPE_LABEL, type CalendarEventType } from '@/types/calendar';

export interface CalendarEventRowProps {
  type: CalendarEventType;
  title: string;
  subtitle: string;
  statusLabel: string;
  /** Cita cancelada: se muestra tachada. */
  cancelled?: boolean;
  onPress: () => void;
}

/** Un evento de la lista del día; tocarlo abre el detalle de la cita o de la mascota. */
export function CalendarEventRow({
  type,
  title,
  subtitle,
  statusLabel,
  cancelled = false,
  onPress,
}: CalendarEventRowProps) {
  const { colors } = useTheme();
  const color = eventTypeColor(colors, type);
  const typeLabel = CALENDAR_EVENT_TYPE_LABEL[type];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${typeLabel}: ${title}. ${subtitle}. ${statusLabel}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: color,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.body}>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            { color: colors.foreground },
            cancelled && styles.cancelled,
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={2}
            style={[styles.subtitle, { color: colors.mutedForeground }]}
          >
            {subtitle}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {`${typeLabel} · ${statusLabel}`}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    padding: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 12,
  },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '600' },
  cancelled: { textDecorationLine: 'line-through' },
  subtitle: { fontSize: 13 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { fontSize: 12 },
});
