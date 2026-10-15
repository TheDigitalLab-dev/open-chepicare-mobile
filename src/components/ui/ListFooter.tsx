import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import type { ApiError } from '@/types/api';
import { Button } from './Button';

export interface ListFooterProps {
  /** Cargando la página siguiente. */
  loading: boolean;
  /** Error al cargar la página siguiente (la lista ya cargada se conserva). */
  error?: ApiError | null;
  onRetry?: () => void;
}

/** Pie de las listas con scroll infinito: spinner o error con reintento. */
export function ListFooter({ loading, error, onRetry }: ListFooterProps) {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={styles.box}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.box}>
        <Text style={[styles.text, { color: colors.mutedForeground }]}>
          {error.message}
        </Text>
        {onRetry ? (
          <Button label="Reintentar" variant="outline" size="sm" onPress={onRetry} />
        ) : null}
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  text: { fontSize: 14, textAlign: 'center' },
});
