import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import { AppHeader, MobileShell } from '@/components/layout';
import { Button, InfoBanner, SectionTitle, TextField } from '@/components/ui';
import { useRemoteSearch } from '@/hooks/useRemoteSearch';
import { RemoteSearchPicker } from '@/components/domain';
import { createAdminConsultation, listAdminPets } from '@/services/admin';
import { ApiError } from '@/types/api';
import { isValidDayKey, parseDecimalInput } from '@/utils/formInput';
import type { Pet } from '@/types/models';
import { clinicToday } from '@/utils/clinicTime';

const petId = (p: Pet) => p.id;
const petName = (p: Pet) => p.name;

/** Búsqueda de pacientes en el servidor (la lista del backend es paginada). */
const searchPets = (query: string) => listAdminPets({ search: query || undefined });

function ConsultationForm() {
  const navigation = useNavigation();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const [form, setForm] = useState({
    petId: undefined as number | undefined,
    date: clinicToday(),
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
    const date = form.date.trim();
    if (!isValidDayKey(date)) {
      setError('La fecha debe tener el formato AAAA-MM-DD.');
      return;
    }
    // Coma o punto decimal (teclado en español); antes «4,5» se enviaba vacío.
    const weight = parseDecimalInput(form.weight);
    const temperature = parseDecimalInput(form.temperature);
    if (!weight.ok || !temperature.ok) {
      setError('El peso y la temperatura deben ser números (p. ej. 4,5).');
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      await createAdminConsultation({
        pet_id: form.petId,
        consultation_date: date,
        diagnosis: form.diagnosis.trim() || undefined,
        treatment: form.treatment.trim() || undefined,
        notes: form.notes.trim() || undefined,
        weight: weight.value,
        temperature: temperature.value,
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
