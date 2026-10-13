import { useCallback } from 'react';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Badge, type BadgeVariant } from '@/components/ui';
import { ListRow } from '@/components/domain';
import type { AdminMoreStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { getAdminConsultation } from '@/services/admin';
import type { LabExam } from '@/types/models';
import { formatLabResults } from '@/utils/labResults';

type Rt = RouteProp<AdminMoreStackParamList, 'AdminLabExams'>;

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En proceso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'outline',
};

export function AdminLabExamsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rt>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data, loading, error, reload } = useAsync(() =>
    getAdminConsultation(params.consultationId),
  );
  const exams = data?.lab_exams ?? [];

  const renderItem = useCallback(
    ({ item: e }: ListRenderItemInfo<LabExam>) => (
      <ListRow
        title={e.exam_name}
        subtitle={formatLabResults(e.results)}
        showChevron={false}
        trailing={() => (
          <Badge
            label={STATUS_LABEL[e.status] ?? e.status}
            variant={STATUS_VARIANT[e.status] ?? 'outline'}
          />
        )}
      />
    ),
    [],
  );

  return (
    <MobileShell
      header={<AppHeader title="Exámenes de laboratorio" onBack={back} />}
      contentStyle={styles.content}
    >
      <AsyncBoundary
        loading={loading && data === null}
        error={error}
        onRetry={reload}
        empty={data !== null && exams.length === 0}
        emptyIcon="flask"
        emptyTitle="Sin exámenes"
        emptyDescription="Esta consulta no tiene exámenes de laboratorio."
      >
        <FlatList
          data={exams}
          keyExtractor={(e) => String(e.id)}
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
