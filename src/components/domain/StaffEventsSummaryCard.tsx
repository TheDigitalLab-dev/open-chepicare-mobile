import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { Card } from '@/components/ui';

export interface StaffEventsSummaryItem {
  id: number;
  title: string;
  scheduleLabel: string;
  /** "N inscritos de M". */
  countLabel: string;
}

export interface StaffEventsSummaryCardProps {
  items: StaffEventsSummaryItem[];
}

/**
 * Resumen de SOLO LECTURA de los eventos próximos para el personal (vet/admin)
 * en la app. A propósito sin `Pressable`, sin `onPress` y sin rol de botón:
 * los eventos se gestionan en la web, desde aquí no se abren ni se tocan.
 */
export function StaffEventsSummaryCard({ items }: StaffEventsSummaryCardProps) {
  const { colors } = useTheme();
  return (
    <Card padding={0} style={styles.card}>
      {items.map((item, index) => (
        <View
          key={item.id}
          accessible
          accessibilityLabel={`${item.title}. ${item.scheduleLabel}. ${item.countLabel}`}
          testID={`staff-event-${item.id}`}
          style={[
            styles.row,
            index > 0 && { borderTopColor: colors.border, borderTopWidth: 1 },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: colors.eventClinic }]} />
          <View style={styles.body}>
            <Text numberOfLines={2} style={[styles.title, { color: colors.foreground }]}>
              {item.title}
            </Text>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
              {item.scheduleLabel}
            </Text>
          </View>
          <Text style={[styles.count, { color: colors.foreground }]}>
            {item.countLabel}
          </Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 13 },
  count: { fontSize: 13, fontWeight: '600', textAlign: 'right', maxWidth: 120 },
});
