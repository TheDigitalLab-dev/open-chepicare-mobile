import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { Fab } from '@/components/ui';
import { eventSubtitle } from '@/utils/calendarEvents';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { CalendarBoard } from '@/components/domain';
import type {
  OwnerAppointmentsStackParamList,
  OwnerTabParamList,
} from '@/navigation/types';
import { useCalendar } from '@/hooks/useCalendar';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import type { CalendarEvent } from '@/types/calendar';

type Nav = NativeStackNavigationProp<OwnerAppointmentsStackParamList>;

/**
 * Calendario del propietario: citas, tratamientos, próximas vacunas y
 * desparasitaciones de sus mascotas.
 */
export function OwnerCalendarScreen() {
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const calendar = useCalendar({ audience: 'owner' });
  // Al volver de agendar o de un detalle, el calendario se pone al día.
  useReloadOnFocus(calendar.reload);

  const openEvent = (event: CalendarEvent) => {
    if (event.type === 'clinic_event') {
      Alert.alert(event.title, eventSubtitle(event, 'owner'));
      return;
    }
    if (event.type === 'appointment') {
      navigation.navigate('AppointmentDetail', { id: event.record_id });
      return;
    }
    navigation
      .getParent<BottomTabNavigationProp<OwnerTabParamList>>()
      ?.navigate('PetsTab', {
        screen: 'PetDetail',
        params: { id: event.pet.id },
        initial: false,
      });
  };

  return (
    <MobileShell
      scroll
      fab={
        calendar.canCreateAppointment ? (
          <Fab
            accessibilityLabel="Agendar cita"
            onPress={() => navigation.navigate('AppointmentWizard', {})}
          />
        ) : undefined
      }
      header={<AppHeader title="Calendario" onBack={back} />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      <CalendarBoard
        viewMode={calendar.viewMode}
        onViewModeChange={calendar.setViewMode}
        events={calendar.events}
        audience="owner"
        month={calendar.month}
        weeks={calendar.weeks}
        today={calendar.today}
        selectedDay={calendar.selectedDay}
        markersByDay={calendar.markersByDay}
        selectedEvents={calendar.selectedEvents}
        loading={calendar.loading}
        error={calendar.error}
        legendTypes={calendar.legendTypes}
        hiddenTypes={calendar.hiddenTypes}
        includeCancelled={calendar.includeCancelled}
        canCreate={calendar.canCreateOnSelectedDay}
        onRetry={() => void calendar.reload()}
        onSelectDay={calendar.selectDay}
        onPrevMonth={calendar.prevMonth}
        onNextMonth={calendar.nextMonth}
        onToday={calendar.goToday}
        onToggleType={calendar.toggleType}
        onIncludeCancelledChange={calendar.setIncludeCancelled}
        onOpenEvent={openEvent}
        onCreate={() =>
          navigation.navigate('AppointmentWizard', { date: calendar.selectedDay })
        }
      />
    </MobileShell>
  );
}
