import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { Button, InfoBanner, TextField } from '@/components/ui';
import type { OwnerProfileStackParamList } from '@/navigation/types';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from '@/services/profile';
import { ApiError } from '@/types/api';
import type { AuthUser } from '@/types/models';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Nav = NativeStackNavigationProp<OwnerProfileStackParamList>;

interface ProfileForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
}

function initialForm(user: AuthUser | null): ProfileForm {
  const owner = user?.type === 'Owner' ? user : null;
  return {
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    email: user?.email ?? '',
    phone: owner?.phone ?? '',
    address: owner?.address ?? '',
  };
}

function emailError(email: string): string | undefined {
  return email.length > 0 && !EMAIL_RE.test(email.trim())
    ? 'Correo inválido.'
    : undefined;
}

function isValid(form: ProfileForm): boolean {
  return (
    form.first_name.trim().length > 0 &&
    form.last_name.trim().length > 0 &&
    EMAIL_RE.test(form.email.trim())
  );
}

export function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState(() => initialForm(user));
  const set = <K extends keyof ProfileForm>(key: K, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const canSubmit = isValid(form) && !submitting;

  const onSubmit = async () => {
    setSubmitting(true);
    setError(undefined);
    let saved = false;
    try {
      await updateProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        // Vacío → null: borra el valor anterior en el servidor.
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      });
      saved = true;
      // El perfil ya se guardó: si releerlo falla, no es "no se pudo actualizar".
      await refreshUser().catch(() => undefined);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo actualizar el perfil.');
    } finally {
      setSubmitting(false);
    }
    if (saved && back) back();
  };

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Editar perfil" onBack={back} />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      {error ? <InfoBanner tone="destructive" message={error} /> : null}

      <TextField
        label="Nombre"
        keyboardType="default"
        value={form.first_name}
        onChangeText={(v) => set('first_name', v)}
        autoCapitalize="words"
      />
      <TextField
        label="Apellido"
        keyboardType="default"
        value={form.last_name}
        onChangeText={(v) => set('last_name', v)}
        autoCapitalize="words"
      />
      <TextField
        label="Correo"
        value={form.email}
        onChangeText={(v) => set('email', v)}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        error={emailError(form.email)}
      />
      <TextField
        label="Teléfono"
        value={form.phone}
        onChangeText={(v) => set('phone', v)}
        keyboardType="phone-pad"
      />
      <TextField
        label="Dirección"
        keyboardType="default"
        value={form.address}
        onChangeText={(v) => set('address', v)}
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
