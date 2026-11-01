import { useCallback, useEffect, useMemo } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary } from '@/components/ui';
import { TimelineItem } from '@/components/domain';
import type { OwnerPetsStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { listVaccinations } from '@/services/medical';
import { LEGACY_VACCINATION_REMINDER, syncReminders } from '@/services/reminderAlarms';
import { vaccinationReminders } from '@/utils/reminders';
import { formatDate } from '@/utils/format';
import type { Vaccination } from '@/types/models';
import { vaccinationDueState } from '@/utils/vaccinationDue';
import { clinicToday } from '@/utils/clinicTime';

export function VaccinationsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<OwnerPetsStackParamList, 'Vaccinations'>>();
  const { petId } = route.params;
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data, loading, error, reload } = useAsync(() => listVaccinations(petId));
  const items = useMemo(() => data ?? [], [data]);
  const today = clinicToday();

  // O3 del plan: aviso local 3 días antes del vencimiento de la próxima dosis.
  useEffect(() => {
    if (!data) return;
    void syncReminders(
      `vacc-p${petId}-`,
      vaccinationReminders(data, new Date().toISOString(), petId),
      LEGACY_VACCINATION_REMINDER,
    );
  }, [data, petId]);

  const renderItem = useCallback(
    ({ item: v, index }: ListRenderItemInfo<Vaccination>) => (
      <TimelineItem
        tone={
          vaccinationDueState(v, items, today) === 'overdue' ? 'destructive' : 'success'
        }
        title={v.vaccine_name}
        date={formatDate(v.application_date)}
        description={
          [
            vaccinationDueState(v, items, today) === 'overdue'
              ? 'Próxima dosis vencida'
              : null,
            v.next_due_date ? `Próxima: ${formatDate(v.next_due_date)}` : null,
            v.veterinarian ? v.veterinarian.full_name : null,
          ]
            .filter(Boolean)
            .join(' · ') || undefined
        }
        last={index === items.length - 1}
      />
    ),
    [items, today],
  );

  return (
    <MobileShell
      header={<AppHeader title="Vacunas" onBack={back} />}
      contentStyle={styles.content}
    >
      <AsyncBoundary
        loading={loading && data === null}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyIcon="bandage"
        emptyTitle="Sin vacunas"
        emptyDescription="Esta mascota no tiene vacunas registradas."
      >
        <FlatList
          data={items}
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
  content: { gap: 8 },
  list: { flex: 1 },
  listContent: { paddingBottom: 32 },
});
