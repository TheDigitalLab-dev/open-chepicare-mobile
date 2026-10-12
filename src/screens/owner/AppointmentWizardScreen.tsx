import { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import {
  AsyncBoundary,
  Avatar,
  Button,
  FilterChips,
  InfoBanner,
  SectionTitle,
} from '@/components/ui';
import { ListRow, StepIndicator } from '@/components/domain';
import type { OwnerAppointmentsStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';

import {
  createAppointment,
  getAvailableDays,
  getAvailableVets,
  listServices,
} from '@/services/appointments';
import { listPets } from '@/services/pets';
import { ApiError, toApiError } from '@/types/api';
import { clinicMonth, clinicWallDateTime } from '@/utils/clinicTime';
import { formatDate } from '@/utils/format';
import { generateTimeSlots } from '@/utils/schedule';
import { SPECIES_EMOJI, SPECIES_LABEL, type AvailableVet } from '@/types/models';

type Nav = NativeStackNavigationProp<OwnerAppointmentsStackParamList>;

const STEP_LABELS = ['Mascota', 'Servicio', 'Día', 'Veterinario', 'Hora'];

interface Selection {
  petId?: number;
  serviceId?: number;
  day?: string;
  vetId?: number;
  time?: string;
}

function Check() {
  const { colors } = useTheme();
  return <Text style={{ color: colors.primary, fontWeight: '700' }}>✓</Text>;
}

// Elemento estático hoisteado: el color se resuelve dentro de <Check /> vía useTheme.
const CHECK_EL = <Check />;

export function AppointmentWizardScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  // Mes de la clínica (no del teléfono): el backend calcula "hoy" en su zona. La
  // zona llega con la sesión (`clinic`), así que ya está al abrir el asistente.
  const [{ month, year }] = useState(() => clinicMonth());

  const pets = useAsync(() => listPets());
  const services = useAsync(() => listServices());
  const days = useAsync(() => getAvailableDays(month, year));

  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<Selection>({});
  const patch = (p: Partial<Selection>) => setSel((prev) => ({ ...prev, ...p }));

  const [vets, setVets] = useState<AvailableVet[]>([]);
  const [vetsLoading, setVetsLoading] = useState(false);
  const [vetsError, setVetsError] = useState<ApiError | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const selectedService = services.data?.find((s) => s.id === sel.serviceId);
  const selectedVet = vets.find((v) => v.id === sel.vetId);

  const slots = useMemo(() => {
    if (!selectedVet?.start_time || !selectedVet.end_time) return [];
    return generateTimeSlots(
      selectedVet.start_time,
      selectedVet.end_time,
      selectedService?.duration_minutes ?? 30,
    );
  }, [selectedVet, selectedService]);

  const selectDay = async (d: string) => {
    patch({ day: d, vetId: undefined, time: undefined });
    setVetsLoading(true);
    setVetsError(null);
    try {
      setVets(await getAvailableVets(d));
    } catch (e) {
      // Un fallo de red NO es "sin veterinarios": se muestra con reintento.
      setVets([]);
      setVetsError(toApiError(e));
    } finally {
      setVetsLoading(false);
    }
  };

  const canAdvance =
    (step === 0 && sel.petId !== undefined) ||
    (step === 1 && sel.serviceId !== undefined) ||
    (step === 2 && sel.day !== undefined) ||
    (step === 3 && sel.vetId !== undefined) ||
    (step === 4 && sel.time !== undefined);

  const isLast = step === STEP_LABELS.length - 1;

  const submit = async () => {
    const { petId, serviceId, day, vetId, time } = sel;
    if (
      petId === undefined ||
      serviceId === undefined ||
      day === undefined ||
      vetId === undefined ||
      time === undefined
    ) {
      return;
    }
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      await createAppointment({
        pet_id: petId,
        service_id: serviceId,
        assigned_to_id: vetId,
        scheduled_at: clinicWallDateTime(day, time),
      });
      back?.();
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : 'No se pudo agendar la cita.');
    } finally {
      setSubmitting(false);
    }
  };

  const onNext = () => {
    if (isLast) {
      void submit();
    } else {
      setStep((s) => s + 1);
    }
  };

  const dayOptions = (days.data ?? []).map((d) => ({ id: d, label: formatDate(d) }));
  const slotOptions = slots.map((s) => ({ id: s, label: s }));

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Agendar cita" onBack={back} />}
      contentStyle={{ gap: 16, paddingBottom: 32 }}
    >
      <StepIndicator steps={STEP_LABELS.length} current={step} labels={STEP_LABELS} />

      {submitError ? <InfoBanner tone="destructive" message={submitError} /> : null}

      {step === 0 ? (
        <View style={{ gap: 8 }}>
          <SectionTitle>Elige la mascota</SectionTitle>
          <AsyncBoundary
            loading={pets.loading && pets.data === null}
            error={pets.error}
            onRetry={pets.reload}
            empty={(pets.data ?? []).length === 0}
            emptyIcon="paw"
            emptyTitle="Sin mascotas"
            emptyDescription="Agrega una mascota antes de agendar."
          >
            {(pets.data ?? []).map((pet) => (
              <ListRow
                key={pet.id}
                title={pet.name}
                subtitle={SPECIES_LABEL[pet.species]}
                leading={() => (
                  <Avatar
                    uri={pet.photo_url ?? undefined}
                    fallback={SPECIES_EMOJI[pet.species]}
                  />
                )}
                showChevron={false}
                trailing={sel.petId === pet.id ? CHECK_EL : undefined}
                onPress={() => patch({ petId: pet.id })}
              />
            ))}
          </AsyncBoundary>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={{ gap: 8 }}>
          <SectionTitle>Elige el servicio</SectionTitle>
          <AsyncBoundary
            loading={services.loading && services.data === null}
            error={services.error}
            onRetry={services.reload}
            empty={(services.data ?? []).length === 0}
            emptyIcon="medkit"
            emptyTitle="Sin servicios"
          >
            {(services.data ?? []).map((s) => (
              <ListRow
                key={s.id}
                title={s.name}
                subtitle={s.duration_minutes ? `${s.duration_minutes} min` : undefined}
                showChevron={false}
                trailing={sel.serviceId === s.id ? CHECK_EL : undefined}
                onPress={() => patch({ serviceId: s.id })}
              />
            ))}
          </AsyncBoundary>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ gap: 8 }}>
          <SectionTitle>Elige el día</SectionTitle>
          <AsyncBoundary
            loading={days.loading && days.data === null}
            error={days.error}
            onRetry={days.reload}
            empty={(days.data ?? []).length === 0}
            emptyIcon="calendar"
            emptyTitle="Sin días disponibles"
            emptyDescription="No hay disponibilidad este mes."
          >
            <FilterChips
              options={dayOptions}
              selectedId={sel.day ?? ''}
              onSelect={(id) => void selectDay(id)}
            />
          </AsyncBoundary>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={{ gap: 8 }}>
          <SectionTitle>Elige el veterinario</SectionTitle>
          <AsyncBoundary
            loading={vetsLoading}
            error={vetsError}
            onRetry={() => {
              if (sel.day) void selectDay(sel.day);
            }}
            empty={vets.length === 0}
            emptyIcon="person"
            emptyTitle="Sin veterinarios"
            emptyDescription="No hay veterinarios disponibles ese día."
          >
            {vets.map((v) => (
              <ListRow
                key={v.id}
                title={`${v.first_name} ${v.last_name}`}
                subtitle={
                  v.start_time && v.end_time
                    ? `${v.start_time} – ${v.end_time}`
                    : undefined
                }
                showChevron={false}
                trailing={sel.vetId === v.id ? CHECK_EL : undefined}
                onPress={() => patch({ vetId: v.id, time: undefined })}
              />
            ))}
          </AsyncBoundary>
        </View>
      ) : null}

      {step === 4 ? (
        <View style={{ gap: 8 }}>
          <SectionTitle>Elige la hora</SectionTitle>
          {slotOptions.length === 0 ? (
            <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
              No hay horarios disponibles para ese veterinario.
            </Text>
          ) : (
            <FilterChips
              options={slotOptions}
              selectedId={sel.time ?? ''}
              onSelect={(id) => patch({ time: id })}
            />
          )}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        {step > 0 ? (
          <Button
            label="Atrás"
            variant="outline"
            disabled={submitting}
            onPress={() => setStep((s) => Math.max(0, s - 1))}
            style={{ flex: 1 }}
          />
        ) : null}
        <Button
          label={isLast ? 'Confirmar' : 'Siguiente'}
          disabled={!canAdvance || submitting}
          loading={submitting}
          onPress={onNext}
          style={{ flex: 1 }}
        />
      </View>
    </MobileShell>
  );
}
