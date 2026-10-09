import { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { Button, InfoBanner, TextField } from '@/components/ui';
import type { OwnerProfileStackParamList } from '@/navigation/types';
import { changePassword } from '@/services/profile';
import { ApiError } from '@/types/api';

const MIN_PASSWORD = 8;

type Nav = NativeStackNavigationProp<OwnerProfileStackParamList>;

export function ChangePasswordScreen() {
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const nextValid = next.length >= MIN_PASSWORD;
  const match = next === confirm;
  const canSubmit = current.length > 0 && nextValid && match && !submitting;

  const onSubmit = async () => {
    setSubmitting(true);
    setError(undefined);
    try {
      await changePassword({
        current_password: current,
        password: next,
        password_confirmation: confirm,
      });
      // El backend cerró las sesiones de otros dispositivos; esta sigue activa
      // con el par de tokens nuevo que guardó el servicio.
      Alert.alert(
        'Listo',
        'Tu contraseña se actualizó. Se cerró la sesión en tus otros dispositivos.',
      );
      if (back) back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Cambiar contraseña" onBack={back} />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      {error ? <InfoBanner tone="destructive" message={error} /> : null}

      <TextField
        label="Contraseña actual"
        value={current}
        onChangeText={setCurrent}
        secureTextEntry
        textContentType="password"
      />
      <TextField
        label="Nueva contraseña"
        value={next}
        onChangeText={setNext}
        secureTextEntry
        textContentType="newPassword"
        error={
          next.length > 0 && !nextValid ? `Mínimo ${MIN_PASSWORD} caracteres.` : undefined
        }
      />
      <TextField
        label="Confirmar nueva contraseña"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        textContentType="newPassword"
        error={confirm.length > 0 && !match ? 'Las contraseñas no coinciden.' : undefined}
      />

      <Button
        label="Guardar"
        fullWidth
        loading={submitting}
        disabled={!canSubmit}
        onPress={onSubmit}
        style={{ marginTop: 8 }}
      />
    </MobileShell>
  );
}
