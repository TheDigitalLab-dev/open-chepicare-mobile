import { Image } from 'expo-image';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Badge, Button, Card, InfoBanner } from '@/components/ui';
import type { OwnerHomeStackParamList } from '@/navigation/types';
import { useOwnerEvent } from '@/hooks/useOwnerEvent';
import type { ClinicEvent } from '@/types/events';
import {
  eventScheduleLabel,
  eventSpotsLabel,
  registeredCountLabel,
  type EventRegistrationState,
} from '@/utils/clinicEvents';
import { formatClinicDateTime } from '@/utils/clinicTime';

type Nav = NativeStackNavigationProp<OwnerHomeStackParamList>;

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const STATE_BANNER: Partial<
  Record<
    EventRegistrationState,
    { message: string; tone: 'success' | 'warning' | 'destructive' }
  >
> = {
  registered: { message: 'Estás inscrito en este evento.', tone: 'success' },
  full: { message: 'Cupo completo: ya no se aceptan inscripciones.', tone: 'warning' },
  closed: {
    message: 'Las inscripciones de este evento están cerradas.',
    tone: 'warning',
  },
  cancelled: { message: 'La clínica canceló este evento.', tone: 'destructive' },
};

interface ActionsProps {
  state: EventRegistrationState;
  mutating: boolean;
  onRegister: () => void;
  onCancel: () => void;
}

function Actions({ state, mutating, onRegister, onCancel }: ActionsProps) {
  const { colors } = useTheme();
  if (state === 'open') {
    return (
      <View style={styles.actions}>
        <Button
          label="Inscribirme"
          fullWidth
          loading={mutating}
          disabled={mutating}
          onPress={onRegister}
        />
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Te inscribimos con los datos de tu cuenta.
        </Text>
      </View>
    );
  }
  if (state === 'registered') {
    return (
      <Button
        label="Cancelar inscripción"
        variant="outline"
        fullWidth
        loading={mutating}
        disabled={mutating}
        onPress={onCancel}
      />
    );
  }
  if (state === 'full') {
    return <Button label="Cupo completo" fullWidth disabled />;
  }
  return null;
}

function EventBody({ event }: { event: ClinicEvent }) {
  const { colors } = useTheme();
  return (
    <>
      {event.image_url ? (
        <Image
          source={{ uri: event.image_url }}
          style={styles.image}
          contentFit="cover"
          transition={150}
          accessibilityLabel={`Imagen de ${event.title}`}
        />
      ) : null}
      <View style={styles.titleBlock}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.foreground }]}
        >
          {event.title}
        </Text>
        <View style={styles.badges}>
          <Badge
            label={eventSpotsLabel(event)}
            variant={event.is_full ? 'destructive' : 'info'}
          />
        </View>
      </View>
      <Card style={styles.card}>
        <Row label="Cuándo" value={eventScheduleLabel(event.starts_at, event.ends_at)} />
        {event.location ? <Row label="Dónde" value={event.location} /> : null}
        <Row
          label="Inscritos"
          value={registeredCountLabel(event.registered_count, event.capacity)}
        />
        <Row
          label="Inscripciones hasta"
          value={formatClinicDateTime(event.registration_closes_at)}
        />
      </Card>
      {event.description ? (
        <Text style={[styles.description, { color: colors.foreground }]}>
          {event.description}
        </Text>
      ) : null}
    </>
  );
}

/** Detalle de un evento: cupos, inscripción de un toque y cancelación. */
export function OwnerEventDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<OwnerHomeStackParamList, 'OwnerEventDetail'>>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const {
    event,
    state,
    loading,
    error,
    reload,
    mutating,
    actionError,
    register,
    cancel,
  } = useOwnerEvent(params.id);

  const confirmCancel = () => {
    Alert.alert('Cancelar inscripción', '¿Seguro que deseas cancelar tu inscripción?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => void cancel() },
    ]);
  };

  const banner = state ? STATE_BANNER[state] : undefined;

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Evento" onBack={back} />}
      contentStyle={styles.content}
    >
      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        {event && state ? (
          <>
            <EventBody event={event} />
            {banner ? <InfoBanner message={banner.message} tone={banner.tone} /> : null}
            {actionError ? (
              <InfoBanner message={actionError.message} tone="destructive" />
            ) : null}
            <Actions
              state={state}
              mutating={mutating}
              onRegister={() => void register()}
              onCancel={confirmCancel}
            />
            <Button
              label="Mis inscripciones"
              variant="ghost"
              onPress={() => navigation.navigate('OwnerEventRegistrations')}
            />
          </>
        ) : null}
      </AsyncBoundary>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingBottom: 32 },
  image: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12 },
  titleBlock: { gap: 8 },
  title: { fontSize: 22, fontWeight: '700' },
  badges: { flexDirection: 'row', gap: 8 },
  card: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontSize: 14 },
  rowValue: { flexShrink: 1, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  description: { fontSize: 15, lineHeight: 22 },
  actions: { gap: 8 },
  hint: { fontSize: 13, textAlign: 'center' },
});
