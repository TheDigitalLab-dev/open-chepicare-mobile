import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import {
  AsyncBoundary,
  Button,
  FilterChips,
  InfoBanner,
  TextField,
} from '@/components/ui';
import type { AdminPatientsStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { useRemoteSearch } from '@/hooks/useRemoteSearch';
import { RemoteSearchPicker } from '@/components/domain';
import { createAdminAdoption, listAdminOwners, type AdminOwner } from '@/services/admin';
import { listAdoptionPets } from '@/services/public';
import { ApiError } from '@/types/api';
import { isValidDayKey } from '@/utils/formInput';
import type { AdoptionPet } from '@/types/models';
import { clinicToday } from '@/utils/clinicTime';

type Nav = NativeStackNavigationProp<AdminPatientsStackParamList>;

function ownerLabel(o: AdminOwner): string {
  return o.full_name ?? `${o.first_name} ${o.last_name}`.trim();
}

/** Búsqueda de adoptantes en el servidor (la lista del backend es paginada). */
const searchOwners = (query: string) => listAdminOwners({ search: query || undefined });
const ownerId = (o: AdminOwner) => o.id;

function AdoptionForm({ pets }: { pets: AdoptionPet[] }) {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  // Solo se guarda la elección explícita; el default (primer elemento) se
  // deriva en render para no copiar props a estado.
  const [petChoice, setPetChoice] = useState<number>();
  const petId = petChoice ?? pets[0]?.id;
  // El adoptante se elige explícitamente (antes quedaba el primero de la
  // primera página por defecto).
  const ownerSearch = useRemoteSearch(searchOwners);
  const [adopter, setAdopter] = useState<AdminOwner | null>(null);
  const adopterId = adopter?.id;
  const [date, setDate] = useState(() => clinicToday());
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const canSubmit =
    petId !== undefined &&
    adopterId !== undefined &&
    date.trim().length > 0 &&
    !submitting;

  const labelStyle = {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.foreground,
    marginBottom: 6,
  };

  const onSubmit = async () => {
    if (petId === undefined || adopterId === undefined) return;
    if (!isValidDayKey(date.trim())) {
      setError('La fecha debe tener el formato AAAA-MM-DD.');
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      await createAdminAdoption({
        pet_id: petId,
        adopter_id: adopterId,
        adoption_date: date.trim(),
        notes: notes.trim() || undefined,
      });
      back?.();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar la adopción.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {error ? <InfoBanner tone="destructive" message={error} /> : null}

      <View>
        <Text style={labelStyle}>Mascota en adopción</Text>
        <FilterChips
          options={pets.map((p) => ({ id: String(p.id), label: p.name }))}
          selectedId={petId !== undefined ? String(petId) : ''}
          onSelect={(id) => setPetChoice(Number(id))}
        />
      </View>

      <RemoteSearchPicker
        label="Adoptante"
        search={ownerSearch}
        getId={ownerId}
        getLabel={ownerLabel}
        selected={adopter}
        onSelect={setAdopter}
        placeholder="Buscar por nombre, correo o documento"
        emptyIcon="person"
        emptyTitle="Sin dueños"
      />

      <TextField
        label="Fecha de adopción"
        value={date}
        onChangeText={setDate}
        placeholder="AAAA-MM-DD"
        keyboardType="numbers-and-punctuation"
      />
      <TextField label="Notas" value={notes} onChangeText={setNotes} multiline />

      <Button
        label="Registrar adopción"
        fullWidth
        loading={submitting}
        disabled={!canSubmit}
        onPress={onSubmit}
        style={{ marginTop: 8 }}
      />
    </>
  );
}

export function AdminAdoptionFormScreen() {
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const pets = useAsync(() => listAdoptionPets());

  const loading = pets.loading && pets.data === null;
  const ready = pets.data !== null;

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Nueva adopción" onBack={back} />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      <AsyncBoundary
        loading={loading}
        error={pets.error}
        onRetry={() => void pets.reload()}
        empty={ready && (pets.data ?? []).length === 0}
        emptyIcon="paw"
        emptyTitle="Sin mascotas en adopción"
        emptyDescription="No hay mascotas disponibles para adopción."
      >
        {ready ? <AdoptionForm pets={pets.data!} /> : null}
      </AsyncBoundary>
    </MobileShell>
  );
}
