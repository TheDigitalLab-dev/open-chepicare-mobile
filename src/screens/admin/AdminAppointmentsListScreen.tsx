import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Fab, FilterChips, type BadgeVariant } from '@/components/ui';
import { AppointmentCard } from '@/components/domain';
import type { AdminAgendaStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { useChangeAlerts } from '@/hooks/useChangeAlerts';
import { adminAppointmentAlerts } from '@/services/changeAlertConfigs';
import { syncReminders } from '@/services/reminderAlarms';
import { clinicAgendaReminders } from '@/utils/reminders';
import { listAdminAppointments } from '@/services/admin';
import { formatDateTime } from '@/utils/format';
import {
  APPOINTMENT_STATUS_LABEL,
  type Appointment,
  type AppointmentStatus,
} from '@/types/models';

type Nav = NativeStackNavigationProp<AdminAgendaStackParamList>;

const STATUS_VARIANT: Record<AppointmentStatus, BadgeVariant> = {
  pending: 'warning',
  confirmed: 'success',
  in_progress: 'info',
  completed: 'info',
  cancelled: 'destructive',
  rescheduled: 'warning',
};

const FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'confirmed', label: 'Confirmadas' },
  { id: 'completed', label: 'Completadas' },
  { id: 'cancelled', label: 'Canceladas' },
];

export function AdminAppointmentsListScreen() {
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState('all');
  const { data, loading, error, reload } = useAsync(() => listAdminAppointments());

  // A1/A2 del plan: citas nuevas y cancelaciones al centro de notificaciones.
  useChangeAlerts(data, adminAppointmentAlerts);
  // A3/V2: resumen local de la agenda de mañana a las 7:30.
  useEffect(() => {
    if (!data) return;
    void syncReminders('agenda-', clinicAgendaReminders(data, new Date().toISOString()));
  }, [data]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const appointments = useMemo(() => {
    const list = data ?? [];
    return filter === 'all' ? list : list.filter((a) => a.status === filter);
  }, [data, filter]);

  const fab = useMemo(
    () => (
      <Fab
        accessibilityLabel="Agendar cita"
        onPress={() => navigation.navigate('AdminAppointmentWizard', {})}
      />
    ),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item: a }: ListRenderItemInfo<Appointment>) => (
      <AppointmentCard
        petName={a.pet?.name ?? 'Mascota'}
        dateLabel={formatDateTime(a.scheduled_at, a.time_zone)}
        vetName={
          a.assigned_to
            ? `${a.assigned_to.first_name} ${a.assigned_to.last_name}`
            : undefined
        }
        statusLabel={APPOINTMENT_STATUS_LABEL[a.status]}
        statusVariant={STATUS_VARIANT[a.status]}
        onPress={() => navigation.navigate('AdminAppointmentDetail', { id: a.id })}
      />
    ),
    [navigation],
  );

  return (
    <MobileShell
      header={<AppHeader title="Agenda" />}
      contentStyle={styles.content}
      fab={fab}
    >
      <FilterChips options={FILTERS} selectedId={filter} onSelect={setFilter} />

      <AsyncBoundary
        loading={loading && data === null}
        error={error}
        onRetry={reload}
        empty={appointments.length === 0}
        emptyIcon="calendar"
        emptyTitle="Sin citas"
        emptyDescription="No hay citas para este filtro."
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
