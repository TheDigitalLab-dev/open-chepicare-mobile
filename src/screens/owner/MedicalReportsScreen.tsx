import { useCallback } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary } from '@/components/ui';
import { ListRow } from '@/components/domain';
import type { OwnerPetsStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { useChangeAlerts } from '@/hooks/useChangeAlerts';
import { ownerMedicalReportAlertsFor } from '@/services/changeAlertConfigs';
import { listMedicalReports } from '@/services/medical';
import { formatDate } from '@/utils/format';
import type { MedicalReport } from '@/types/models';

type Nav = NativeStackNavigationProp<OwnerPetsStackParamList>;

export function MedicalReportsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<OwnerPetsStackParamList, 'MedicalReports'>>();
  const { petId } = route.params;
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data, loading, error, reload } = useAsync(() => listMedicalReports(petId));

  // O5 del plan: informes médicos nuevos quedan en el centro de notificaciones.
  useChangeAlerts(data, ownerMedicalReportAlertsFor(petId));
  const items = data ?? [];

  const renderItem = useCallback(
    ({ item: r }: ListRenderItemInfo<MedicalReport>) => (
      <ListRow
        title={r.title}
        subtitle={formatDate(r.generated_at ?? r.created_at)}
        onPress={() => navigation.navigate('MedicalReportDetail', { petId, id: r.id })}
      />
    ),
    [navigation, petId],
  );

  return (
    <MobileShell
      header={<AppHeader title="Reportes médicos" onBack={back} />}
      contentStyle={styles.content}
    >
      <AsyncBoundary
        loading={loading && data === null}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyIcon="reader"
        emptyTitle="Sin reportes"
        emptyDescription="Esta mascota no tiene reportes médicos."
      >
        <FlatList
          data={items}
          keyExtractor={(r) => String(r.id)}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      </AsyncBoundary>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8 },
  list: { flex: 1 },
  listContent: { gap: 8, paddingBottom: 32 },
});
