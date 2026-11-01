import { useState } from 'react';
import type { ConsultationVaccination } from '@/types/clinical';
import { VaccinationEditor } from './components/ClinicalPlanFields';
import { useNavigation } from '@react-navigation/native';

import { AppHeader, MobileShell } from '@/components/layout';
import { Button, InfoBanner, TextField } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useRemoteSearch } from '@/hooks/useRemoteSearch';
import { RemoteSearchPicker } from '@/components/domain';
import { createAdminVaccination, listAdminPets } from '@/services/admin';
import { ApiError } from '@/types/api';
import { isValidDayKey } from '@/utils/formInput';
import type { Pet } from '@/types/models';
import { clinicToday } from '@/utils/clinicTime';
import { canRegisterVaccinations } from '@/utils/permissions';

const petId = (p: Pet) => p.id;
const petName = (p: Pet) => p.name;

/** Búsqueda de pacientes en el servidor (la lista del backend es paginada). */
const searchPets = (query: string) => listAdminPets({ search: query || undefined });

function VaccinationForm() {
  const navigation = useNavigation();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const [form, setForm] = useState({
    petId: undefined as number | undefined,
    application_date: clinicToday(),
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const [vaccination, setVaccination] = useState<ConsultationVaccination>({
    vaccine_type: 'other',
    vaccine_name: '',
  });
  const petSearch = useRemoteSearch(searchPets);
  // El backend exige can_vaccinate al veterinario que registra la vacuna.
  const { user } = useAuth();
  const canVaccinate = canRegisterVaccinations(user);
  const [pet, setPet] = useState<Pet | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const canSubmit =
    canVaccinate &&
    form.petId !== undefined &&
    vaccination.vaccine_name.trim().length > 0 &&
    form.application_date.trim().length > 0 &&
    !submitting;

  const onSubmit = async () => {
    if (form.petId === undefined) return;
    const nextDue = (vaccination.next_due_date ?? '').trim();
    if (
      !isValidDayKey(form.application_date.trim()) ||
      (nextDue && !isValidDayKey(nextDue))
    ) {
      setError('Las fechas deben tener el formato AAAA-MM-DD.');
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      await createAdminVaccination({
        ...vaccination,
        pet_id: form.petId,
        vaccine_name: vaccination.vaccine_name.trim(),
        application_date: form.application_date.trim(),
        next_due_date: (vaccination.next_due_date ?? '').trim() || undefined,
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
        label="Fecha de aplicación"
        value={form.application_date}
        onChangeText={(v) => set('application_date', v)}
        placeholder="AAAA-MM-DD"
        keyboardType="numbers-and-punctuation"
      />
      <VaccinationEditor
        value={vaccination}
        change={(patch) => setVaccination((previous) => ({ ...previous, ...patch }))}
        locked={submitting || !canVaccinate}
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
