import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Fab, FilterChips, type BadgeVariant } from '@/components/ui';
import { AppointmentCard } from '@/components/domain';
import type { OwnerAppointmentsStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { listAppointments } from '@/services/appointments';
import { splitAppointments } from '@/utils/appointmentGroups';
import { formatDateTime } from '@/utils/format';
import {
  APPOINTMENT_STATUS_LABEL,
  type Appointment,
  type AppointmentStatus,
} from '@/types/models';

type Nav = NativeStackNavigationProp<OwnerAppointmentsStackParamList>;
type Filter = 'upcoming' | 'past';

const STATUS_VARIANT: Record<AppointmentStatus, BadgeVariant> = {
  pending: 'warning',
  confirmed: 'success',
  in_progress: 'primary',
  completed: 'primary',
  cancelled: 'destructive',
  rescheduled: 'warning',
};

const FILTERS = [
  { id: 'upcoming', label: 'Próximas' },
  { id: 'past', label: 'Pasadas' },
];

function vetName(a: Appointment): string | undefined {
  if (!a.assigned_to) return undefined;
  return `${a.assigned_to.first_name} ${a.assigned_to.last_name}`.trim();
}

export function AppointmentsListScreen() {
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState<Filter>('upcoming');
  const { data, loading, error, reload } = useAsync(() => listAppointments());

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  // Próximas: la más cercana primero. Pasadas: la más reciente primero.
  const appointments = useMemo(() => {
    const { upcoming, past } = splitAppointments(data ?? []);
    return filter === 'upcoming' ? upcoming : past;
  }, [data, filter]);

  const fab = useMemo(
    () => (
      <Fab
        icon="add"
        accessibilityLabel="Agendar cita"
        onPress={() => navigation.navigate('AppointmentWizard', {})}
      />
    ),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item: a }: ListRenderItemInfo<Appointment>) => (
      <AppointmentCard
        petName={a.pet?.name ?? 'Mascota'}
        dateLabel={formatDateTime(a.scheduled_at, a.time_zone)}
        vetName={vetName(a)}
        statusLabel={APPOINTMENT_STATUS_LABEL[a.status]}
        statusVariant={STATUS_VARIANT[a.status]}
        onPress={() => navigation.navigate('AppointmentDetail', { id: a.id })}
      />
    ),
    [navigation],
  );

  return (
    <MobileShell
      header={<AppHeader title="Citas" />}
      contentStyle={styles.content}
      fab={fab}
    >
      <FilterChips
        options={FILTERS}
        selectedId={filter}
        onSelect={(id) => setFilter(id as Filter)}
      />

      <AsyncBoundary
        loading={loading && data === null}
        error={error}
        onRetry={reload}
        empty={appointments.length === 0}
        emptyIcon="calendar"
        emptyTitle="Sin citas"
        emptyDescription={
          filter === 'upcoming'
            ? 'No tienes citas próximas. Agenda una con el botón +.'
            : 'No hay citas pasadas.'
        }
      >
        <FlatList
          data={appointments}
          keyExtractor={(a) => String(a.id)}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      </AsyncBoundary>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12 },
  list: { flex: 1 },
  listContent: { gap: 12, paddingBottom: 96 },
});
