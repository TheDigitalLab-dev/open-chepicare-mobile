import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Badge, Button, type BadgeVariant } from '@/components/ui';
import { DetailHero, ListRow } from '@/components/domain';
import type { AdminMoreStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import { getAdminPayment } from '@/services/admin';
import { formatDate, formatMoney } from '@/utils/format';
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  type Payment,
  type PaymentStatus,
} from '@/types/models';

type Nav = NativeStackNavigationProp<AdminMoreStackParamList>;
type Rt = RouteProp<AdminMoreStackParamList, 'AdminPaymentDetail'>;

const STATUS_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  draft: 'outline',
  pending: 'warning',
  completed: 'success',
  overdue: 'destructive',
  cancelled: 'outline',
};

function Body({ payment }: { payment: Payment }) {
  const navigation = useNavigation<Nav>();
  const settled = payment.status === 'completed' || payment.status === 'cancelled';
  return (
    <>
      <DetailHero
        title={formatMoney(payment.amount, payment.currency)}
        subtitle={payment.pet_name ?? 'Pago'}
      >
        <Badge
          label={PAYMENT_STATUS_LABEL[payment.status]}
          variant={STATUS_VARIANT[payment.status]}
        />
      </DetailHero>

      <ListRow title="Mascota" subtitle={payment.pet_name ?? 'Sin asignar'} />
      <ListRow title="Dueño" subtitle={payment.owner_name ?? 'Sin asignar'} />
      <ListRow
        title="Método de pago"
        subtitle={
          payment.payment_method
            ? PAYMENT_METHOD_LABEL[payment.payment_method]
            : 'Sin especificar'
        }
      />
      <ListRow title="Vence" subtitle={formatDate(payment.due_date)} />
      <ListRow title="Pagado el" subtitle={formatDate(payment.paid_at)} />
      <ListRow title="Notas" subtitle={payment.notes ?? 'Sin notas'} />

      {!settled ? (
        <View style={{ marginTop: 8 }}>
          <Button
            label="Registrar pago"
            fullWidth
            onPress={() =>
              navigation.navigate('AdminPaymentRegister', { id: payment.id })
            }
          />
        </View>
      ) : null}
    </>
  );
}

export function AdminPaymentDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  // Por id (antes se buscaba en la primera página de la lista: un pago más
  // antiguo que los 25 últimos salía «no encontrado»). Se refresca al volver
  // de «Registrar pago» para no ofrecer de nuevo el botón.
  const {
    data: payment,
    loading,
    error,
    reload,
  } = useAsync(() => getAdminPayment(params.id));
  useReloadOnFocus(reload);
  const notFound = error?.kind === 'notFound';

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Detalle de pago" onBack={back} />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      <AsyncBoundary
        loading={loading && payment === null}
        error={notFound ? null : error}
        onRetry={reload}
        empty={notFound}
        emptyIcon="card"
        emptyTitle="Pago no encontrado"
      >
        {payment ? <Body payment={payment} /> : null}
      </AsyncBoundary>
    </MobileShell>
  );
}
