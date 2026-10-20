import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { Badge, type BadgeVariant } from '@/components/ui';

export interface ClinicEventCardProps {
  title: string;
  scheduleLabel: string;
  location?: string | null;
  imageUrl?: string | null;
  /** "Quedan 24 cupos" / "Cupo completo". */
  spotsLabel: string;
  spotsVariant: BadgeVariant;
  /** El propietario ya está inscrito. */
  registered: boolean;
  onPress: () => void;
}

/** Un evento de la clínica en la lista del propietario; tocarlo abre el detalle. */
export function ClinicEventCard({
  title,
  scheduleLabel,
  location,
  imageUrl,
  spotsLabel,
  spotsVariant,
  registered,
  onPress,
}: ClinicEventCardProps) {
  const { colors } = useTheme();
  const status = registered ? `Inscrito. ${spotsLabel}` : spotsLabel;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${scheduleLabel}${location ? `. ${location}` : ''}. ${status}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: colors.eventClinic,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={150}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      <View style={styles.body}>
        <Text numberOfLines={2} style={[styles.title, { color: colors.foreground }]}>
          {title}
        </Text>
        <View style={styles.line}>
          <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {scheduleLabel}
          </Text>
        </View>
        {location ? (
          <View style={styles.line}>
            <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
            <Text
              numberOfLines={1}
              style={[styles.meta, { color: colors.mutedForeground }]}
            >
              {location}
            </Text>
          </View>
        ) : null}
        <View style={styles.badges}>
          {registered ? <Badge label="Inscrito" variant="success" /> : null}
          <Badge label={spotsLabel} variant={spotsVariant} />
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
    padding: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 12,
  },
  image: { width: 56, height: 56, borderRadius: 8 },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '600' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { flex: 1, fontSize: 13 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
});
