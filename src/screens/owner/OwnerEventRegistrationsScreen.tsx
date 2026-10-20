import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Alert, FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, InfoBanner } from '@/components/ui';
import { EventRegistrationRow } from '@/components/domain';
import type { OwnerHomeStackParamList } from '@/navigation/types';
import { useMyEventRegistrations } from '@/hooks/useMyEventRegistrations';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import type { EventRegistration } from '@/types/events';
import {
  canCancelRegistration,
  eventScheduleLabel,
  registrationStatusLabel,
} from '@/utils/clinicEvents';

type Nav = NativeStackNavigationProp<OwnerHomeStackParamList>;

/** "Mis inscripciones": activas y canceladas, con cancelar desde la lista. */
export function OwnerEventRegistrationsScreen() {
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const { registrations, loading, error, reload, cancellingId, actionError, cancel } =
    useMyEventRegistrations();

  useReloadOnFocus(reload);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<EventRegistration>) => (
      <EventRegistrationRow
        title={item.event.title}
        scheduleLabel={eventScheduleLabel(item.event.starts_at, item.event.ends_at)}
        statusLabel={registrationStatusLabel(item)}
        active={item.status === 'active'}
        canCancel={canCancelRegistration(item)}
        cancelling={cancellingId === item.id}
        onOpen={() => navigation.navigate('OwnerEventDetail', { id: item.event.id })}
        onCancel={() =>
          Alert.alert(
            'Cancelar inscripción',
            `¿Seguro que deseas cancelar tu inscripción en «${item.event.title}»?`,
            [
              { text: 'No', style: 'cancel' },
              {
                text: 'Sí, cancelar',
                style: 'destructive',
                onPress: () => void cancel(item.id),
              },
            ],
          )
        }
      />
    ),
    [navigation, cancellingId, cancel],
  );

  return (
    <MobileShell
      header={<AppHeader title="Mis inscripciones" onBack={back} />}
      contentStyle={styles.content}
    >
      {actionError ? (
        <InfoBanner message={actionError.message} tone="destructive" />
      ) : null}
      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        empty={registrations.length === 0}
        emptyIcon="ticket-outline"
        emptyTitle="Sin inscripciones"
        emptyDescription="Cuando te inscribas en un evento de la clínica aparecerá aquí."
      >
        <FlatList
          data={registrations}
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
  content: { gap: 12 },
  list: { flex: 1 },
  listContent: { gap: 8, paddingBottom: 32 },
});
