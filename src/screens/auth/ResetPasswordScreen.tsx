import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import { Button, TextField } from '@/components/ui';

const MIN_PASSWORD = 8;

export interface ResetPasswordScreenProps {
  /** Token recibido por deep link (chepicare://reset_password/:token; también pawcare://). */
  token?: string;
  onBack?: () => void;
  onSubmit?: (data: { password: string; passwordConfirmation: string }) => void;
  submitting?: boolean;
  errorMessage?: string;
}

/** Restablecer contraseña — solo nueva contraseña + confirmación. */
export function ResetPasswordScreen({
  onBack,
  onSubmit,
  submitting,
  errorMessage,
}: ResetPasswordScreenProps) {
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;
  const mismatch = confirm.length > 0 && confirm !== password;
  const valid = password.length >= MIN_PASSWORD && confirm === password;

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Nueva contraseña" onBack={onBack} />}
      contentStyle={styles.content}
    >
      <Text style={[styles.intro, { color: colors.mutedForeground }]}>
        Crea una contraseña de al menos {MIN_PASSWORD} caracteres.
      </Text>
      <TextField
        label="Nueva contraseña"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        onBlur={() => setTouched(true)}
        secureTextEntry
        textContentType="newPassword"
        error={touched && tooShort ? `Mínimo ${MIN_PASSWORD} caracteres.` : undefined}
      />
      <TextField
        label="Confirmar contraseña"
        placeholder="••••••••"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        textContentType="newPassword"
        error={mismatch ? 'Las contraseñas no coinciden.' : errorMessage}
      />
      <Button
        label="Restablecer contraseña"
        fullWidth
        loading={submitting}
        disabled={!valid || submitting}
        onPress={() => onSubmit?.({ password, passwordConfirmation: confirm })}
      />
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  intro: { fontSize: 14, lineHeight: 21 },
});
