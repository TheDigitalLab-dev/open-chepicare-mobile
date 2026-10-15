import { useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import {
  AsyncBoundary,
  Button,
  Card,
  FilterChips,
  InfoBanner,
  SectionTitle,
  TextField,
} from '@/components';
import { useAsync } from '@/hooks/useAsync';
import { getProduct } from '@/services/public';
import {
  createProductOrder,
  requiresPaymentProof,
  type OrderPaymentMethod,
} from '@/services/orders';
import { ApiError } from '@/types/api';
import { formatMoney } from '@/utils/format';
import type { Product } from '@/types/models';
import type { PublicStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<PublicStackParamList>;
type Rt = RouteProp<PublicStackParamList, 'Checkout'>;

const PAYMENT_OPTIONS: { id: OrderPaymentMethod; label: string }[] = [
  { id: 'in_store', label: 'En tienda' },
  { id: 'transfer', label: 'Transferencia' },
  { id: 'mobile_payment', label: 'Pago móvil' },
];

function CheckoutForm({ product, quantity }: { product: Product; quantity: number }) {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();

  const stock = product.stock_quantity ?? Number.MAX_SAFE_INTEGER;
  const [qty, setQty] = useState(() =>
    Math.max(stock > 0 ? 1 : 0, Math.min(quantity, stock)),
  );
  const [payment, setPayment] = useState<OrderPaymentMethod>('in_store');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const unit = Number(product.sale_price);
  const total = unit * qty;

  // Sin existencias no se puede pedir (antes la cantidad arrancaba en 1).
  const canSubmit =
    stock > 0 &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    qty > 0 &&
    !submitting;

  const onSubmit = async () => {
    setSubmitting(true);
    setError(undefined);
    try {
      const order = await createProductOrder({
        contact_name: name.trim(),
        contact_email: email.trim(),
        contact_phone: phone.trim(),
        payment_method: payment,
        notes: notes.trim() || undefined,
        items: [{ product_id: product.id, quantity: qty }],
      });
      // `replace`: volver atrás no debe mostrar el formulario lleno (un segundo
      // «Confirmar» creaba otro pedido igual).
      if (requiresPaymentProof(payment)) {
        navigation.replace('UploadProof', { orderId: order.id });
      } else {
        navigation.navigate('PublicLanding');
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {error ? <InfoBanner tone="destructive" message={error} /> : null}

      <SectionTitle>Resumen del pedido</SectionTitle>
      <Card style={styles.summary}>
        <View style={styles.row}>
          <Text style={[styles.itemName, { color: colors.foreground }]}>
            {product.name}
          </Text>
          <Text style={{ color: colors.mutedForeground }}>{formatMoney(unit)}</Text>
        </View>

        <View style={styles.qtyRow}>
          <Text style={{ color: colors.foreground, fontWeight: '500' }}>Cantidad</Text>
          <View style={styles.stepper}>
            <Button
              label="−"
              variant="outline"
              disabled={qty <= 1}
              onPress={() => setQty((q) => Math.max(1, q - 1))}
            />
            <Text style={[styles.qty, { color: colors.foreground }]}>{qty}</Text>
            <Button
              label="+"
              variant="outline"
              disabled={qty >= stock}
              onPress={() => setQty((q) => Math.min(stock, q + 1))}
            />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.row}>
          <Text style={[styles.total, { color: colors.foreground }]}>Total</Text>
          <Text style={[styles.total, { color: colors.primary }]}>
            {formatMoney(total)}
          </Text>
        </View>
      </Card>

      <SectionTitle>Método de pago</SectionTitle>
      <FilterChips
        options={PAYMENT_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
        selectedId={payment}
        onSelect={(id) => setPayment(id as OrderPaymentMethod)}
      />

      <SectionTitle>Datos de contacto</SectionTitle>
      <TextField label="Nombre" value={name} onChangeText={setName} />
      <TextField
        label="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label="Teléfono"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextField
        label="Notas (opcional)"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <InfoBanner
        message={
          requiresPaymentProof(payment)
            ? 'Tras confirmar, podrás subir el comprobante de pago.'
            : 'Acércate a la tienda para completar el pago y recoger tu pedido.'
        }
      />

      <Button
        label="Confirmar pedido"
        fullWidth
        loading={submitting}
        disabled={!canSubmit}
        onPress={onSubmit}
        style={styles.submit}
      />
    </>
  );
}

export function CheckoutScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data, loading, error, reload } = useAsync(() => getProduct(params.productId));

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Pago" onBack={back} />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      <AsyncBoundary loading={loading && data === null} error={error} onRetry={reload}>
        {data ? <CheckoutForm product={data} quantity={params.quantity ?? 1} /> : null}
      </AsyncBoundary>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  summary: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qty: { fontSize: 16, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  itemName: { fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 },
  divider: { height: 1, marginVertical: 4 },
  total: { fontSize: 16, fontWeight: '700' },
  submit: { marginTop: 8 },
});
