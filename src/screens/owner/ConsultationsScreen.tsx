import { useCallback } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary } from '@/components/ui';
import { ListRow } from '@/components/domain';
import type { OwnerPetsStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { listConsultations } from '@/services/medical';
import { formatDate } from '@/utils/format';
import type { Consultation } from '@/types/models';

type Nav = NativeStackNavigationProp<OwnerPetsStackParamList>;

export function ConsultationsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<OwnerPetsStackParamList, 'Consultations'>>();
  const { petId } = route.params;
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data, loading, error, reload } = useAsync(() => listConsultations(petId));
  const items = data ?? [];

  const renderItem = useCallback(
    ({ item: c }: ListRenderItemInfo<Consultation>) => (
      <ListRow
        title={`${c.pet ? `${c.pet.name} — ` : ''}${c.anamnesis?.trim() || c.diagnosis?.trim() || 'Consulta'}`}
        subtitle={`Tutor: ${c.pet?.proprietary?.full_name ?? 'No registrado'}\n${formatDate(c.consultation_date)} · ${c.veterinarian.full_name}`}
        onPress={() => navigation.navigate('ConsultationDetail', { petId, id: c.id })}
      />
    ),
    [navigation, petId],
  );

  return (
    <MobileShell
      header={<AppHeader title="Consultas" onBack={back} />}
      contentStyle={styles.content}
    >
      <AsyncBoundary
        loading={loading && data === null}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyIcon="document-text"
        emptyTitle="Sin consultas"
        emptyDescription="Esta mascota no tiene consultas registradas."
      >
        <FlatList
          data={items}
          keyExtractor={(c) => String(c.id)}
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
