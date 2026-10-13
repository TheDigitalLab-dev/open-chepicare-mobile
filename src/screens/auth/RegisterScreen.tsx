import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import {
  Button,
  FilterChips,
  InfoBanner,
  SectionTitle,
  TextField,
} from '@/components/ui';
import type { OwnerRegistration, OwnerSex, PhoneType } from '@/types/auth';
import { validateRegistration } from '@/utils/registration';

export type { OwnerRegistration, OwnerSex, PhoneType } from '@/types/auth';

export interface RegisterScreenProps {
  onBack?: () => void;
  onSubmit?: (data: OwnerRegistration) => void;
  submitting?: boolean;
  /** Errores 422 por campo provenientes del backend. */
  fieldErrors?: Partial<Record<keyof OwnerRegistration, string>>;
  /** Error general (sin red, 5xx, 429 o errores fuera del formulario). */
  errorMessage?: string;
}

const EMPTY_FORM: OwnerRegistration = {
  first_name: '',
  last_name: '',
  identity_document: '',
  email: '',
  username: '',
  password: '',
  password_confirmation: '',
  address: '',
  sex: 'female',
  phone: '',
  phone_type: 'whatsapp',
};

const SEX_OPTIONS = [
  { id: 'female', label: 'Femenino' },
  { id: 'male', label: 'Masculino' },
  { id: 'other', label: 'Otro' },
];
const PHONE_OPTIONS = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'regular', label: 'Normal' },
];

/** Registro de dueño — formulario único enfocado (campos de `owner_params`). */
export function RegisterScreen({
  onBack,
  onSubmit,
  submitting,
  fieldErrors,
  errorMessage,
}: RegisterScreenProps) {
  const { colors } = useTheme();
  const [form, setForm] = useState<OwnerRegistration>(EMPTY_FORM);

  const set = <K extends keyof OwnerRegistration>(key: K, value: OwnerRegistration[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const { canSubmit, ...localErrors } = validateRegistration(form);
  // El error del servidor manda sobre la validación local del campo.
  const errorFor = (key: keyof OwnerRegistration): string | undefined =>
    fieldErrors?.[key] ?? (localErrors as Partial<Record<string, string>>)[key];

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Crear cuenta" onBack={onBack} />}
      contentStyle={styles.content}
    >
      {errorMessage ? <InfoBanner tone="destructive" message={errorMessage} /> : null}

      <SectionTitle>Datos personales</SectionTitle>
      <TextField
        label="Nombre"
        value={form.first_name}
        onChangeText={(v) => set('first_name', v)}
        keyboardType="default"
        autoCapitalize="words"
        error={errorFor('first_name')}
      />
      <TextField
        label="Apellido"
        value={form.last_name}
        onChangeText={(v) => set('last_name', v)}
        keyboardType="default"
        autoCapitalize="words"
        error={errorFor('last_name')}
      />
      <TextField
        label="Documento de identidad"
        value={form.identity_document}
        onChangeText={(v) => set('identity_document', v)}
        // Admite prefijos como "V-" o "E-": no es solo numérico.
        keyboardType="default"
        autoCapitalize="characters"
        autoCorrect={false}
        error={errorFor('identity_document')}
      />
      <View>
        <Text style={[styles.label, { color: colors.foreground }]}>Sexo</Text>
        <FilterChips
          options={SEX_OPTIONS}
          selectedId={form.sex}
          onSelect={(id) => set('sex', id as OwnerSex)}
        />
      </View>

      <SectionTitle>Contacto</SectionTitle>
      <TextField
        label="Correo"
        value={form.email}
        onChangeText={(v) => set('email', v)}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        error={errorFor('email')}
      />
      <TextField
        label="Teléfono"
        value={form.phone}
        onChangeText={(v) => set('phone', v)}
        keyboardType="phone-pad"
        error={errorFor('phone')}
      />
      <View>
        <Text style={[styles.label, { color: colors.foreground }]}>Tipo de teléfono</Text>
        <FilterChips
          options={PHONE_OPTIONS}
          selectedId={form.phone_type}
          onSelect={(id) => set('phone_type', id as PhoneType)}
        />
      </View>
      <TextField
        label="Dirección"
        value={form.address}
        onChangeText={(v) => set('address', v)}
        keyboardType="default"
        error={errorFor('address')}
      />

      <SectionTitle>Acceso</SectionTitle>
      <TextField
        label="Usuario"
        value={form.username}
        onChangeText={(v) => set('username', v)}
        keyboardType="default"
        autoCapitalize="none"
        autoCorrect={false}
        error={errorFor('username')}
      />
      <TextField
        label="Contraseña"
        value={form.password}
        onChangeText={(v) => set('password', v)}
        keyboardType="default"
        secureTextEntry
        textContentType="newPassword"
        error={errorFor('password')}
      />
      <TextField
        label="Confirmar contraseña"
        value={form.password_confirmation}
        onChangeText={(v) => set('password_confirmation', v)}
        keyboardType="default"
        secureTextEntry
        textContentType="newPassword"
        error={errorFor('password_confirmation')}
      />

      <Button
        label="Crear cuenta"
        fullWidth
        loading={submitting}
        disabled={!canSubmit || submitting}
        onPress={() => onSubmit?.({ ...form, email: form.email.trim() })}
        style={styles.submit}
      />
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 32 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  submit: { marginTop: 8 },
});
