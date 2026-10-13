import { useCallback } from 'react';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary } from '@/components/ui';
import { LabExamStatusBadge, ListRow } from '@/components/domain';
import type { OwnerPetsStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { useChangeAlerts } from '@/hooks/useChangeAlerts';
import { labExamAlerts } from '@/services/changeAlertConfigs';
import { listConsultations } from '@/services/medical';
import type { LabExam } from '@/types/models';
import { formatLabResults } from '@/utils/labResults';

type Nav = NativeStackNavigationProp<OwnerPetsStackParamList>;

export function LabExamsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<OwnerPetsStackParamList, 'LabExams'>>();
  const { petId, consultationId } = route.params;
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data, loading, error, reload } = useAsync(() => listConsultations(petId));
  // Al volver del detalle, la lista muestra los resultados recién guardados.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );
  const consultation = (data ?? []).find((c) => c.id === consultationId);
  const exams = consultation?.lab_exams ?? [];

  // V3/O5 del plan: resultados de laboratorio listos → centro de notificaciones.
  // La identidad de `lab_exams` es estable: viene del estado de useAsync.
  useChangeAlerts(consultation ? consultation.lab_exams : null, labExamAlerts);

  const renderItem = useCallback(
    ({ item: e }: ListRenderItemInfo<LabExam>) => (
      <ListRow
        title={e.exam_name}
        subtitle={formatLabResults(e.results) ?? 'Sin resultados todavía'}
        trailing={() => <LabExamStatusBadge status={e.status} />}
        onPress={() =>
          navigation.navigate('LabExamDetail', {
            petId,
            consultationId,
            examId: e.id,
          })
        }
      />
    ),
    [navigation, petId, consultationId],
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
        empty={exams.length === 0}
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
  listContent: { gap: 8, paddingBottom: 32 },
});
