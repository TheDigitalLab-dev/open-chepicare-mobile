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
import { splitAppointments } from '@/utils/appointmentGroups';
import { formatDate, formatDateTime, formatMoney } from '@/utils/format';
import {
  APPOINTMENT_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  type Appointment,
  type Payment,
  type PaymentStatus,
} from '@/types/models';

type Nav = NativeStackNavigationProp<OwnerHomeStackParamList>;
type TabNav = BottomTabNavigationProp<OwnerTabParamList>;

const PAYABLE: PaymentStatus[] = ['pending', 'overdue'];

/** Pagos por registrar, el que vence antes primero (sin fecha, al final). */
function payablePayments(payments: readonly Payment[]): Payment[] {
  const due = (p: Payment) => p.due_date ?? '9999-12-31';
  return payments
    .filter((p) => PAYABLE.includes(p.status))
    .sort((a, b) => due(a).localeCompare(due(b)));
}

function NextAppointment({ appointment }: { appointment: Appointment }) {
  const navigation = useNavigation<Nav>();
  const vet = appointment.assigned_to
    ? `${appointment.assigned_to.first_name} ${appointment.assigned_to.last_name}`
    : undefined;
  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>Próxima cita</SectionTitle>
      <AppointmentCard
        petName={appointment.pet?.name ?? 'Mascota'}
        dateLabel={formatDateTime(appointment.scheduled_at, appointment.time_zone)}
        vetName={vet}
        statusLabel={APPOINTMENT_STATUS_LABEL[appointment.status]}
        statusVariant={appointment.status === 'confirmed' ? 'success' : 'warning'}
        onPress={() =>
          navigation.getParent<TabNav>()?.navigate('AppointmentsTab', {
            screen: 'AppointmentDetail',
            params: { id: appointment.id },
            initial: false,
          })
        }
      />
    </View>
  );
}

function PendingPayment({ payment }: { payment: Payment }) {
  const navigation = useNavigation<Nav>();
  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>Pagos pendientes</SectionTitle>
      <PaymentCard
        concept={payment.pet_name ?? 'Pago'}
        amountLabel={formatMoney(payment.amount, payment.currency)}
        statusLabel={PAYMENT_STATUS_LABEL[payment.status]}
        statusVariant="warning"
        // `due_date` es un día de calendario: sin conversión de zona.
        dueLabel={`Vence: ${formatDate(payment.due_date)}`}
        onRegister={() => navigation.navigate('OwnerPaymentRegister', { id: payment.id })}
      />
    </View>
  );
}

function QuickActions() {
  const navigation = useNavigation<Nav>();
  const goToTab = (tab: keyof OwnerTabParamList) =>
    navigation.getParent<TabNav>()?.navigate(tab);
  return (
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
          {
            id: 'sponsorships',
            label: 'Apadrinamientos',
            icon: 'heart',
            onPress: () => navigation.navigate('OwnerSponsorships'),
          },
        ]}
      />
    </View>
  );
}

export function OwnerDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const pets = useAsync(() => listPets());
  const appointments = useAsync(() => listAppointments());
  const payments = useAsync(() => listPayments());
  const { reload: reloadPets } = pets;
  const { reload: reloadAppointments } = appointments;
  const { reload: reloadPayments } = payments;

  const reloadAll = useCallback(() => {
    void reloadPets();
    void reloadAppointments();
    void reloadPayments();
  }, [reloadPets, reloadAppointments, reloadPayments]);

  useFocusEffect(reloadAll);

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

  const { upcoming } = splitAppointments(appointments.data ?? []);
  const pendingPayments = payablePayments(payments.data ?? []);
  const all = [pets, appointments, payments];
  const loading = all.some((s) => s.loading && s.data === null);
  const error = all.find((s) => s.error)?.error ?? null;

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

      <AsyncBoundary loading={loading} error={error} onRetry={reloadAll}>
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard value={(pets.data ?? []).length} label="Mascotas" />
            <StatCard value={upcoming.length} label="Citas próximas" />
            <StatCard value={pendingPayments.length} label="Pagos pendientes" />
          </View>
          {upcoming[0] ? <NextAppointment appointment={upcoming[0]} /> : null}
          {pendingPayments[0] ? <PendingPayment payment={pendingPayments[0]} /> : null}
        </View>
      </AsyncBoundary>

      <QuickActions />
    </MobileShell>
  );
}
