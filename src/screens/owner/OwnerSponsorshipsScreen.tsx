import { useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Badge } from '@/components/ui';
import { ListRow } from '@/components/domain';
import type { OwnerHomeStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import { syncReminders } from '@/services/reminderAlarms';
import { sponsorshipReminders } from '@/utils/reminders';
import { listSponsorships } from '@/services/sponsorships';
import { formatMoney } from '@/utils/format';
import {
  SPONSORSHIP_RECURRENCE_LABEL,
  SPONSORSHIP_STATUS_LABEL,
  type Sponsorship,
} from '@/types/models';

type Nav = NativeStackNavigationProp<OwnerHomeStackParamList>;

export function OwnerSponsorshipsScreen() {
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const { data, loading, error, reload } = useAsync(() => listSponsorships());

  // Al volver del detalle (p. ej. tras cancelar) se muestra el estado actual.
  useReloadOnFocus(reload);

  // O10 del plan: aviso 5 días antes del vencimiento del apadrinamiento.
  useEffect(() => {
    if (!data) return;
    void syncReminders('sponsor-', sponsorshipReminders(data, new Date().toISOString()));
  }, [data]);
  const items = data ?? [];

  const renderItem = useCallback(
    ({ item: s }: ListRenderItemInfo<Sponsorship>) => (
      <ListRow
        title={s.pet?.name ?? `Apadrinamiento #${s.id}`}
        subtitle={
          s.recurrence
            ? `${formatMoney(s.amount)} · ${SPONSORSHIP_RECURRENCE_LABEL[s.recurrence]}`
            : formatMoney(s.amount)
        }
        leading={() => (
          <Badge
            label={SPONSORSHIP_STATUS_LABEL[s.status]}
            variant={s.status === 'active' ? 'success' : 'outline'}
          />
        )}
        onPress={() => navigation.navigate('OwnerSponsorshipDetail', { id: s.id })}
      />
    ),
    [navigation],
  );

  return (
    <MobileShell
      header={<AppHeader title="Apadrinamientos" onBack={back} />}
      contentStyle={styles.content}
    >
      <AsyncBoundary
        loading={loading && data === null}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyIcon="heart"
        emptyTitle="Sin apadrinamientos"
        emptyDescription="Aún no apadrinas a ninguna mascota."
      >
        <FlatList
          data={items}
          keyExtractor={(s) => String(s.id)}
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
