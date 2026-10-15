import { useState } from 'react';
import { canReschedule } from '@/utils/appointmentGroups';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Alert, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import {
  AsyncBoundary,
  Badge,
  Button,
  Card,
  SectionTitle,
  type BadgeVariant,
} from '@/components/ui';
import type {
  OwnerAppointmentsStackParamList,
  OwnerTabParamList,
} from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import {
  cancelAppointment,
  confirmAppointment,
  getAppointment,
} from '@/services/appointments';
import { ApiError } from '@/types/api';
import { formatDate, formatDateTime, formatMoney } from '@/utils/format';
import {
  APPOINTMENT_PAYMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  type Appointment,
  type AppointmentPayment,
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

/** Pagos que el propietario puede registrar (el backend rechaza el resto). */
const PAYABLE = ['pending', 'overdue'];

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

function PaymentRow({ payment }: { payment: AppointmentPayment }) {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  // Registrar el pago vive en la pestaña Inicio.
  const pay = () =>
    navigation
      .getParent<BottomTabNavigationProp<OwnerTabParamList>>()
      ?.navigate('HomeTab', {
        screen: 'OwnerPaymentRegister',
        params: { id: payment.id },
      });
  return (
    <Card style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
          {formatMoney(payment.amount, payment.currency)}
        </Text>
        <Badge
          label={PAYMENT_STATUS_LABEL[payment.status]}
          variant={payment.status === 'completed' ? 'success' : 'warning'}
        />
      </View>
      <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
        {payment.status === 'completed'
          ? `Pagado: ${formatDate(payment.paid_at)}`
          : `Vence: ${formatDate(payment.due_date)}`}
      </Text>
      {PAYABLE.includes(payment.status) ? (
        <Button label="Registrar pago" variant="outline" fullWidth onPress={pay} />
      ) : null}
    </Card>
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
  const navigation = useNavigation<Nav>();
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
        onPress: () =>
          void run(() =>
            cancelAppointment(appointment.id, 'Cancelada por el propietario'),
          ),
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
        <Row
          label="Fecha"
          value={formatDateTime(appointment.scheduled_at, appointment.time_zone)}
        />
        {appointment.cancellation_reason ? (
          <Row label="Motivo de cancelación" value={appointment.cancellation_reason} />
        ) : null}
      </Card>

      {appointment.notes ? (
        <Card>
          <Text style={{ fontSize: 14, color: colors.foreground }}>
            {appointment.notes}
          </Text>
        </Card>
      ) : null}

      {(appointment.payments ?? []).length > 0 ? (
        <View style={{ gap: 8 }}>
          <SectionTitle>Pagos</SectionTitle>
          {(appointment.payments ?? []).map((p) => (
            <PaymentRow key={p.id} payment={p} />
          ))}
        </View>
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
          {canReschedule(appointment, new Date().toISOString()) ? (
            <Button
              label="Reprogramar"
              variant="outline"
              fullWidth
              disabled={busy}
              onPress={() =>
                navigation.navigate('AppointmentWizard', { id: appointment.id })
              }
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

  // Al volver de reprogramar o de registrar el pago, se muestra lo actual.
  // (La primera vez ya carga useAsync.)
  useReloadOnFocus(reload);

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
