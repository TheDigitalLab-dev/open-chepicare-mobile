import { useCallback, useEffect } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary } from '@/components/ui';
import { TimelineItem } from '@/components/domain';
import type { OwnerPetsStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { LEGACY_DEWORMING_REMINDER, syncReminders } from '@/services/reminderAlarms';
import { dewormingReminders } from '@/utils/reminders';
import { listDewormings } from '@/services/medical';
import { formatDate } from '@/utils/format';
import type { Deworming } from '@/types/models';

export function DewormingsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<OwnerPetsStackParamList, 'Dewormings'>>();
  const { petId } = route.params;
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data, loading, error, reload } = useAsync(() => listDewormings(petId));

  // O4 del plan: aviso local 3 días antes de la próxima desparasitación.
  useEffect(() => {
    if (!data) return;
    void syncReminders(
      `dew-p${petId}-`,
      dewormingReminders(data, new Date().toISOString(), petId),
      LEGACY_DEWORMING_REMINDER,
    );
  }, [data, petId]);
  const items = data ?? [];

  const renderItem = useCallback(
    ({ item: d, index }: ListRenderItemInfo<Deworming>) => (
      <TimelineItem
        title={d.product_name}
        date={formatDate(d.application_date)}
        description={
          [
            d.next_due_date ? `Próxima: ${formatDate(d.next_due_date)}` : null,
            d.veterinarian ? d.veterinarian.full_name : null,
          ]
            .filter(Boolean)
            .join(' · ') || undefined
        }
        last={index === items.length - 1}
      />
    ),
    [items.length],
  );

  return (
    <MobileShell
      header={<AppHeader title="Desparasitaciones" onBack={back} />}
      contentStyle={styles.content}
    >
      <AsyncBoundary
        loading={loading && data === null}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyIcon="flask"
        emptyTitle="Sin desparasitaciones"
        emptyDescription="Esta mascota no tiene desparasitaciones registradas."
      >
        <FlatList
          data={items}
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
  content: { gap: 8 },
  list: { flex: 1 },
  listContent: { paddingBottom: 32 },
});
