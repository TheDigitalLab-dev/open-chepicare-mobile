import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, type ListRenderItemInfo } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import {
  AsyncBoundary,
  FilterChips,
  ListFooter,
  type BadgeVariant,
} from '@/components/ui';
import { PaymentCard } from '@/components/domain';
import type { AdminMoreStackParamList } from '@/navigation/types';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useChangeAlerts } from '@/hooks/useChangeAlerts';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import { adminPaymentAlerts } from '@/services/changeAlertConfigs';
import { listAdminPayments, type AdminPaymentFilters } from '@/services/admin';
import { formatDate, formatMoney } from '@/utils/format';
import { PAYMENT_STATUS_LABEL, type Payment, type PaymentStatus } from '@/types/models';

type Nav = NativeStackNavigationProp<AdminMoreStackParamList>;

const STATUS_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  draft: 'outline',
  pending: 'warning',
  completed: 'success',
  overdue: 'destructive',
  cancelled: 'outline',
};

// Los filtros los aplica el servidor (antes se filtraban en el cliente solo
// los 25 pagos de la primera página).
const FILTER_PARAMS: Record<string, AdminPaymentFilters> = {
  all: {},
  pending: { status: 'pending' },
  completed: { status: 'completed' },
  overdue: { overdue: true },
  cancelled: { status: 'cancelled' },
};

const FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'completed', label: 'Pagados' },
  { id: 'overdue', label: 'Vencidos' },
  { id: 'cancelled', label: 'Cancelados' },
];

export function AdminPaymentsListScreen() {
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState('all');
  const { items, loading, loadingMore, error, moreError, reload, loadMore } =
    usePaginatedList(
      (page) => listAdminPayments(FILTER_PARAMS[filter] ?? {}, page),
      filter,
    );

  // A4 del plan: pagos nuevos por verificar al centro de notificaciones.
  useChangeAlerts(loading ? null : items, adminPaymentAlerts);

  useReloadOnFocus(reload);

  const renderItem = useCallback(
    ({ item: p }: ListRenderItemInfo<Payment>) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver pago ${p.pet_name ?? ''}`}
        testID={`admin-payment-${p.id}`}
        onPress={() => navigation.navigate('AdminPaymentDetail', { id: p.id })}
      >
        <PaymentCard
          concept={p.pet_name ?? 'Pago'}
          amountLabel={formatMoney(p.amount, p.currency)}
          statusLabel={PAYMENT_STATUS_LABEL[p.status]}
          statusVariant={STATUS_VARIANT[p.status]}
          dueLabel={p.due_date ? `Vence: ${formatDate(p.due_date)}` : undefined}
          onRegister={
            p.status === 'pending' || p.status === 'overdue'
              ? () => navigation.navigate('AdminPaymentRegister', { id: p.id })
              : undefined
          }
        />
      </Pressable>
    ),
    [navigation],
  );

  return (
    <MobileShell
      header={
        <AppHeader
          title="Pagos"
          onBack={navigation.canGoBack() ? navigation.goBack : undefined}
        />
      }
      contentStyle={styles.content}
    >
      <FilterChips options={FILTERS} selectedId={filter} onSelect={setFilter} />

      <AsyncBoundary
        loading={loading && items.length === 0}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyIcon="card"
        emptyTitle="Sin pagos"
        emptyDescription="No hay pagos para este filtro."
      >
        <FlatList
          testID="admin-payments-list"
          data={items}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <ListFooter loading={loadingMore} error={moreError} onRetry={loadMore} />
          }
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
  listContent: { gap: 12, paddingBottom: 32 },
});
