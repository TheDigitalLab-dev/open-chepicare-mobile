import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Button } from '@/components/ui';
import { ClinicEventCard } from '@/components/domain';
import type { OwnerHomeStackParamList } from '@/navigation/types';
import { useOwnerEvents } from '@/hooks/useOwnerEvents';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import type { ClinicEvent } from '@/types/events';
import { eventScheduleLabel, eventSpotsLabel } from '@/utils/clinicEvents';

type Nav = NativeStackNavigationProp<OwnerHomeStackParamList>;

/** Eventos próximos de la clínica (jornadas, ferias, charlas) con sus cupos. */
export function OwnerEventsScreen() {
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const { events, loading, error, reload } = useOwnerEvents();

  // Al volver del detalle (tras inscribirse o cancelar) los cupos se ponen al día.
  useReloadOnFocus(reload);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ClinicEvent>) => (
      <ClinicEventCard
        title={item.title}
        scheduleLabel={eventScheduleLabel(item.starts_at, item.ends_at)}
        location={item.location}
        imageUrl={item.image_url}
        spotsLabel={eventSpotsLabel(item)}
        spotsVariant={item.is_full ? 'destructive' : 'info'}
        registered={item.my_registration !== null}
        onPress={() => navigation.navigate('OwnerEventDetail', { id: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <MobileShell
      header={<AppHeader title="Eventos" onBack={back} />}
      contentStyle={styles.content}
    >
      <Button
        label="Mis inscripciones"
        variant="outline"
        size="md"
        onPress={() => navigation.navigate('OwnerEventRegistrations')}
      />
      <AsyncBoundary
        loading={loading && events.length === 0}
        error={error}
        onRetry={reload}
        empty={events.length === 0}
        emptyIcon="calendar-clear-outline"
        emptyTitle="Sin eventos próximos"
        emptyDescription="Cuando la clínica publique un evento lo verás aquí."
      >
        <FlatList
          data={events}
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
