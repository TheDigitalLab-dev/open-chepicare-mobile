import { Pressable, StyleSheet, Text, View } from 'react-native';

import { eventTypeColor, useTheme } from '@/theme';
import { CALENDAR_EVENT_TYPE_LABEL, type CalendarEventType } from '@/types/calendar';

export interface CalendarLegendProps {
  types: CalendarEventType[];
  hiddenTypes: CalendarEventType[];
  /** Ocultar / mostrar un tipo (se filtra en el cliente). */
  onToggle: (type: CalendarEventType) => void;
}

/** Leyenda de colores; tocar un tipo lo oculta o lo vuelve a mostrar. */
export function CalendarLegend({ types, hiddenTypes, onToggle }: CalendarLegendProps) {
  const { colors } = useTheme();
  const hidden = new Set(hiddenTypes);
  return (
    <View style={styles.row}>
      {types.map((type) => {
        const visible = !hidden.has(type);
        const label = CALENDAR_EVENT_TYPE_LABEL[type];
        return (
          <Pressable
            key={type}
            accessibilityRole="checkbox"
            accessibilityLabel={`Mostrar ${label.toLowerCase()}`}
            accessibilityState={{ checked: visible }}
            onPress={() => onToggle(type)}
            style={[
              styles.item,
              { borderColor: colors.border, opacity: visible ? 1 : 0.5 },
            ]}
          >
            <View
              style={[
                styles.swatch,
                visible
                  ? { backgroundColor: eventTypeColor(colors, type) }
                  : { borderColor: eventTypeColor(colors, type), borderWidth: 2 },
              ]}
            />
            <Text
              style={[
                styles.label,
                { color: colors.foreground },
                !visible && styles.hidden,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 9999,
  },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 13, fontWeight: '500' },
  hidden: { textDecorationLine: 'line-through' },
});
