import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import { AppHeader, MobileShell } from '@/components/layout';
import { Button, InfoBanner, TextField } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useRemoteSearch } from '@/hooks/useRemoteSearch';
import { RemoteSearchPicker } from '@/components/domain/RemoteSearchPicker';
import { createAdminVaccination, listAdminPets } from '@/services/admin';
import { ApiError } from '@/types/api';
import type { Pet } from '@/types/models';
import { clinicToday } from '@/utils/clinicTime';

const petId = (p: Pet) => p.id;
const petName = (p: Pet) => p.name;

/** Búsqueda de pacientes en el servidor (la lista del backend es paginada). */
const searchPets = (query: string) => listAdminPets({ search: query || undefined });

function VaccinationForm() {
  const navigation = useNavigation();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const [form, setForm] = useState({
    petId: undefined as number | undefined,
    vaccine_name: '',
    manufacturer: '',
    dose: '',
    application_date: clinicToday(),
    next_due_date: '',
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const petSearch = useRemoteSearch(searchPets);
  // El backend exige can_vaccinate al veterinario que registra la vacuna.
  const { user } = useAuth();
  const canVaccinate = user?.type === 'User' && user.can_vaccinate !== false;
  const [pet, setPet] = useState<Pet | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const canSubmit =
    canVaccinate &&
    form.petId !== undefined &&
    form.vaccine_name.trim().length > 0 &&
    form.application_date.trim().length > 0 &&
    !submitting;

  const onSubmit = async () => {
    if (form.petId === undefined) return;
    setSubmitting(true);
    setError(undefined);
    try {
      await createAdminVaccination({
        pet_id: form.petId,
        vaccine_name: form.vaccine_name.trim(),
        manufacturer: form.manufacturer.trim() || undefined,
        dose: form.dose.trim() || undefined,
        application_date: form.application_date.trim(),
        next_due_date: form.next_due_date.trim() || undefined,
      });
      if (back) back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo registrar la vacuna.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {error ? <InfoBanner tone="destructive" message={error} /> : null}
      {canVaccinate ? null : (
        <InfoBanner
          tone="warning"
          message="Tu usuario no está habilitado para registrar vacunas. Pide a un administrador que active el permiso en Personal."
        />
      )}

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
        label="Vacuna"
        value={form.vaccine_name}
        onChangeText={(v) => set('vaccine_name', v)}
      />
      <TextField
        label="Fabricante"
        value={form.manufacturer}
        onChangeText={(v) => set('manufacturer', v)}
      />
      <TextField label="Dosis" value={form.dose} onChangeText={(v) => set('dose', v)} />
      <TextField
        label="Fecha de aplicación"
        value={form.application_date}
        onChangeText={(v) => set('application_date', v)}
        placeholder="AAAA-MM-DD"
        keyboardType="numbers-and-punctuation"
      />
      <TextField
        label="Próxima dosis"
        value={form.next_due_date}
        onChangeText={(v) => set('next_due_date', v)}
        placeholder="AAAA-MM-DD"
        keyboardType="numbers-and-punctuation"
      />

      <Button
        label="Registrar vacuna"
        fullWidth
        loading={submitting}
        disabled={!canSubmit}
        onPress={onSubmit}
        style={{ marginTop: 8 }}
      />
    </>
  );
}

export function AdminVaccinationFormScreen() {
  const navigation = useNavigation();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Nueva vacuna" onBack={back} />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      <VaccinationForm />
    </MobileShell>
  );
}
