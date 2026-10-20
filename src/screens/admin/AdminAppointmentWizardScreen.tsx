import { useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import {
  AsyncBoundary,
  type AsyncBoundaryProps,
  Avatar,
  Button,
  FilterChips,
  IconButton,
  InfoBanner,
  SearchBar,
  SectionTitle,
} from '@/components/ui';
import { ListRow, StepIndicator } from '@/components/domain';
import type { AdminAgendaStackParamList } from '@/navigation/types';
import { useAdminSchedule, type AdminScheduleState } from '@/hooks/useAdminSchedule';

import {
  createAdminAppointment,
  listAdminOwners,
  listAdminServices,
  type AdminAppointmentInput,
  type AdminOwner,
  type AdminService,
} from '@/services/admin';
import { useOwnerPets } from '@/hooks/useOwnerPets';
import { useRemoteSearch, type RemoteSearchState } from '@/hooks/useRemoteSearch';
import { ApiError } from '@/types/api';
import { clinicWallDateTime } from '@/utils/clinicTime';
import { formatDate } from '@/utils/format';
import { SPECIES_EMOJI, SPECIES_LABEL, type Pet, type Species } from '@/types/models';

type Nav = NativeStackNavigationProp<AdminAgendaStackParamList>;

const STEP_LABELS = ['Dueño', 'Mascota', 'Servicio', 'Día', 'Veterinario', 'Hora'];

interface Selection {
  ownerId?: number;
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

const searchOwners = (query: string) => listAdminOwners({ search: query || undefined });
const searchServices = (query: string) =>
  listAdminServices({ search: query || undefined });

function ownerName(o: AdminOwner): string {
  return o.full_name ?? `${o.first_name} ${o.last_name}`.trim();
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/** Paso «Día»: navegación por meses (antes solo el mes en curso). */
function DayStep({
  schedule,
  selectedDay,
  onSelect,
}: {
  schedule: AdminScheduleState;
  selectedDay?: string;
  onSelect: (day: string) => void;
}) {
  const { colors } = useTheme();
  const { days, month } = schedule;
  return (
    <StepSection
      title="Elige el día"
      boundary={{
        loading: days.loading,
        error: days.error,
        onRetry: () => void days.reload(),
        empty: days.data.length === 0,
        emptyIcon: 'calendar',
        emptyTitle: 'Sin días disponibles',
        emptyDescription: 'No hay disponibilidad este mes. Prueba con el siguiente.',
      }}
      search={
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Mes anterior"
            disabled={!schedule.canGoPrevMonth || days.loading}
            onPress={() => void schedule.prevMonth()}
          />
          <Text
            accessibilityRole="header"
            style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}
          >
            {`${MONTH_NAMES[month.month - 1]} ${month.year}`}
          </Text>
          <IconButton
            icon="chevron-forward"
            accessibilityLabel="Mes siguiente"
            disabled={!schedule.canGoNextMonth || days.loading}
            onPress={() => void schedule.nextMonth()}
          />
        </View>
      }
    >
      <FilterChips
        options={days.data.map((d) => ({ id: d, label: formatDate(d) }))}
        selectedId={selectedDay ?? ''}
        onSelect={onSelect}
      />
    </StepSection>
  );
}

/** Sección de un paso del asistente: título + estados de carga/error/vacío. */
function StepSection({
  title,
  search,
  boundary,
  children,
}: {
  title: string;
  /** Buscador en el servidor (listas paginadas del backend). */
  search?: React.ReactNode;
  boundary: Omit<AsyncBoundaryProps, 'children'>;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>{title}</SectionTitle>
      {search}
      <AsyncBoundary {...boundary}>{children}</AsyncBoundary>
    </View>
  );
}

function OwnerStep({
  owners,
  selectedId,
  onSelect,
}: {
  owners: RemoteSearchState<AdminOwner>;
  selectedId?: number;
  onSelect: (id: number) => void;
}) {
  return (
    <StepSection
      title="Elige el dueño"
      search={
        <SearchBar
          value={owners.query}
          onChangeText={owners.setQuery}
          placeholder="Buscar por nombre, correo o documento"
        />
      }
      boundary={{
        loading: owners.loading && owners.data === null,
        error: owners.error,
        onRetry: () => void owners.reload(),
        empty: !owners.loading && (owners.data ?? []).length === 0,
        emptyIcon: 'person',
        emptyTitle: 'Sin dueños',
        emptyDescription: owners.query ? 'Prueba con otra búsqueda.' : undefined,
      }}
    >
      {(owners.data ?? []).map((o) => (
        <ListRow
          key={o.id}
          title={ownerName(o)}
          subtitle={o.email}
          showChevron={false}
          trailing={selectedId === o.id ? CHECK_EL : undefined}
          onPress={() => onSelect(o.id)}
        />
      ))}
    </StepSection>
  );
}

function PetStep({
  loading,
  error,
  onRetry,
  ownerPets,
  selectedId,
  onSelect,
}: {
  loading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  ownerPets: Pet[];
  selectedId?: number;
  onSelect: (id: number) => void;
}) {
  return (
    <StepSection
      title="Elige la mascota"
      boundary={{
        loading,
        error,
        onRetry,
        empty: ownerPets.length === 0,
        emptyIcon: 'paw',
        emptyTitle: 'Sin mascotas',
        emptyDescription: 'Este dueño no tiene mascotas registradas.',
      }}
    >
      {ownerPets.map((pet) => (
        <ListRow
          key={pet.id}
          title={pet.name}
          subtitle={SPECIES_LABEL[pet.species]}
          leading={() => (
            <Avatar
              uri={pet.photo_url ?? undefined}
              fallback={SPECIES_EMOJI[pet.species as Species]}
            />
          )}
          showChevron={false}
          trailing={selectedId === pet.id ? CHECK_EL : undefined}
          onPress={() => onSelect(pet.id)}
        />
      ))}
    </StepSection>
  );
}

function ServiceStep({
  services,
  selectedId,
  onSelect,
}: {
  services: RemoteSearchState<AdminService>;
  selectedId?: number;
  onSelect: (id: number) => void;
}) {
  return (
    <StepSection
      title="Elige el servicio"
      search={
        <SearchBar
          value={services.query}
          onChangeText={services.setQuery}
          placeholder="Buscar servicio"
        />
      }
      boundary={{
        loading: services.loading && services.data === null,
        error: services.error,
        onRetry: () => void services.reload(),
        empty: !services.loading && (services.data ?? []).length === 0,
        emptyIcon: 'medkit',
        emptyTitle: 'Sin servicios',
        emptyDescription: services.query ? 'Prueba con otra búsqueda.' : undefined,
      }}
    >
      {(services.data ?? []).map((s) => (
        <ListRow
          key={s.id}
          title={s.name}
          subtitle={s.duration_minutes ? `${s.duration_minutes} min` : undefined}
          showChevron={false}
          trailing={selectedId === s.id ? CHECK_EL : undefined}
          onPress={() => onSelect(s.id)}
        />
      ))}
    </StepSection>
  );
}

/** Qué dato exige cada paso para poder avanzar. */
const STEP_FIELD: (keyof Selection)[] = [
  'ownerId',
  'petId',
  'serviceId',
  'day',
  'vetId',
  'time',
];

/** Datos de la cita a crear, o null si falta alguno. */
function appointmentInput(sel: Selection): AdminAppointmentInput | null {
  const { ownerId, petId, serviceId, day, vetId, time } = sel;
  if (STEP_FIELD.some((field) => sel[field] === undefined)) return null;
  return {
    owner_id: ownerId!,
    pet_id: petId!,
    service_id: serviceId!,
    assigned_to_id: vetId!,
    scheduled_at: clinicWallDateTime(day!, time!),
  };
}

function VetStep({
  schedule,
  selectedId,
  onSelect,
  onRetry,
}: {
  schedule: AdminScheduleState;
  selectedId?: number;
  onSelect: (vetId: number) => void;
  onRetry: () => void;
}) {
  const { vets } = schedule;
  return (
    <StepSection
      title="Elige el veterinario"
      boundary={{
        loading: vets.loading,
        error: vets.error,
        onRetry,
        empty: vets.data.length === 0,
        emptyIcon: 'person',
        emptyTitle: 'Sin veterinarios',
        emptyDescription: 'No hay veterinarios disponibles ese día.',
      }}
    >
      {vets.data.map((v) => (
        <ListRow
          key={v.id}
          title={`${v.first_name} ${v.last_name}`}
          showChevron={false}
          trailing={selectedId === v.id ? CHECK_EL : undefined}
          onPress={() => onSelect(v.id)}
        />
      ))}
    </StepSection>
  );
}

function SlotStep({
  schedule,
  selected,
  onSelect,
  onRetry,
}: {
  schedule: AdminScheduleState;
  selected?: string;
  onSelect: (time: string) => void;
  onRetry: () => void;
}) {
  const { slots } = schedule;
  return (
    <StepSection
      title="Elige la hora"
      boundary={{
        loading: slots.loading,
        error: slots.error,
        onRetry,
        empty: slots.data.length === 0,
        emptyIcon: 'time',
        emptyTitle: 'Sin horarios',
        emptyDescription: 'No hay horarios disponibles para ese veterinario.',
      }}
    >
      <FilterChips
        options={slots.data.map((t) => ({ id: t, label: t }))}
        selectedId={selected ?? ''}
        onSelect={onSelect}
      />
    </StepSection>
  );
}

export function AdminAppointmentWizardScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const route =
    useRoute<RouteProp<AdminAgendaStackParamList, 'AdminAppointmentWizard'>>();

  // Dueños y servicios se buscan en el servidor: las listas son paginadas y la
  // primera página (25) no basta para elegir entre todos.
  const owners = useRemoteSearch(searchOwners);
  const services = useRemoteSearch(searchServices);
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<Selection>({});
  const patch = (p: Partial<Selection>) => setSel((prev) => ({ ...prev, ...p }));

  // Días (por mes), veterinarios y horarios; solo cuenta la última respuesta.
  // Desde el calendario llega el día: si tiene agenda queda elegido.
  const schedule = useAdminSchedule({
    initialDay: route.params?.date,
    onInitialDay: (day) =>
      setSel((prev) => (prev.day === undefined ? { ...prev, day } : prev)),
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  // Todas las mascotas del dueño elegido (antes se filtraba la primera página
  // de todas las mascotas de la clínica y faltaban las demás).
  const ownerPets = useOwnerPets(sel.ownerId);

  const selectOwner = (ownerId: number) => patch({ ownerId, petId: undefined });

  const selectDay = (d: string) => {
    patch({ day: d, vetId: undefined, time: undefined });
    void schedule.loadVets(d);
  };

  const selectVet = (vetId: number) => {
    patch({ vetId, time: undefined });
    if (sel.day === undefined || sel.serviceId === undefined) {
      schedule.clearSlots();
      return;
    }
    void schedule.loadSlots(sel.day, vetId, sel.serviceId);
  };

  const canAdvance = sel[STEP_FIELD[step]!] !== undefined;

  const isLast = step === STEP_LABELS.length - 1;

  const submit = async () => {
    const input = appointmentInput(sel);
    if (!input) return;
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      await createAdminAppointment(input);
      back?.();
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : 'No se pudo agendar la cita.');
    } finally {
      setSubmitting(false);
    }
  };

  const onNext = () => {
    if (isLast) void submit();
    else setStep((s) => s + 1);
  };

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Nueva cita" onBack={back} />}
      contentStyle={{ gap: 16, paddingBottom: 32 }}
    >
      <StepIndicator steps={STEP_LABELS.length} current={step} labels={STEP_LABELS} />

      {schedule.initialDayUnavailable ? (
        <InfoBanner
          tone="info"
          message="El día elegido en el calendario no tiene horarios disponibles. Elige otro día."
        />
      ) : null}

      {submitError ? <InfoBanner tone="destructive" message={submitError} /> : null}

      {step === 0 ? (
        <OwnerStep owners={owners} selectedId={sel.ownerId} onSelect={selectOwner} />
      ) : null}

      {step === 1 ? (
        <PetStep
          loading={ownerPets.loading}
          error={ownerPets.error}
          onRetry={() => void ownerPets.reload()}
          ownerPets={ownerPets.pets}
          selectedId={sel.petId}
          onSelect={(id) => patch({ petId: id })}
        />
      ) : null}

      {step === 2 ? (
        <ServiceStep
          services={services}
          selectedId={sel.serviceId}
          onSelect={(id) => patch({ serviceId: id, vetId: undefined, time: undefined })}
        />
      ) : null}

      {step === 3 ? (
        <DayStep schedule={schedule} selectedDay={sel.day} onSelect={selectDay} />
      ) : null}

      {step === 4 ? (
        <VetStep
          schedule={schedule}
          selectedId={sel.vetId}
          onSelect={selectVet}
          onRetry={() => sel.day && selectDay(sel.day)}
        />
      ) : null}

      {step === 5 ? (
        <SlotStep
          schedule={schedule}
          selected={sel.time}
          onSelect={(time) => patch({ time })}
          onRetry={() => sel.vetId !== undefined && selectVet(sel.vetId)}
        />
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
          label={isLast ? 'Agendar cita' : 'Siguiente'}
          disabled={!canAdvance || submitting}
          loading={submitting}
          onPress={onNext}
          style={{ flex: 1 }}
        />
      </View>

      <Text style={{ fontSize: 12, textAlign: 'center', color: colors.mutedForeground }}>
        Paso {step + 1} de {STEP_LABELS.length}
      </Text>
    </MobileShell>
  );
}
