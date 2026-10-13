import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { Button } from '@/components/ui';
import type { ServerChangeInfo } from '@/types/serverChange';
import { serverChangeExplanation } from '@/utils/serverChange';

export interface ServerChangeDialogProps {
  /** Cambio a confirmar; null oculta el diálogo. */
  change: ServerChangeInfo | null;
  /** Cerrando la sesión en el servidor anterior (tras confirmar). */
  leaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Explicación previa a cambiar de servidor. «Cancelar» es la opción por
 * defecto (primera, destacada y la del botón Atrás): no cambia nada.
 */
export function ServerChangeDialog({
  change,
  leaving,
  onCancel,
  onConfirm,
}: ServerChangeDialogProps) {
  const { colors } = useTheme();
  if (!change) return null;
  const text = serverChangeExplanation(change);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={leaving ? () => {} : onCancel}
    >
      <View style={styles.backdrop}>
        <View
          accessibilityViewIsModal
          style={[
            styles.dialog,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ScrollView contentContainerStyle={styles.body}>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: colors.foreground }]}
            >
              ¿Cambiar de servidor?
            </Text>

            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                Conectada ahora a
              </Text>
              <Text selectable style={[styles.value, { color: colors.foreground }]}>
                {text.current}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                Se cambiará a
              </Text>
              <Text selectable style={[styles.value, { color: colors.foreground }]}>
                {text.target}
              </Text>
            </View>

            <Text style={[styles.paragraph, { color: colors.foreground }]}>
              {text.about}
            </Text>
            <Text style={[styles.paragraph, { color: colors.foreground }]}>
              {text.consequence}
            </Text>
            <Text style={[styles.paragraph, styles.advice, { color: colors.foreground }]}>
              {text.advice}
            </Text>
          </ScrollView>

          <View style={styles.actions}>
            <Button label="Cancelar" fullWidth disabled={leaving} onPress={onCancel} />
            <Button
              label="Cambiar de servidor"
              variant="outline"
              fullWidth
              loading={leaving}
              onPress={onConfirm}
              accessibilityLabel="Cambiar de servidor y cerrar la sesión actual"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: { maxHeight: '90%', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  body: { padding: 20, gap: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  row: { gap: 2 },
  label: { fontSize: 12, fontWeight: '600' },
  value: { fontSize: 15 },
  paragraph: { fontSize: 14, lineHeight: 20 },
  advice: { fontWeight: '600' },
  actions: { padding: 20, paddingTop: 0, gap: 12 },
});
