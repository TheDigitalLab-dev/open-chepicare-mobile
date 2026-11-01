import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import {
  Button,
  FilterChips,
  InfoBanner,
  SectionTitle,
  TextField,
} from '@/components/ui';
import { useRemoteSearch } from '@/hooks/useRemoteSearch';
import { RemoteSearchPicker } from '@/components/domain';
import { listAdminPets } from '@/services/admin';
import { useClinicalConsultation } from '@/hooks/useClinicalConsultation';
import type { ClinicalPlanDraft, ClinicalSection } from '@/types/clinical';
import type { AdminMoreStackParamList } from '@/navigation/types';
import { ClinicalPlanFields } from './components/ClinicalPlanFields';
import { isValidDayKey, parseDecimalInput } from '@/utils/formInput';
import type { Pet } from '@/types/models';
import { clinicToday } from '@/utils/clinicTime';

const petId = (p: Pet) => p.id;
const petName = (p: Pet) => p.name;

/** Búsqueda de pacientes en el servidor (la lista del backend es paginada). */
const searchPets = (query: string) => listAdminPets({ search: query || undefined });

function ConsultationForm() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminMoreStackParamList>>();
  const workflow = useClinicalConsultation();
  const [section, setSection] = useState<ClinicalSection>('clinical');

  const [form, setForm] = useState({
    petId: undefined as number | undefined,
    date: clinicToday(),
    diagnosis: '',
    treatment: '',
    notes: '',
    weight: '',
    temperature: '',
    anamnesis: '',
    heart_rate: '',
    respiratory_rate: '',
    blood_pressure: '',
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const petSearch = useRemoteSearch(searchPets);
  const [pet, setPet] = useState<Pet | null>(null);

  const [plan, setPlan] = useState<ClinicalPlanDraft>({
    medications: [],
    labExams: [],
    vaccinations: [],
    dewormings: [],
  });
  const submitting = workflow.saving;
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
    const heartRate = parseDecimalInput(form.heart_rate);
    const respiratoryRate = parseDecimalInput(form.respiratory_rate);
    if (!weight.ok || !temperature.ok || !heartRate.ok || !respiratoryRate.ok) {
      setError('Los signos vitales deben ser números (p. ej. 4,5).');
      return;
    }
    setError(undefined);
    const saved = await workflow.submit({
      consultation: {
        pet_id: form.petId,
        consultation_date: date,
        diagnosis: form.diagnosis.trim() || undefined,
        treatment: form.treatment.trim() || undefined,
        notes: form.notes.trim() || undefined,
        weight: weight.value,
        temperature: temperature.value,
        anamnesis: form.anamnesis.trim() || undefined,
        heart_rate: heartRate.value,
        respiratory_rate: respiratoryRate.value,
        blood_pressure: form.blood_pressure.trim() || undefined,
      },
      medications: plan.medications.map((draft) => draft.value),
      labExams: plan.labExams.map((draft) => draft.value),
      vaccinations: plan.vaccinations.map((draft) => draft.value),
      dewormings: plan.dewormings.map((draft) => draft.value),
      prescriptionInstructions: plan.prescriptionInstructions,
    });
    if (saved && saved.failures.length === 0)
      navigation.replace('AdminConsultationDetail', { id: saved.consultation.id });
  };

  return (
    <>
      {error ? <InfoBanner tone="destructive" message={error} /> : null}
      {workflow.error ? <InfoBanner tone="destructive" message={workflow.error} /> : null}
      {workflow.progress?.failures.length ? (
        <InfoBanner
          tone="destructive"
          message={`La consulta se guardó. Corrige y reintenta únicamente lo pendiente: ${workflow.progress.failures.map((failure) => `${failure.label}: ${failure.message}`).join('; ')}`}
        />
      ) : null}

      <View style={{ gap: 12 }} pointerEvents={workflow.progress ? 'none' : 'auto'}>
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
      </View>
      <View style={{ gap: 4 }}>
        <FilterChips
          options={[
            { id: 'clinical', label: 'Consulta' },
            { id: 'prescription', label: 'Receta' },
            { id: 'lab', label: 'Exámenes' },
          ]}
          selectedId={section}
          onSelect={(id) => setSection(id as ClinicalSection)}
        />
        <FilterChips
          options={[
            { id: 'vaccination', label: 'Vacunas' },
            { id: 'deworming', label: 'Desparasitación' },
          ]}
          selectedId={section}
          onSelect={(id) => setSection(id as ClinicalSection)}
        />
      </View>
      {section === 'clinical' ? (
        <View style={{ gap: 12 }} pointerEvents={workflow.progress ? 'none' : 'auto'}>
          <SectionTitle>Datos clínicos</SectionTitle>
          <TextField
            label="Motivo de consulta / Anamnesis"
            keyboardType="default"
            value={form.anamnesis}
            onChangeText={(v) => set('anamnesis', v)}
            multiline
          />
          <TextField
            label="Tratamiento"
            keyboardType="default"
            value={form.treatment}
            onChangeText={(v) => set('treatment', v)}
            multiline
          />
          <TextField
            label="Notas"
            keyboardType="default"
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
          <TextField
            label="Frecuencia cardíaca (lpm)"
            keyboardType="numeric"
            value={form.heart_rate}
            onChangeText={(v) => set('heart_rate', v)}
          />
          <TextField
            label="Frecuencia respiratoria (rpm)"
            keyboardType="numeric"
            value={form.respiratory_rate}
            onChangeText={(v) => set('respiratory_rate', v)}
          />
          <TextField
            label="Presión arterial"
            keyboardType="default"
            value={form.blood_pressure}
            onChangeText={(v) => set('blood_pressure', v)}
          />
          <TextField
            label="Diagnóstico"
            keyboardType="default"
            multiline
            value={form.diagnosis}
            onChangeText={(v) => set('diagnosis', v)}
          />
        </View>
      ) : null}

      <ClinicalPlanFields
        section={section}
        value={plan}
        change={(patch) => setPlan((previous) => ({ ...previous, ...patch }))}
        progress={workflow.progress}
      />

      <Button
        label={workflow.progress ? 'Reintentar pendientes' : 'Registrar consulta'}
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
