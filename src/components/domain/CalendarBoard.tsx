import { StyleSheet, Switch, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { AsyncBoundary, Button, Card, IconButton } from '@/components/ui';
import type { ApiError } from '@/types/api';
import type { CalendarEvent, CalendarEventType } from '@/types/calendar';
import type { CalendarAudience } from '@/utils/calendarGrid';
import {
  eventStatusLabel,
  eventSubtitle,
  monthTitle,
  selectedDayTitle,
} from '@/utils/calendarEvents';
import type { MonthRef } from '@/utils/schedule';
import { CalendarEventRow } from './CalendarEventRow';
import { CalendarLegend } from './CalendarLegend';
import { CalendarMonthGrid } from './CalendarMonthGrid';

export interface CalendarBoardProps {
  audience: CalendarAudience;
  month: MonthRef;
  weeks: string[][];
  today: string;
  selectedDay: string;
  markersByDay: Map<string, CalendarEventType[]>;
  selectedEvents: CalendarEvent[];
  loading: boolean;
  error: ApiError | null;
  legendTypes: CalendarEventType[];
  hiddenTypes: CalendarEventType[];
  includeCancelled: boolean;
  canCreate: boolean;
  /** Filtros extra (veterinario del personal). */
  filters?: React.ReactNode;
  onRetry: () => void;
  onSelectDay: (day: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onToggleType: (type: CalendarEventType) => void;
  onIncludeCancelledChange: (value: boolean) => void;
  onOpenEvent: (event: CalendarEvent) => void;
  onCreate: () => void;
}

/**
 * Calendario mobile-first: barra del mes, cuadrícula con puntos por tipo,
 * leyenda, filtros y debajo la lista del día elegido.
 */
export function CalendarBoard({
  audience,
  month,
  weeks,
  today,
  selectedDay,
  markersByDay,
  selectedEvents,
  loading,
  error,
  legendTypes,
  hiddenTypes,
  includeCancelled,
  canCreate,
  filters,
  onRetry,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onToday,
  onToggleType,
  onIncludeCancelledChange,
  onOpenEvent,
  onCreate,
}: CalendarBoardProps) {
  const { colors } = useTheme();
  const showsCancelledToggle =
    legendTypes.length === 0 || legendTypes.includes('appointment');
  return (
    <View style={styles.root}>
      <Card padding={8} style={styles.card}>
        <View style={styles.toolbar}>
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Mes anterior"
            onPress={onPrevMonth}
          />
          <Text
            accessibilityRole="header"
            style={[styles.monthTitle, { color: colors.foreground }]}
          >
            {monthTitle(month)}
          </Text>
          <IconButton
            icon="chevron-forward"
            accessibilityLabel="Mes siguiente"
            onPress={onNextMonth}
          />
          <Button label="Hoy" size="sm" variant="outline" onPress={onToday} />
        </View>
        <CalendarMonthGrid
          month={month}
          weeks={weeks}
          today={today}
          selectedDay={selectedDay}
          markersByDay={markersByDay}
          onSelectDay={onSelectDay}
        />
      </Card>

      {legendTypes.length > 0 ? (
        <CalendarLegend
          types={legendTypes}
          hiddenTypes={hiddenTypes}
          onToggle={onToggleType}
        />
      ) : null}

      {filters}

      {showsCancelledToggle ? (
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.foreground }]}>
            Mostrar citas canceladas
          </Text>
          <Switch
            value={includeCancelled}
            onValueChange={onIncludeCancelledChange}
            trackColor={{ true: colors.primary, false: colors.border }}
            accessibilityLabel="Mostrar citas canceladas"
          />
        </View>
      ) : null}

      <View style={styles.dayHeader}>
        <Text
          accessibilityRole="header"
          style={[styles.dayTitle, { color: colors.foreground }]}
        >
          {selectedDayTitle(selectedDay)}
        </Text>
        {canCreate ? <Button label="Nueva cita" size="sm" onPress={onCreate} /> : null}
      </View>

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={selectedEvents.length === 0}
        emptyIcon="calendar-clear-outline"
        emptyTitle="Sin eventos este día"
        emptyDescription={
          canCreate ? 'Puedes agendar una cita con «Nueva cita».' : undefined
        }
      >
        <View style={styles.list}>
          {selectedEvents.map((event) => (
            <CalendarEventRow
              key={event.id}
              type={event.type}
              title={event.title}
              subtitle={eventSubtitle(event, audience)}
              statusLabel={eventStatusLabel(event)}
              cancelled={event.type === 'appointment' && event.status === 'cancelled'}
              onPress={() => onOpenEvent(event)}
            />
          ))}
        </View>
      </AsyncBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  card: { gap: 8 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchLabel: { flex: 1, fontSize: 14 },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
  list: { gap: 8 },
});
