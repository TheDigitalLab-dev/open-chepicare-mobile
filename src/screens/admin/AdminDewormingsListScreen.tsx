import { useCallback } from 'react';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, ListFooter } from '@/components/ui';
import { TimelineItem } from '@/components/domain';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import { listAdminDewormings } from '@/services/admin';
import { formatDate } from '@/utils/format';
import type { Deworming } from '@/types/models';

export function AdminDewormingsListScreen() {
  const navigation = useNavigation();
  const { items, loading, loadingMore, error, moreError, reload, loadMore } =
    usePaginatedList((page) => listAdminDewormings(page));

  useReloadOnFocus(reload);

  const count = items.length;
  const renderItem = useCallback(
    ({ item: d, index }: ListRenderItemInfo<Deworming>) => (
      <TimelineItem
        title={d.product_name}
        date={`Aplicada: ${formatDate(d.application_date)}`}
        description={`${d.dose ?? 'Dosis no especificada'} · Próxima: ${formatDate(d.next_due_date)}`}
        last={index === count - 1}
      />
    ),
    [count],
  );

  return (
    <MobileShell
      header={
        <AppHeader
          title="Desparasitaciones"
          onBack={navigation.canGoBack() ? navigation.goBack : undefined}
        />
      }
      contentStyle={styles.content}
    >
      <AsyncBoundary
        loading={loading && items.length === 0}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyIcon="flask"
        emptyTitle="Sin desparasitaciones"
        emptyDescription="No hay desparasitaciones registradas."
      >
        <FlatList
          data={items}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <ListFooter loading={loadingMore} error={moreError} onRetry={loadMore} />
          }
          keyExtractor={(d) => String(d.id)}
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
