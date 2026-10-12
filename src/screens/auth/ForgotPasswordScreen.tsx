import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import { Button, InfoBanner, TextField } from '@/components/ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ForgotPasswordScreenProps {
  onBack?: () => void;
  onSubmit?: (email: string) => void;
  submitting?: boolean;
  /** Mensaje de confirmación tras enviar (el backend siempre responde 200). */
  sent?: boolean;
  /** Error que sí se informa (límite de intentos, sin red); no revela cuentas. */
  errorMessage?: string;
}

/** Solicitud de recuperación — solo campo email. */
export function ForgotPasswordScreen({
  onBack,
  onSubmit,
  submitting,
  sent,
  errorMessage,
}: ForgotPasswordScreenProps) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);

  const valid = EMAIL_RE.test(email.trim());
  const error = touched && !valid ? 'Ingresa un correo válido.' : undefined;

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Recuperar contraseña" onBack={onBack} />}
      contentStyle={styles.content}
    >
      {sent ? (
        <InfoBanner
          tone="success"
          message="Si el correo existe, te enviamos instrucciones para restablecer tu contraseña."
        />
      ) : (
        <>
          {errorMessage ? <InfoBanner tone="destructive" message={errorMessage} /> : null}
          <Text style={[styles.intro, { color: colors.mutedForeground }]}>
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
          </Text>
          <TextField
            label="Correo"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            onBlur={() => setTouched(true)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            error={error}
          />
          <Button
            label="Enviar enlace"
            fullWidth
            loading={submitting}
            disabled={!valid || submitting}
            onPress={() => onSubmit?.(email.trim())}
          />
        </>
      )}
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  intro: { fontSize: 14, lineHeight: 21 },
});
