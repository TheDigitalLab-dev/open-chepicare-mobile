import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import { AppHeader, MobileShell } from '@/components/layout';
import { Button, InfoBanner, SectionTitle, TextField } from '@/components/ui';
import { useRemoteSearch } from '@/hooks/useRemoteSearch';
import { RemoteSearchPicker } from '@/components/domain/RemoteSearchPicker';
import { createAdminConsultation, listAdminPets } from '@/services/admin';
import { ApiError } from '@/types/api';
import type { Pet } from '@/types/models';

const petId = (p: Pet) => p.id;
const petName = (p: Pet) => p.name;

function todayDate(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Búsqueda de pacientes en el servidor (la lista del backend es paginada). */
const searchPets = (query: string) => listAdminPets({ search: query || undefined });

function ConsultationForm() {
  const navigation = useNavigation();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const [form, setForm] = useState({
    petId: undefined as number | undefined,
    date: todayDate(),
    diagnosis: '',
    treatment: '',
    notes: '',
    weight: '',
    temperature: '',
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const petSearch = useRemoteSearch(searchPets);
  const [pet, setPet] = useState<Pet | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const canSubmit =
    form.petId !== undefined && form.date.trim().length > 0 && !submitting;

  const onSubmit = async () => {
    if (form.petId === undefined) return;
    setSubmitting(true);
    setError(undefined);
    try {
      await createAdminConsultation({
        pet_id: form.petId,
        consultation_date: form.date.trim(),
        diagnosis: form.diagnosis.trim() || undefined,
        treatment: form.treatment.trim() || undefined,
        notes: form.notes.trim() || undefined,
        weight: form.weight.trim() ? Number(form.weight) : undefined,
        temperature: form.temperature.trim() ? Number(form.temperature) : undefined,
      });
      if (back) back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar la consulta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {error ? <InfoBanner tone="destructive" message={error} /> : null}

      <RemoteSearchPicker
        label="Mascota"
        search={petSearch}
        getId={petId}
        getLabel={petName}
        selected={pet}
        onSelect={(p) => {
          setPet(p);
          set('petId', p.id);
        }}
        placeholder="Buscar paciente por nombre"
        emptyIcon="paw"
        emptyTitle="Sin pacientes"
      />

      <TextField
        label="Fecha"
        value={form.date}
        onChangeText={(v) => set('date', v)}
        placeholder="AAAA-MM-DD"
        keyboardType="numbers-and-punctuation"
      />

      <SectionTitle>Datos clínicos</SectionTitle>
      <TextField
        label="Diagnóstico"
        value={form.diagnosis}
        onChangeText={(v) => set('diagnosis', v)}
        multiline
      />
      <TextField
        label="Tratamiento"
        value={form.treatment}
        onChangeText={(v) => set('treatment', v)}
        multiline
      />
      <TextField
        label="Notas"
        value={form.notes}
        onChangeText={(v) => set('notes', v)}
        multiline
      />
      <TextField
        label="Peso (kg)"
        value={form.weight}
        onChangeText={(v) => set('weight', v)}
        keyboardType="decimal-pad"
      />
      <TextField
        label="Temperatura (°C)"
        value={form.temperature}
        onChangeText={(v) => set('temperature', v)}
        keyboardType="decimal-pad"
      />

      <Button
        label="Registrar consulta"
        fullWidth
        loading={submitting}
        disabled={!canSubmit}
        onPress={onSubmit}
        style={{ marginTop: 8 }}
      />
    </>
  );
}

export function AdminConsultationFormScreen() {
  const navigation = useNavigation();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Nueva consulta" onBack={back} />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      <ConsultationForm />
    </MobileShell>
  );
}
