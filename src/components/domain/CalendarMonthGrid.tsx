import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { eventTypeColor, useTheme } from '@/theme';
import type { CalendarEventType } from '@/types/calendar';
import { dayAccessibilityLabel } from '@/utils/calendarEvents';
import { WEEKDAY_LABELS, isDayInMonth } from '@/utils/calendarGrid';
import type { MonthRef } from '@/utils/schedule';

export interface CalendarMonthGridProps {
  month: MonthRef;
  weeks: string[][];
  today: string;
  selectedDay: string;
  markersByDay: Map<string, CalendarEventType[]>;
  onSelectDay: (day: string) => void;
}

interface DayCellProps {
  day: string;
  inMonth: boolean;
  isToday: boolean;
  selected: boolean;
  types: CalendarEventType[];
  onSelectDay: (day: string) => void;
}

const DayCell = memo(function DayCell({
  day,
  inMonth,
  isToday,
  selected,
  types,
  onSelectDay,
}: DayCellProps) {
  const { colors } = useTheme();
  let textColor = inMonth ? colors.foreground : colors.mutedForeground;
  if (selected) textColor = colors.primaryForeground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dayAccessibilityLabel(day, types, isToday)}
      accessibilityState={{ selected }}
      onPress={() => onSelectDay(day)}
      style={styles.cell}
    >
      <View
        style={[
          styles.dayCircle,
          selected && { backgroundColor: colors.primary },
          isToday && !selected && { borderColor: colors.primary, borderWidth: 1.5 },
        ]}
      >
        <Text
          style={[
            styles.dayNumber,
            { color: textColor, opacity: inMonth || selected ? 1 : 0.6 },
            isToday && styles.today,
          ]}
        >
          {Number(day.slice(8, 10))}
        </Text>
      </View>
      <View style={styles.dots}>
        {types.map((type) => (
          <View
            key={type}
            style={[styles.dot, { backgroundColor: eventTypeColor(colors, type) }]}
          />
        ))}
      </View>
    </Pressable>
  );
});

const NO_TYPES: CalendarEventType[] = [];

/** Vista mes: días con puntos de color por tipo de evento. */
export function CalendarMonthGrid({
  month,
  weeks,
  today,
  selectedDay,
  markersByDay,
  onSelectDay,
}: CalendarMonthGridProps) {
  const { colors } = useTheme();
  return (
    <View>
      <View style={styles.row} importantForAccessibility="no-hide-descendants">
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={[styles.weekday, { color: colors.mutedForeground }]}>
            {label}
          </Text>
        ))}
      </View>
      {weeks.map((week) => (
        <View key={week[0]} style={styles.row}>
          {week.map((day) => (
            <DayCell
              key={day}
              day={day}
              inMonth={isDayInMonth(day, month)}
              isToday={day === today}
              selected={day === selectedDay}
              types={markersByDay.get(day) ?? NO_TYPES}
              onSelectDay={onSelectDay}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
  },
  cell: { flex: 1, alignItems: 'center', minHeight: 48, paddingVertical: 2 },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: { fontSize: 14, fontWeight: '500' },
  today: { fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 3, height: 8, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
