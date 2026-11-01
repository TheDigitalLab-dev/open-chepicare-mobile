import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export interface TimelineItemProps {
  title: string;
  subtitle?: string;
  date?: string;
  description?: string;
  /** Color del punto (default primary). */
  tone?: 'primary' | 'success' | 'warning' | 'destructive';
  /** Oculta la línea inferior (último item). */
  last?: boolean;
}

export function TimelineItem({
  title,
  subtitle,
  date,
  description,
  tone = 'primary',
  last,
}: TimelineItemProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.gutter}>
        <View style={[styles.dot, { backgroundColor: colors[tone] }]} />
        {!last ? (
          <View style={[styles.line, { backgroundColor: colors.border }]} />
        ) : null}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{subtitle}</Text>
        ) : null}
        {date ? (
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{date}</Text>
        ) : null}
        {description ? (
          <Text style={[styles.desc, { color: colors.mutedForeground }]}>
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  gutter: { alignItems: 'center', width: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  line: { width: 2, flex: 1, marginTop: 4 },
  content: { flex: 1, paddingBottom: 20, gap: 2 },
  title: { fontSize: 15, fontWeight: '600' },
  date: { fontSize: 12 },
  desc: { fontSize: 13 },
});
