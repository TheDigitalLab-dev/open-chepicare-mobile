import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { Badge, type BadgeVariant } from '@/components/ui';

export interface AppointmentCardProps {
  petName: string;
  dateLabel: string;
  vetName?: string;
  statusLabel: string;
  statusVariant?: BadgeVariant;
  onPress?: () => void;
}

export function AppointmentCard({
  petName,
  dateLabel,
  vetName,
  statusLabel,
  statusVariant = 'primary',
  onPress,
}: AppointmentCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${petName}, ${dateLabel}, ${statusLabel}`}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed && onPress ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.pet, { color: colors.foreground }]}>{petName}</Text>
        <Badge label={statusLabel} variant={statusVariant} />
      </View>
      <Text style={[styles.date, { color: colors.foreground }]}>{dateLabel}</Text>
      {vetName ? (
        <Text style={[styles.vet, { color: colors.mutedForeground }]}>{vetName}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 4 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pet: { fontSize: 16, fontWeight: '600' },
  date: { fontSize: 14 },
  vet: { fontSize: 13 },
});
