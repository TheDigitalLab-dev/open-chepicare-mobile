import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Fab, ListFooter } from '@/components/ui';
import { TimelineItem } from '@/components/domain';
import type { AdminMoreStackParamList } from '@/navigation/types';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import { listAdminVaccinations } from '@/services/admin';
import { formatDate } from '@/utils/format';
import type { Vaccination } from '@/types/models';

type Nav = NativeStackNavigationProp<AdminMoreStackParamList>;

export function AdminVaccinationsListScreen() {
  const navigation = useNavigation<Nav>();
  const { items, loading, loadingMore, error, moreError, reload, loadMore } =
    usePaginatedList((page) => listAdminVaccinations(page));

  useReloadOnFocus(reload);

  const fab = useMemo(
    () => (
      <Fab
        accessibilityLabel="Agregar vacuna"
        onPress={() => navigation.navigate('AdminVaccinationForm', {})}
      />
    ),
    [navigation],
  );

  const count = items.length;
  const renderItem = useCallback(
    ({ item: v, index }: ListRenderItemInfo<Vaccination>) => (
      <TimelineItem
        title={v.vaccine_name}
        date={`Aplicada: ${formatDate(v.application_date)}`}
        description={`${v.manufacturer ?? 'Fabricante desconocido'} · Próxima: ${formatDate(v.next_due_date)}`}
        last={index === count - 1}
      />
    ),
    [count],
  );

  return (
    <MobileShell
      header={
        <AppHeader
          title="Vacunas"
          onBack={navigation.canGoBack() ? navigation.goBack : undefined}
        />
      }
      contentStyle={styles.content}
      fab={fab}
    >
      <AsyncBoundary
        loading={loading && items.length === 0}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyIcon="bandage"
        emptyTitle="Sin vacunas"
        emptyDescription="No hay vacunas registradas."
      >
        <FlatList
          data={items}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <ListFooter loading={loadingMore} error={moreError} onRetry={loadMore} />
          }
          keyExtractor={(v) => String(v.id)}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      </AsyncBoundary>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 4 },
  list: { flex: 1 },
  listContent: { gap: 4, paddingBottom: 96 },
});
