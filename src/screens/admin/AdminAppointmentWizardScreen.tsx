import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
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
  InfoBanner,
  SearchBar,
  SectionTitle,
} from '@/components/ui';
import { ListRow, StepIndicator } from '@/components/domain';
import type { AdminAgendaStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';

import {
  createAdminAppointment,
  getAdminAvailableDays,
  getAdminAvailableVets,
  getAdminTimeSlots,
  listAdminOwners,
  listAdminPetsByOwner,
  listAdminServices,
  type AdminOwner,
  type AdminService,
} from '@/services/admin';
import { useRemoteSearch, type RemoteSearchState } from '@/hooks/useRemoteSearch';
import { ApiError, toApiError } from '@/types/api';
import { clinicMonth, clinicWallDateTime } from '@/utils/clinicTime';
import { formatDate } from '@/utils/format';
import {
  SPECIES_EMOJI,
  SPECIES_LABEL,
  type AvailableVet,
  type Pet,
  type Species,
} from '@/types/models';

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

/** Deduplica veterinarios (el backend repite el id por turnos partidos). */
function uniqueVets(vets: AvailableVet[]): AvailableVet[] {
  const seen = new Set<number>();
  return vets.filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)));
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

export function AdminAppointmentWizardScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  // Mes de la clínica (no del teléfono): el backend calcula "hoy" en su zona. La
  // zona llega con la sesión (`clinic`), así que ya está al abrir el asistente.
  const [{ month, year }] = useState(() => clinicMonth());

  // Dueños y servicios se buscan en el servidor: las listas son paginadas y la
  // primera página (25) no basta para elegir entre todos.
  const owners = useRemoteSearch(searchOwners);
  const services = useRemoteSearch(searchServices);
  const days = useAsync(() => getAdminAvailableDays(month, year));

  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<Selection>({});
  const patch = (p: Partial<Selection>) => setSel((prev) => ({ ...prev, ...p }));

  const [vets, setVets] = useState<AvailableVet[]>([]);
  const [vetsLoading, setVetsLoading] = useState(false);
  const [vetsError, setVetsError] = useState<ApiError | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<ApiError | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  // Todas las mascotas del dueño elegido (antes se filtraba la primera página
  // de todas las mascotas de la clínica y faltaban las demás).
  const [ownerPets, setOwnerPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsError, setPetsError] = useState<ApiError | null>(null);

  const selectOwner = async (ownerId: number) => {
    patch({ ownerId, petId: undefined });
    setOwnerPets([]);
    setPetsLoading(true);
    setPetsError(null);
    try {
      setOwnerPets(await listAdminPetsByOwner(ownerId));
    } catch (e) {
      setPetsError(toApiError(e));
    } finally {
      setPetsLoading(false);
    }
  };

  const selectDay = async (d: string) => {
    patch({ day: d, vetId: undefined, time: undefined });
    setVets([]);
    setSlots([]);
    setVetsLoading(true);
    setVetsError(null);
    try {
      setVets(uniqueVets(await getAdminAvailableVets(d)));
    } catch (e) {
      setVets([]);
      setVetsError(toApiError(e));
    } finally {
      setVetsLoading(false);
    }
  };

  const selectVet = async (vetId: number) => {
    patch({ vetId, time: undefined });
    setSlots([]);
    if (sel.day === undefined || sel.serviceId === undefined) return;
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const result = await getAdminTimeSlots(sel.day, vetId, sel.serviceId);
      setSlots(result.flatMap((s) => (s.available ? [s.time] : [])));
    } catch (e) {
      setSlots([]);
      setSlotsError(toApiError(e));
    } finally {
      setSlotsLoading(false);
    }
  };

  const canAdvance =
    (step === 0 && sel.ownerId !== undefined) ||
    (step === 1 && sel.petId !== undefined) ||
    (step === 2 && sel.serviceId !== undefined) ||
    (step === 3 && sel.day !== undefined) ||
    (step === 4 && sel.vetId !== undefined) ||
    (step === 5 && sel.time !== undefined);

  const isLast = step === STEP_LABELS.length - 1;

  const submit = async () => {
    const { ownerId, petId, serviceId, day, vetId, time } = sel;
    if (
      ownerId === undefined ||
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
      await createAdminAppointment({
        owner_id: ownerId,
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
    if (isLast) void submit();
    else setStep((s) => s + 1);
  };

  const dayOptions = (days.data ?? []).map((d) => ({ id: d, label: formatDate(d) }));
  const slotOptions = slots.map((s) => ({ id: s, label: s }));

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Nueva cita" onBack={back} />}
      contentStyle={{ gap: 16, paddingBottom: 32 }}
    >
      <StepIndicator steps={STEP_LABELS.length} current={step} labels={STEP_LABELS} />

      {submitError ? <InfoBanner tone="destructive" message={submitError} /> : null}

      {step === 0 ? (
        <OwnerStep
          owners={owners}
          selectedId={sel.ownerId}
          onSelect={(id) => void selectOwner(id)}
        />
      ) : null}

      {step === 1 ? (
        <PetStep
          loading={petsLoading}
          error={petsError}
          onRetry={() => {
            if (sel.ownerId !== undefined) void selectOwner(sel.ownerId);
          }}
          ownerPets={ownerPets}
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
        <StepSection
          title="Elige el día"
          boundary={{
            loading: days.loading && days.data === null,
            error: days.error,
            onRetry: days.reload,
            empty: (days.data ?? []).length === 0,
            emptyIcon: 'calendar',
            emptyTitle: 'Sin días disponibles',
            emptyDescription: 'No hay disponibilidad este mes.',
          }}
        >
          <FilterChips
            options={dayOptions}
            selectedId={sel.day ?? ''}
            onSelect={(id) => void selectDay(id)}
          />
        </StepSection>
      ) : null}

      {step === 4 ? (
        <StepSection
          title="Elige el veterinario"
          boundary={{
            loading: vetsLoading,
            error: vetsError,
            onRetry: () => {
              if (sel.day) void selectDay(sel.day);
            },
            empty: vets.length === 0,
            emptyIcon: 'person',
            emptyTitle: 'Sin veterinarios',
            emptyDescription: 'No hay veterinarios disponibles ese día.',
          }}
        >
          {vets.map((v) => (
            <ListRow
              key={v.id}
              title={`${v.first_name} ${v.last_name}`}
              showChevron={false}
              trailing={sel.vetId === v.id ? CHECK_EL : undefined}
              onPress={() => void selectVet(v.id)}
            />
          ))}
        </StepSection>
      ) : null}

      {step === 5 ? (
        <StepSection
          title="Elige la hora"
          boundary={{
            loading: slotsLoading,
            error: slotsError,
            onRetry: () => {
              if (sel.vetId !== undefined) void selectVet(sel.vetId);
            },
            empty: slotOptions.length === 0,
            emptyIcon: 'time',
            emptyTitle: 'Sin horarios',
            emptyDescription: 'No hay horarios disponibles para ese veterinario.',
          }}
        >
          <FilterChips
            options={slotOptions}
            selectedId={sel.time ?? ''}
            onSelect={(id) => patch({ time: id })}
          />
        </StepSection>
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
