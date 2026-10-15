import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, ListFooter, SearchBar } from '@/components/ui';
import { ListRow } from '@/components/domain';
import type { AdminMoreStackParamList } from '@/navigation/types';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { listAdminMedicalReports } from '@/services/admin';
import { formatDate } from '@/utils/format';
import type { MedicalReport } from '@/types/models';

type Nav = NativeStackNavigationProp<AdminMoreStackParamList>;

export function AdminMedicalReportsListScreen() {
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const [query, setQuery] = useState('');
  const [petSearch, setPetSearch] = useState('');
  // La búsqueda la hace el servidor (antes filtraba solo la primera página).
  useEffect(() => {
    const timer = setTimeout(() => setPetSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const { items, loading, loadingMore, error, moreError, reload, loadMore } =
    usePaginatedList((page) => listAdminMedicalReports({ petSearch }, page), petSearch);

  const renderItem = useCallback(
    ({ item: r }: ListRenderItemInfo<MedicalReport>) => (
      <ListRow
        title={r.title}
        subtitle={formatDate(r.generated_at ?? r.created_at)}
        onPress={() => navigation.navigate('AdminMedicalReportDetail', { id: r.id })}
      />
    ),
    [navigation],
  );

  return (
    <MobileShell
      header={<AppHeader title="Reportes médicos" onBack={back} />}
      contentStyle={styles.content}
    >
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar por mascota…"
      />

      <AsyncBoundary
        loading={loading && items.length === 0}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyIcon="document-text"
        emptyTitle="Sin reportes"
        emptyDescription="No hay reportes médicos."
      >
        <FlatList
          data={items}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <ListFooter loading={loadingMore} error={moreError} onRetry={loadMore} />
          }
          keyExtractor={(r) => String(r.id)}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
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
