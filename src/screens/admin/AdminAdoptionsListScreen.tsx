import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Fab, ListFooter, PetAvatar } from '@/components/ui';
import type { AdminPatientsStackParamList } from '@/navigation/types';
import { ListRow } from '@/components/domain';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useChangeAlerts } from '@/hooks/useChangeAlerts';
import { adminAdoptionAlerts } from '@/services/changeAlertConfigs';
import { listAdminAdoptions, type AdoptionRecord } from '@/services/admin';
import { formatDate } from '@/utils/format';

// Avatar estático compartido por todas las filas (evita recrear JSX por render).
const PAW_AVATAR = <PetAvatar fallback="🐾" size="md" />;

type Nav = NativeStackNavigationProp<AdminPatientsStackParamList>;

export function AdminAdoptionsListScreen() {
  const navigation = useNavigation<Nav>();
  const { items, loading, loadingMore, error, moreError, reload, loadMore } =
    usePaginatedList((page) => listAdminAdoptions(page));

  // A5 del plan: registros de adopción nuevos al centro de notificaciones.
  useChangeAlerts(loading ? null : items, adminAdoptionAlerts);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const renderItem = useCallback(
    ({ item: record }: ListRenderItemInfo<AdoptionRecord>) => (
      <ListRow
        title={record.pet?.name ?? 'Mascota'}
        subtitle={[
          record.adoption_date ? formatDate(record.adoption_date) : null,
          record.adopter?.full_name ? `Adoptante: ${record.adopter.full_name}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        leading={PAW_AVATAR}
        onPress={() => navigation.navigate('AdminAdoptionDetail', { id: record.id })}
      />
    ),
    [navigation],
  );

  const fab = useMemo(
    () => (
      <Fab
        accessibilityLabel="Registrar adopción"
        onPress={() => navigation.navigate('AdminAdoptionForm')}
      />
    ),
    [navigation],
  );

  return (
    <MobileShell
      header={
        <AppHeader
          title="Adopciones"
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
        emptyIcon="paw"
        emptyTitle="Sin adopciones"
        emptyDescription="Aún no hay adopciones registradas."
      >
        <FlatList
          data={items}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <ListFooter loading={loadingMore} error={moreError} onRetry={loadMore} />
          }
          keyExtractor={(record) => String(record.id)}
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
