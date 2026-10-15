import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import {
  AsyncBoundary,
  Fab,
  FilterChips,
  ListFooter,
  type BadgeVariant,
} from '@/components/ui';
import { AppointmentCard } from '@/components/domain';
import type { AdminAgendaStackParamList } from '@/navigation/types';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import { useChangeAlerts } from '@/hooks/useChangeAlerts';
import { adminAppointmentAlerts } from '@/services/changeAlertConfigs';
import { syncClinicAgendaReminder } from '@/services/reminderAlarms';
import { listAdminAppointments, type AdminAgendaScope } from '@/services/admin';
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

const SCOPES: { id: AdminAgendaScope; label: string }[] = [
  { id: 'upcoming', label: 'Próximas' },
  { id: 'past', label: 'Pasadas' },
];

const FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'confirmed', label: 'Confirmadas' },
  { id: 'completed', label: 'Completadas' },
  { id: 'cancelled', label: 'Canceladas' },
];

export function AdminAppointmentsListScreen() {
  const navigation = useNavigation<Nav>();
  const [scope, setScope] = useState<AdminAgendaScope>('upcoming');
  const [filter, setFilter] = useState('all');
  // Estado y fecha los filtra el servidor, página a página (antes: las 100
  // citas más antiguas de la historia, filtradas en el cliente).
  const { items, loading, loadingMore, error, moreError, reload, loadMore } =
    usePaginatedList(
      (page) =>
        listAdminAppointments(
          {
            scope,
            status: filter === 'all' ? undefined : (filter as AppointmentStatus),
          },
          page,
        ),
      `${scope}:${filter}`,
    );

  // A1/A2 del plan: citas nuevas y cancelaciones al centro de notificaciones.
  useChangeAlerts(loading ? null : items, adminAppointmentAlerts);

  // Al volver a la agenda se recarga (el montaje ya cargó la página 1).
  useReloadOnFocus(reload);
  // A3/V2: resumen local de la agenda de mañana a las 7:30 (consulta propia).
  useFocusEffect(
    useCallback(() => {
      syncClinicAgendaReminder().catch(() => {
        // Sin red: se reintenta en la próxima visita a la agenda.
      });
    }, []),
  );

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
      <FilterChips
        options={SCOPES}
        selectedId={scope}
        onSelect={(id) => setScope(id as AdminAgendaScope)}
      />
      <FilterChips options={FILTERS} selectedId={filter} onSelect={setFilter} />

      <AsyncBoundary
        loading={loading && items.length === 0}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyIcon="calendar"
        emptyTitle="Sin citas"
        emptyDescription="No hay citas para este filtro."
      >
        <FlatList
          data={items}
          keyExtractor={(a) => String(a.id)}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <ListFooter loading={loadingMore} error={moreError} onRetry={loadMore} />
          }
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
