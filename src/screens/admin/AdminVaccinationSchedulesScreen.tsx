import { useCallback, useEffect } from 'react';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Badge, ListFooter, type BadgeVariant } from '@/components/ui';
import { ListRow } from '@/components/domain';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { syncVaccinationScheduleReminders } from '@/services/reminderAlarms';
import { listVaccinationSchedules, type VaccinationSchedule } from '@/services/admin';
import { formatDate } from '@/utils/format';
import {
  VACCINATION_SCHEDULE_STATUS_LABEL,
  VACCINATION_SCHEDULE_TYPE_LABEL,
} from '@/types/models';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  active: 'success',
  completed: 'info',
  cancelled: 'outline',
};

export function AdminVaccinationSchedulesScreen() {
  const navigation = useNavigation();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const { items, loading, loadingMore, error, moreError, reload, loadMore } =
    usePaginatedList((page) => listVaccinationSchedules(page));

  // A10 del plan: aviso el día previo a cada vacunación programada. Con todos
  // los esquemas activos (no solo la página cargada: la sincronización cancela
  // los avisos que no están en la lista).
  useEffect(() => {
    syncVaccinationScheduleReminders().catch(() => {
      // Sin red: se reintenta en la próxima visita.
    });
  }, []);

  const renderItem = useCallback(
    ({ item: s }: ListRenderItemInfo<VaccinationSchedule>) => (
      <ListRow
        title={s.pet?.name ?? `Esquema #${s.id}`}
        subtitle={`${VACCINATION_SCHEDULE_TYPE_LABEL[s.schedule_type] ?? s.schedule_type}${s.start_date ? ` · ${formatDate(s.start_date)}` : ''}`}
        showChevron={false}
        trailing={() => (
          <Badge
            label={VACCINATION_SCHEDULE_STATUS_LABEL[s.status] ?? s.status}
            variant={STATUS_VARIANT[s.status] ?? 'outline'}
          />
        )}
      />
    ),
    [],
  );

  return (
    <MobileShell
      header={<AppHeader title="Esquemas de vacunación" onBack={back} />}
      contentStyle={styles.content}
    >
      <AsyncBoundary
        loading={loading && items.length === 0}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyIcon="clipboard"
        emptyTitle="Sin esquemas"
        emptyDescription="No hay esquemas de vacunación registrados."
      >
        <FlatList
          data={items}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <ListFooter loading={loadingMore} error={moreError} onRetry={loadMore} />
          }
          keyExtractor={(s) => String(s.id)}
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
  listContent: { gap: 12, paddingBottom: 32 },
});
