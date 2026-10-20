import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { FilterChips, SectionTitle } from '@/components/ui';
import { CalendarBoard } from '@/components/domain';
import type { AdminAgendaStackParamList, AdminTabParamList } from '@/navigation/types';
import { useAuth } from '@/hooks/useAuth';
import { useCalendar } from '@/hooks/useCalendar';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import type { CalendarEvent, CalendarVet, CalendarVetFilter } from '@/types/calendar';

type Nav = NativeStackNavigationProp<AdminAgendaStackParamList>;

function vetOptions(
  vets: CalendarVet[],
  currentUserId: number | undefined,
  mine: boolean,
) {
  return [
    ...(mine ? [{ id: 'me', label: 'Mis citas' }] : []),
    { id: 'all', label: 'Toda la clínica' },
    ...vets
      .filter((v) => v.id !== currentUserId)
      .map((v) => ({ id: String(v.id), label: v.full_name })),
  ];
}

function parseVetFilter(id: string): CalendarVetFilter {
  return id === 'me' || id === 'all' ? id : Number(id);
}

/**
 * Calendario del personal: por defecto el veterinario ve sus citas y admin /
 * recepción toda la clínica; filtro por veterinario. Vacunas y
 * desparasitaciones solo si el rol puede verlas (lo decide el servidor).
 */
export function AdminCalendarScreen() {
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const { user } = useAuth();
  const currentUserId = user?.type === 'User' ? user.id : undefined;
  const calendar = useCalendar({ audience: 'staff', currentUserId });
  useReloadOnFocus(calendar.reload);

  const openEvent = (event: CalendarEvent) => {
    if (event.type === 'appointment') {
      navigation.navigate('AdminAppointmentDetail', { id: event.record_id });
      return;
    }
    navigation
      .getParent<BottomTabNavigationProp<AdminTabParamList>>()
      ?.navigate('PatientsTab', {
        screen: 'AdminPetDetail',
        params: { id: event.pet.id },
        initial: false,
      });
  };

  // Sin respuesta todavía (o sin permiso) no hay filtro que mostrar.
  const filters =
    calendar.vetFilter === null ? null : (
      <>
        <SectionTitle>Veterinario</SectionTitle>
        <FilterChips
          options={vetOptions(calendar.vets, currentUserId, calendar.canFilterMine)}
          selectedId={String(calendar.vetFilter)}
          onSelect={(id) => calendar.setVetFilter(parseVetFilter(id))}
        />
      </>
    );

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Calendario" onBack={back} />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      <CalendarBoard
        audience="staff"
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
        filters={filters}
        onRetry={() => void calendar.reload()}
        onSelectDay={calendar.selectDay}
        onPrevMonth={calendar.prevMonth}
        onNextMonth={calendar.nextMonth}
        onToday={calendar.goToday}
        onToggleType={calendar.toggleType}
        onIncludeCancelledChange={calendar.setIncludeCancelled}
        onOpenEvent={openEvent}
        onCreate={() =>
          navigation.navigate('AdminAppointmentWizard', { date: calendar.selectedDay })
        }
      />
    </MobileShell>
  );
}
