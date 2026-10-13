import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { MobileShell } from '@/components/layout';
import { Button } from '@/components/ui';

export interface WelcomeScreenProps {
  onLogin?: () => void;
  onRegister?: () => void;
  onOpenServerSettings?: () => void;
}

/** Pantalla de bienvenida (`GET /auth`) — accesos a login, registro y servidor. */
export function WelcomeScreen({
  onLogin,
  onRegister,
  onOpenServerSettings,
}: WelcomeScreenProps) {
  const { colors } = useTheme();
  return (
    <MobileShell contentStyle={styles.content}>
      <View style={styles.brandBlock}>
        <Text style={[styles.brand, { color: colors.primary }]}>ChepiCare</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          Cuidado veterinario a domicilio
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label="Iniciar sesión" fullWidth onPress={onLogin} />
        <Button label="Crear cuenta" variant="outline" fullWidth onPress={onRegister} />
        <Button
          label="Configurar servidor"
          variant="ghost"
          fullWidth
          onPress={onOpenServerSettings}
        />
      </View>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between', paddingVertical: 48 },
  brandBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  brand: { fontSize: 44, fontWeight: '700', letterSpacing: 0.5 },
  tagline: { fontSize: 16 },
  actions: { gap: 12 },
});
