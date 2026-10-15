import { useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import {
  AsyncBoundary,
  Button,
  FilterChips,
  InfoBanner,
  SectionTitle,
  TextField,
} from '@/components/ui';
import type { OwnerPetsStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { createPet, getPet, updatePet, type PetInput } from '@/services/pets';
import { ApiError } from '@/types/api';
import { isValidDayKey } from '@/utils/formInput';
import { clinicToday } from '@/utils/clinicTime';
import {
  PET_SEX_LABEL,
  SPECIES_LABEL,
  type Pet,
  type PetSex,
  type Species,
} from '@/types/models';

type Nav = NativeStackNavigationProp<OwnerPetsStackParamList>;

const SPECIES_OPTIONS = (Object.keys(SPECIES_LABEL) as Species[]).map((id) => ({
  id,
  label: SPECIES_LABEL[id],
}));
const SEX_OPTIONS = (Object.keys(PET_SEX_LABEL) as PetSex[]).map((id) => ({
  id,
  label: PET_SEX_LABEL[id],
}));

function firstErrors(e: ApiError): Partial<Record<keyof PetInput, string>> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(e.fieldErrors ?? {})) {
    if (v.length > 0) out[k] = v[0]!;
  }
  return out;
}

function PetFormBody({ initial }: { initial?: Pet }) {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    species: (initial?.species ?? 'dog') as Species,
    breed: initial?.breed ?? '',
    // Al editar una mascota sin sexo registrado no se inventa «Macho».
    sex: (initial ? (initial.sex ?? null) : 'male') as PetSex | null,
    birth_date: initial?.birth_date ?? '',
    distinctive_features: initial?.distinctive_features ?? '',
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PetInput, string>>>(
    {},
  );
  const [generalError, setGeneralError] = useState<string>();

  const canSubmit = form.name.trim().length > 0 && !submitting;

  const labelStyle = {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 6,
    color: colors.foreground,
  };

  const onSubmit = async () => {
    const birthDate = form.birth_date.trim();
    if (birthDate && !isValidDayKey(birthDate)) {
      setFieldErrors({ birth_date: 'Usa el formato AAAA-MM-DD.' });
      return;
    }
    if (birthDate && birthDate > clinicToday()) {
      setFieldErrors({ birth_date: 'La fecha de nacimiento no puede ser futura.' });
      return;
    }
    setSubmitting(true);
    setFieldErrors({});
    setGeneralError(undefined);

    const input: PetInput = {
      name: form.name.trim(),
      species: form.species,
      sex: form.sex ?? undefined,
      // Vacío → null: al editar, borra el valor anterior en el servidor.
      breed: form.breed.trim() || null,
      birth_date: form.birth_date.trim() || null,
      distinctive_features: form.distinctive_features.trim() || null,
    };

    try {
      if (initial) {
        await updatePet(initial.id, input);
      } else {
        await createPet(input);
      }
      if (back) back();
    } catch (e) {
      if (e instanceof ApiError && e.fieldErrors) {
        setFieldErrors(firstErrors(e));
      } else {
        setGeneralError(
          e instanceof ApiError ? e.message : 'No se pudo guardar la mascota.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileShell
      scroll
      header={
        <AppHeader title={initial ? 'Editar mascota' : 'Nueva mascota'} onBack={back} />
      }
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      {generalError ? <InfoBanner tone="destructive" message={generalError} /> : null}

      <TextField
        label="Nombre"
        value={form.name}
        onChangeText={(v) => set('name', v)}
        error={fieldErrors.name}
        autoCapitalize="words"
        returnKeyType="next"
      />

      <View>
        <Text style={labelStyle}>Especie</Text>
        <FilterChips
          options={SPECIES_OPTIONS}
          selectedId={form.species}
          onSelect={(id) => set('species', id as Species)}
        />
      </View>

      <TextField
        label="Raza"
        value={form.breed}
        onChangeText={(v) => set('breed', v)}
        error={fieldErrors.breed}
        autoCapitalize="words"
      />

      <View>
        <Text style={labelStyle}>Sexo</Text>
        <FilterChips
          options={SEX_OPTIONS}
          selectedId={form.sex ?? ''}
          onSelect={(id) => set('sex', id as PetSex)}
        />
      </View>

      <TextField
        label="Fecha de nacimiento"
        placeholder="AAAA-MM-DD"
        value={form.birth_date}
        onChangeText={(v) => set('birth_date', v)}
        keyboardType="numbers-and-punctuation"
        error={fieldErrors.birth_date}
      />

      <SectionTitle>Características</SectionTitle>
      <TextField
        label="Características distintivas"
        placeholder="Color, marcas, temperamento…"
        value={form.distinctive_features}
        onChangeText={(v) => set('distinctive_features', v)}
        multiline
        error={fieldErrors.distinctive_features}
      />

      <Button
        label={initial ? 'Guardar cambios' : 'Crear mascota'}
        fullWidth
        loading={submitting}
        disabled={!canSubmit}
        onPress={onSubmit}
        style={{ marginTop: 8 }}
      />
    </MobileShell>
  );
}

export function PetFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<OwnerPetsStackParamList, 'PetForm'>>();
  const editingId = route.params.id;
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data, loading, error, reload } = useAsync(() =>
    editingId !== undefined ? getPet(editingId) : Promise.resolve(null),
  );

  // Crear: sin datos previos.
  if (editingId === undefined) {
    return <PetFormBody />;
  }

  // Editar: el formulario se monta (con su propio shell) cuando llega la mascota.
  if (data) {
    return <PetFormBody initial={data} />;
  }

  // Cargando / error: shell mínimo con el estado correspondiente.
  return (
    <MobileShell scroll header={<AppHeader title="Editar mascota" onBack={back} />}>
      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        {null}
      </AsyncBoundary>
    </MobileShell>
  );
}
