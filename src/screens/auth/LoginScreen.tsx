import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { MobileShell } from '@/components/layout';
import { Button, TextField } from '@/components/ui';

export interface LoginScreenProps {
  /** Se cableará en F4 (auth). Por ahora la pantalla es solo presentacional. */
  onSubmit?: (credentials: { login: string; password: string }) => void;
  onForgotPassword?: () => void;
  onCreateAccount?: () => void;
  /** Acceso a la configuración del servidor (antes vivía en Welcome). */
  onOpenServerSettings?: () => void;
  /** Emparejar con el QR que genera la web (servidor + sesión en un paso). */
  onScanPairingQr?: () => void;
  submitting?: boolean;
  /** Error general (p. ej. credenciales inválidas). */
  errorMessage?: string;
}

/**
 * Pantalla de inicio de sesión — SOLO login.
 * Campo `login` (email o usuario) + contraseña, según el contrato del backend
 * (`POST /auth/login` con `{ login, password }`).
 */
export function LoginScreen({
  onSubmit,
  onForgotPassword,
  onCreateAccount,
  onOpenServerSettings,
  onScanPairingQr,
  submitting,
  errorMessage,
}: LoginScreenProps) {
  const { colors } = useTheme();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = login.trim().length > 0 && password.length > 0 && !submitting;

  return (
    <MobileShell scroll contentStyle={styles.content}>
      <View style={styles.brandBlock}>
        <Text style={[styles.brand, { color: colors.primary }]}>ChepiCare</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          Cuidado veterinario a domicilio
        </Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="Correo o usuario"
          placeholder="tu@email.com"
          value={login}
          onChangeText={setLogin}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          returnKeyType="next"
        />
        <TextField
          label="Contraseña"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          returnKeyType="done"
          error={errorMessage}
          onSubmitEditing={() =>
            canSubmit && onSubmit?.({ login: login.trim(), password })
          }
        />

        <Button
          label="Iniciar sesión"
          fullWidth
          loading={submitting}
          disabled={!canSubmit}
          onPress={() => onSubmit?.({ login: login.trim(), password })}
          style={styles.submit}
        />

        <Button
          label="¿Olvidaste tu contraseña?"
          variant="ghost"
          fullWidth
          onPress={onForgotPassword}
        />
      </View>

      <View style={styles.footer}>
        <Text style={{ color: colors.mutedForeground }}>¿No tienes cuenta?</Text>
        <Button label="Crear cuenta" variant="ghost" onPress={onCreateAccount} />
      </View>

      <View style={styles.server}>
        <Button
          label="Emparejar con código QR"
          variant="outline"
          fullWidth
          onPress={onScanPairingQr}
        />
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
  content: { flexGrow: 1, justifyContent: 'center', gap: 32, paddingHorizontal: 24 },
  brandBlock: { alignItems: 'center', gap: 6 },
  brand: { fontSize: 40, fontWeight: '700', letterSpacing: 0.5 },
  tagline: { fontSize: 15 },
  form: { gap: 12 },
  submit: { marginTop: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  server: { gap: 4 },
});
