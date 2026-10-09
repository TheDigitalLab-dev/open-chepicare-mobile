import { useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Alert, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Badge, Button, Card, type BadgeVariant } from '@/components/ui';
import type { OwnerAppointmentsStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import {
  cancelAppointment,
  confirmAppointment,
  getAppointment,
} from '@/services/appointments';
import { ApiError } from '@/types/api';
import { formatDateTime } from '@/utils/format';
import {
  APPOINTMENT_PAYMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_LABEL,
  type Appointment,
  type AppointmentStatus,
} from '@/types/models';

type Nav = NativeStackNavigationProp<OwnerAppointmentsStackParamList>;

const STATUS_VARIANT: Record<AppointmentStatus, BadgeVariant> = {
  pending: 'warning',
  confirmed: 'success',
  in_progress: 'primary',
  completed: 'primary',
  cancelled: 'destructive',
  rescheduled: 'warning',
};

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ fontSize: 14, color: colors.mutedForeground }}>{label}</Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.foreground,
          flexShrink: 1,
          textAlign: 'right',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function Details({
  appointment,
  onChanged,
}: {
  appointment: Appointment;
  onChanged: () => Promise<void>;
}) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const status = appointment.status;
  const active = status === 'pending' || status === 'confirmed';

  const vet = appointment.assigned_to
    ? `${appointment.assigned_to.first_name} ${appointment.assigned_to.last_name}`.trim()
    : '—';

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await onChanged();
    } catch (e) {
      // El backend explica el rechazo (p. ej. transición de estado no permitida).
      Alert.alert(
        'Error',
        e instanceof ApiError
          ? e.message
          : 'No se pudo completar la acción. Inténtalo de nuevo.',
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmCancel = () => {
    Alert.alert('Cancelar cita', '¿Seguro que deseas cancelar esta cita?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: () => void run(() => cancelAppointment(appointment.id)),
      },
    ]);
  };

  return (
    <>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Badge
          label={APPOINTMENT_STATUS_LABEL[status]}
          variant={STATUS_VARIANT[status]}
        />
        <Badge
          label={APPOINTMENT_PAYMENT_STATUS_LABEL[appointment.payment_status]}
          variant={appointment.payment_status === 'paid' ? 'success' : 'warning'}
        />
      </View>

      <Card style={{ gap: 10 }}>
        <Row label="Mascota" value={appointment.pet?.name ?? '—'} />
        <Row label="Veterinario" value={vet} />
        <Row label="Servicio" value={appointment.service?.name ?? '—'} />
        <Row label="Fecha" value={formatDateTime(appointment.scheduled_at)} />
      </Card>

      {appointment.notes ? (
        <Card>
          <Text style={{ fontSize: 14, color: colors.foreground }}>
            {appointment.notes}
          </Text>
        </Card>
      ) : null}

      {active ? (
        <View style={{ gap: 12 }}>
          {status === 'pending' ? (
            <Button
              label="Confirmar"
              fullWidth
              loading={busy}
              onPress={() => void run(() => confirmAppointment(appointment.id))}
            />
          ) : null}
          <Button
            label="Cancelar cita"
            variant="destructive"
            fullWidth
            disabled={busy}
            onPress={confirmCancel}
          />
        </View>
      ) : null}
    </>
  );
}

export function AppointmentDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route =
    useRoute<RouteProp<OwnerAppointmentsStackParamList, 'AppointmentDetail'>>();
  const id = route.params.id;
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data, loading, error, reload } = useAsync(() => getAppointment(id));

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Detalle de cita" onBack={back} />}
      contentStyle={{ gap: 16, paddingBottom: 32 }}
    >
      <AsyncBoundary loading={loading && data === null} error={error} onRetry={reload}>
        {data ? <Details appointment={data} onChanged={reload} /> : null}
      </AsyncBoundary>
    </MobileShell>
  );
}
