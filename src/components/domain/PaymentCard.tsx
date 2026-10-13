import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { Badge, Button, type BadgeVariant } from '@/components/ui';

export interface PaymentCardProps {
  concept: string;
  amountLabel: string;
  statusLabel: string;
  statusVariant?: BadgeVariant;
  dueLabel?: string;
  /** Acción "Registrar pago" inline (solo si está pendiente). */
  onRegister?: () => void;
}

export function PaymentCard({
  concept,
  amountLabel,
  statusLabel,
  statusVariant = 'warning',
  dueLabel,
  onRegister,
}: PaymentCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.base, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.concept, { color: colors.foreground }]}>{concept}</Text>
        <Badge label={statusLabel} variant={statusVariant} />
      </View>
      <Text style={[styles.amount, { color: colors.foreground }]}>{amountLabel}</Text>
      {dueLabel ? (
        <Text style={[styles.due, { color: colors.mutedForeground }]}>{dueLabel}</Text>
      ) : null}
      {onRegister ? (
        <Button
          label="Registrar pago"
          // Varias tarjetas en la lista: el lector de pantalla dice cuál.
          accessibilityLabel={`Registrar pago: ${[concept, amountLabel, dueLabel]
            .filter(Boolean)
            .join(', ')}`}
          variant="primary"
          size="sm"
          onPress={onRegister}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 4 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  concept: { flex: 1, fontSize: 15, fontWeight: '600' },
  amount: { fontSize: 20, fontWeight: '700' },
  due: { fontSize: 13 },
  action: { marginTop: 8, alignSelf: 'flex-start' },
});
