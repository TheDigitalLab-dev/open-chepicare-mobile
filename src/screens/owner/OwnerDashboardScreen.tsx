import { useCallback, useEffect } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, SectionTitle } from '@/components/ui';
import {
  ActionTileGrid,
  AppointmentCard,
  HeroCard,
  NotificationsBell,
  PaymentCard,
  StatCard,
} from '@/components/domain';
import type { OwnerHomeStackParamList, OwnerTabParamList } from '@/navigation/types';
import { useAuth } from '@/hooks/useAuth';
import { useAsync } from '@/hooks/useAsync';
import { listPets } from '@/services/pets';
import { listAppointments } from '@/services/appointments';
import { listPayments } from '@/services/payments';
import { syncReminders } from '@/services/reminderAlarms';
import { useChangeAlerts } from '@/hooks/useChangeAlerts';
import {
  ownerAppointmentAlerts,
  ownerPaymentAlerts,
} from '@/services/changeAlertConfigs';
import { appointmentReminders, pendingPaymentReminders } from '@/utils/reminders';
import { formatDateTime, formatMoney } from '@/utils/format';
import {
  APPOINTMENT_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  type AppointmentStatus,
} from '@/types/models';

type Nav = NativeStackNavigationProp<OwnerHomeStackParamList>;

const UPCOMING: AppointmentStatus[] = ['pending', 'confirmed', 'in_progress'];

export function OwnerDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const pets = useAsync(() => listPets());
  const appointments = useAsync(() => listAppointments());
  const payments = useAsync(() => listPayments());

  useFocusEffect(
    useCallback(() => {
      void pets.reload();
      void appointments.reload();
      void payments.reload();
    }, [pets.reload, appointments.reload, payments.reload]),
  );

  // O1 del plan: recordatorios locales (24 h y 2 h antes) de las citas ya
  // sincronizadas. Identificadores estables: reprogramar reemplaza, no duplica.
  useEffect(() => {
    if (!appointments.data) return;
    void syncReminders(
      'appt-',
      appointmentReminders(appointments.data, new Date().toISOString()),
    );
  }, [appointments.data]);

  // O8: recordatorio local (mañana 10:00) de pagos pendientes o vencidos.
  useEffect(() => {
    if (!payments.data) return;
    void syncReminders(
      'pay-',
      pendingPaymentReminders(payments.data, new Date().toISOString()),
    );
  }, [payments.data]);

  // O2/O7: cambios de estado de citas y pagos al centro de notificaciones.
  useChangeAlerts(appointments.data, ownerAppointmentAlerts);
  useChangeAlerts(payments.data, ownerPaymentAlerts);

  const upcoming = (appointments.data ?? []).filter((a) => UPCOMING.includes(a.status));
  const nextAppointment = upcoming[0];
  const pendingPayments = (payments.data ?? []).filter(
    (p) => p.status === 'pending' || p.status === 'overdue',
  );
  const firstPending = pendingPayments[0];

  const goToTab = (tab: keyof OwnerTabParamList) =>
    navigation.getParent<BottomTabNavigationProp<OwnerTabParamList>>()?.navigate(tab);

  const loading =
    (pets.loading && pets.data === null) ||
    (appointments.loading && appointments.data === null) ||
    (payments.loading && payments.data === null);
  const error = pets.error ?? appointments.error ?? payments.error;

  return (
    <MobileShell
      scroll
      header={
        <AppHeader
          title="Inicio"
          rightAction={
            <NotificationsBell onPress={() => navigation.navigate('Notifications')} />
          }
        />
      }
      contentStyle={{ gap: 16, paddingBottom: 32 }}
    >
      <HeroCard
        title={`Hola, ${user?.first_name ?? ''}`.trim()}
        subtitle="Bienvenido a Pawcare. Aquí tienes un resumen de tus mascotas."
      />

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={() => {
          void pets.reload();
          void appointments.reload();
          void payments.reload();
        }}
      >
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard value={(pets.data ?? []).length} label="Mascotas" />
            <StatCard value={upcoming.length} label="Citas próximas" />
            <StatCard value={pendingPayments.length} label="Pagos pendientes" />
          </View>

          {nextAppointment ? (
            <View style={{ gap: 8 }}>
              <SectionTitle>Próxima cita</SectionTitle>
              <AppointmentCard
                petName={nextAppointment.pet?.name ?? 'Mascota'}
                dateLabel={formatDateTime(
                  nextAppointment.scheduled_at,
                  nextAppointment.time_zone,
                )}
                vetName={
                  nextAppointment.assigned_to
                    ? `${nextAppointment.assigned_to.first_name} ${nextAppointment.assigned_to.last_name}`
                    : undefined
                }
                statusLabel={APPOINTMENT_STATUS_LABEL[nextAppointment.status]}
                statusVariant={
                  nextAppointment.status === 'confirmed' ? 'success' : 'warning'
                }
                onPress={() => goToTab('AppointmentsTab')}
              />
            </View>
          ) : null}

          {firstPending ? (
            <View style={{ gap: 8 }}>
              <SectionTitle>Pagos pendientes</SectionTitle>
              <PaymentCard
                concept={firstPending.pet_name ?? 'Pago'}
                amountLabel={formatMoney(firstPending.amount, firstPending.currency)}
                statusLabel={PAYMENT_STATUS_LABEL[firstPending.status]}
                statusVariant="warning"
                dueLabel={`Vence: ${formatDateTime(firstPending.due_date)}`}
                onRegister={() =>
                  navigation.navigate('OwnerPaymentRegister', { id: firstPending.id })
                }
              />
            </View>
          ) : null}
        </View>
      </AsyncBoundary>

      <View style={{ gap: 8 }}>
        <SectionTitle>Accesos rápidos</SectionTitle>
        <ActionTileGrid
          tiles={[
            {
              id: 'pets',
              label: 'Mis mascotas',
              icon: 'paw',
              onPress: () => goToTab('PetsTab'),
            },
            {
              id: 'appointments',
              label: 'Citas',
              icon: 'calendar',
              onPress: () => goToTab('AppointmentsTab'),
            },
            {
              id: 'history',
              label: 'Historial',
              icon: 'document-text',
              onPress: () => navigation.navigate('OwnerMedicalHistory'),
            },
            {
              id: 'payments',
              label: 'Pagos',
              icon: 'card',
              onPress: () => navigation.navigate('OwnerPayments'),
            },
          ]}
        />
      </View>
    </MobileShell>
  );
}
