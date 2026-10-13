import { useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import {
  AsyncBoundary,
  Badge,
  Button,
  Card,
  FilterChips,
  InfoBanner,
  SectionTitle,
  TextField,
} from '@/components/ui';
import type { OwnerHomeStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { getPayment, registerPayment } from '@/services/payments';
import { ApiError } from '@/types/api';
import { formatDate, formatMoney } from '@/utils/format';
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  type Payment,
  type PaymentMethod,
  type PaymentStatus,
} from '@/types/models';

type Nav = NativeStackNavigationProp<OwnerHomeStackParamList>;

const METHOD_OPTIONS = (Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map(
  (id) => ({ id, label: PAYMENT_METHOD_LABEL[id] }),
);

function RegisterForm({ payment }: { payment: Payment }) {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const onSubmit = async () => {
    setSubmitting(true);
    setError(undefined);
    try {
      await registerPayment(payment.id, {
        payment_method: method,
        payment_reference: reference.trim() || undefined,
      });
      if (back) back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar el pago.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {error ? <InfoBanner tone="destructive" message={error} /> : null}

      <Card style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
            {payment.pet_name ?? 'Pago'}
          </Text>
          <Badge label={PAYMENT_STATUS_LABEL[payment.status]} variant="warning" />
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>
          {formatMoney(payment.amount, payment.currency)}
        </Text>
        <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
          Vence: {formatDate(payment.due_date)}
        </Text>
      </Card>

      <Items payment={payment} />

      <SectionTitle>Método de pago</SectionTitle>
      <FilterChips
        options={METHOD_OPTIONS}
        selectedId={method}
        onSelect={(id) => setMethod(id as PaymentMethod)}
      />

      <TextField
        label="Referencia"
        placeholder="N.º de referencia o transacción"
        value={reference}
        onChangeText={setReference}
        keyboardType="default"
        autoCapitalize="characters"
        autoCorrect={false}
      />

      <Button
        label="Registrar pago"
        fullWidth
        loading={submitting}
        onPress={onSubmit}
        style={{ marginTop: 8 }}
      />
    </>
  );
}

/** El backend solo acepta registrar pagos pendientes o vencidos. */
const PAYABLE: PaymentStatus[] = ['pending', 'overdue'];

function Items({ payment }: { payment: Payment }) {
  const { colors } = useTheme();
  const items = payment.items ?? [];
  if (items.length === 0) return null;
  return (
    <Card style={{ gap: 6 }}>
      {items.map((item) => (
        <View
          key={item.id}
          style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}
        >
          <Text style={{ fontSize: 14, color: colors.foreground, flexShrink: 1 }}>
            {`${item.quantity ?? 1} × ${item.description ?? 'Servicio'}`}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
            {formatMoney(item.total_price ?? 0, payment.currency)}
          </Text>
        </View>
      ))}
    </Card>
  );
}

/** Pago que ya no se puede registrar (pagado, borrador o cancelado). */
function PaymentSummary({ payment }: { payment: Payment }) {
  const { colors } = useTheme();
  const message =
    payment.status === 'completed'
      ? `Pagado el ${formatDate(payment.paid_at)}${
          payment.payment_method
            ? ` (${PAYMENT_METHOD_LABEL[payment.payment_method]})`
            : ''
        }.`
      : payment.status === 'draft'
        ? 'Este pago todavía no está listo para pagarse.'
        : 'Este pago fue cancelado.';
  return (
    <>
      <Card style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
            {payment.pet_name ?? 'Pago'}
          </Text>
          <Badge label={PAYMENT_STATUS_LABEL[payment.status]} variant="outline" />
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>
          {formatMoney(payment.amount, payment.currency)}
        </Text>
      </Card>
      <InfoBanner tone="info" message={message} />
      <Items payment={payment} />
    </>
  );
}

export function OwnerPaymentRegisterScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<OwnerHomeStackParamList, 'OwnerPaymentRegister'>>();
  const id = route.params.id;
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data, loading, error, reload } = useAsync(() => getPayment(id));

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Registrar pago" onBack={back} />}
      contentStyle={{ gap: 16, paddingBottom: 32 }}
    >
      <AsyncBoundary loading={loading && data === null} error={error} onRetry={reload}>
        {data && PAYABLE.includes(data.status) ? <RegisterForm payment={data} /> : null}
        {data && !PAYABLE.includes(data.status) ? (
          <PaymentSummary payment={data} />
        ) : null}
      </AsyncBoundary>
    </MobileShell>
  );
}
