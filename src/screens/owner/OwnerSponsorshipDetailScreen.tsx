import { useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Alert, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Badge, Button, Card, SectionTitle } from '@/components/ui';
import type { OwnerHomeStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { cancelSponsorship, getSponsorship } from '@/services/sponsorships';
import { ApiError } from '@/types/api';
import { formatDate, formatMoney } from '@/utils/format';
import {
  APPOINTMENT_PAYMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_LABEL,
  SPONSORSHIP_RECURRENCE_LABEL,
  SPONSORSHIP_STATUS_LABEL,
  type Sponsorship,
  type SponsorshipExpense,
} from '@/types/models';

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

function ExpenseRow({ expense }: { expense: SponsorshipExpense }) {
  const { colors } = useTheme();
  return (
    <Card style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: colors.foreground,
            flexShrink: 1,
          }}
        >
          {expense.service ?? expense.description ?? 'Gasto'}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground }}>
          {formatMoney(expense.price, expense.currency)}
        </Text>
      </View>
      <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
        {`${formatDate(expense.date)} · ${APPOINTMENT_STATUS_LABEL[expense.status]} · ${
          APPOINTMENT_PAYMENT_STATUS_LABEL[expense.payment_status] ?? 'Sin pagar'
        }`}
      </Text>
    </Card>
  );
}

function Body({
  sponsorship,
  onChanged,
}: {
  sponsorship: Sponsorship;
  onChanged: () => Promise<void>;
}) {
  const { colors } = useTheme();
  const [cancelling, setCancelling] = useState(false);
  const expenses = sponsorship.expenses ?? [];

  const cancel = async () => {
    setCancelling(true);
    try {
      await cancelSponsorship(sponsorship.id);
      await onChanged();
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof ApiError ? e.message : 'No se pudo cancelar el apadrinamiento.',
      );
    } finally {
      setCancelling(false);
    }
  };

  const confirmCancel = () =>
    Alert.alert(
      'Cancelar apadrinamiento',
      `¿Seguro que deseas dejar de apadrinar a ${sponsorship.pet?.name ?? 'esta mascota'}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: () => void cancel() },
      ],
    );

  return (
    <>
      <Card style={{ gap: 10 }}>
        <Row label="Mascota" value={sponsorship.pet?.name ?? '—'} />
        <Row label="Monto" value={formatMoney(sponsorship.amount)} />
        {sponsorship.recurrence ? (
          <Row
            label="Recurrencia"
            value={SPONSORSHIP_RECURRENCE_LABEL[sponsorship.recurrence]}
          />
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 14, color: colors.mutedForeground }}>Estado</Text>
          <Badge
            label={SPONSORSHIP_STATUS_LABEL[sponsorship.status]}
            variant={sponsorship.status === 'active' ? 'success' : 'outline'}
          />
        </View>
        <Row label="Inicio" value={formatDate(sponsorship.start_date)} />
        <Row label="Fin" value={formatDate(sponsorship.end_date)} />
      </Card>

      {sponsorship.notes ? (
        <Card>
          <Text style={{ fontSize: 14, color: colors.foreground }}>
            {sponsorship.notes}
          </Text>
        </Card>
      ) : null}

      <View style={{ gap: 8 }}>
        <SectionTitle>Gastos de la mascota</SectionTitle>
        {expenses.length === 0 ? (
          <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
            Todavía no hay gastos registrados.
          </Text>
        ) : (
          expenses.map((e) => <ExpenseRow key={e.id} expense={e} />)
        )}
      </View>

      {sponsorship.status === 'active' ? (
        <Button
          label="Cancelar apadrinamiento"
          variant="destructive"
          fullWidth
          loading={cancelling}
          onPress={confirmCancel}
        />
      ) : null}
    </>
  );
}

export function OwnerSponsorshipDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<OwnerHomeStackParamList, 'OwnerSponsorshipDetail'>>();
  const id = route.params.id;
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data, loading, error, reload } = useAsync(() => getSponsorship(id));

  return (
    <MobileShell
      scroll
      header={<AppHeader title={data?.pet?.name ?? 'Apadrinamiento'} onBack={back} />}
      contentStyle={{ gap: 16, paddingBottom: 32 }}
    >
      <AsyncBoundary loading={loading && data === null} error={error} onRetry={reload}>
        {data ? <Body sponsorship={data} onChanged={reload} /> : null}
      </AsyncBoundary>
    </MobileShell>
  );
}
