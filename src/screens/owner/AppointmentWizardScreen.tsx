import { useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import {
  AsyncBoundary,
  Avatar,
  Button,
  FilterChips,
  IconButton,
  InfoBanner,
  SectionTitle,
  TextField,
} from '@/components/ui';
import { ListRow, StepIndicator } from '@/components/domain';
import type { OwnerAppointmentsStackParamList } from '@/navigation/types';
import {
  useAppointmentBooking,
  type AppointmentBooking,
} from '@/hooks/useAppointmentBooking';
import { formatDate } from '@/utils/format';
import { SPECIES_EMOJI, SPECIES_LABEL } from '@/types/models';

type Nav = NativeStackNavigationProp<OwnerAppointmentsStackParamList>;

const STEP_LABELS = ['Mascota', 'Servicio', 'Día', 'Veterinario', 'Hora'];
const LAST_STEP = STEP_LABELS.length - 1;

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

function Check() {
  const { colors } = useTheme();
  return <Text style={{ color: colors.primary, fontWeight: '700' }}>✓</Text>;
}

// Elemento estático hoisteado: el color se resuelve dentro de <Check /> vía useTheme.
const CHECK_EL = <Check />;

type StepProps = { booking: AppointmentBooking };

function PetStep({ booking }: StepProps) {
  const { pets, selection } = booking;
  return (
    <View style={styles.step}>
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
            trailing={selection.petId === pet.id ? CHECK_EL : undefined}
            onPress={() => booking.selectPet(pet.id)}
          />
        ))}
      </AsyncBoundary>
    </View>
  );
}

function ServiceStep({ booking }: StepProps) {
  const { services, selection } = booking;
  return (
    <View style={styles.step}>
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
            trailing={selection.serviceId === s.id ? CHECK_EL : undefined}
            onPress={() => booking.selectService(s.id)}
          />
        ))}
      </AsyncBoundary>
    </View>
  );
}

function DayStep({ booking }: StepProps) {
  const { colors } = useTheme();
  const { days, month, selection } = booking;
  const monthLabel = `${MONTH_NAMES[month.month - 1]} ${month.year}`;
  return (
    <View style={styles.step}>
      <SectionTitle>Elige el día</SectionTitle>
      <View style={styles.monthBar}>
        <IconButton
          icon="chevron-back"
          accessibilityLabel="Mes anterior"
          disabled={!booking.canGoPrevMonth || days.loading}
          onPress={() => void booking.prevMonth()}
        />
        <Text
          accessibilityRole="header"
          style={[styles.monthLabel, { color: colors.foreground }]}
        >
          {monthLabel}
        </Text>
        <IconButton
          icon="chevron-forward"
          accessibilityLabel="Mes siguiente"
          disabled={!booking.canGoNextMonth || days.loading}
          onPress={() => void booking.nextMonth()}
        />
      </View>
      <AsyncBoundary
        loading={days.loading}
        error={days.error}
        onRetry={days.reload}
        empty={days.data.length === 0}
        emptyIcon="calendar"
        emptyTitle="Sin días disponibles"
        emptyDescription="No hay disponibilidad en este mes. Prueba con el siguiente."
      >
        <FilterChips
          options={days.data.map((d) => ({ id: d, label: formatDate(d) }))}
          selectedId={selection.day ?? ''}
          onSelect={(id) => void booking.selectDay(id)}
        />
      </AsyncBoundary>
    </View>
  );
}

function VetStep({ booking }: StepProps) {
  const { vets, selection } = booking;
  return (
    <View style={styles.step}>
      <SectionTitle>Elige el veterinario</SectionTitle>
      <AsyncBoundary
        loading={vets.loading}
        error={vets.error}
        onRetry={vets.reload}
        empty={vets.data.length === 0}
        emptyIcon="person"
        emptyTitle="Sin veterinarios"
        emptyDescription="No hay veterinarios disponibles ese día."
      >
        {vets.data.map((v) => (
          <ListRow
            key={v.id}
            title={v.name}
            subtitle={v.shifts.map((s) => `${s.start_time} – ${s.end_time}`).join(' · ')}
            showChevron={false}
            trailing={selection.vetId === v.id ? CHECK_EL : undefined}
            onPress={() => void booking.selectVet(v.id)}
          />
        ))}
      </AsyncBoundary>
    </View>
  );
}

function TimeStep({ booking }: StepProps) {
  const { slots, selection } = booking;
  return (
    <View style={styles.step}>
      <SectionTitle>Elige la hora</SectionTitle>
      <AsyncBoundary
        loading={slots.loading}
        error={slots.error}
        onRetry={slots.reload}
        empty={slots.data.length === 0}
        emptyIcon="time"
        emptyTitle="Sin horarios libres"
        emptyDescription="Ese veterinario no tiene horarios libres ese día. Elige otro día o veterinario."
      >
        <FilterChips
          options={slots.data.map((s) => ({ id: s, label: s }))}
          selectedId={selection.time ?? ''}
          onSelect={booking.selectTime}
        />
      </AsyncBoundary>
      <TextField
        label="Notas (opcional)"
        placeholder="Síntomas o indicaciones para la clínica"
        value={booking.notes}
        onChangeText={booking.setNotes}
        keyboardType="default"
        multiline
      />
    </View>
  );
}

const STEPS = [PetStep, ServiceStep, DayStep, VetStep, TimeStep];

function canAdvance(step: number, booking: AppointmentBooking): boolean {
  const { selection } = booking;
  const done = [
    selection.petId !== undefined,
    selection.serviceId !== undefined,
    selection.day !== undefined,
    selection.vetId !== undefined,
    selection.time !== undefined,
  ];
  return done[step] ?? false;
}

export function AppointmentWizardScreen() {
  const navigation = useNavigation<Nav>();
  const route =
    useRoute<RouteProp<OwnerAppointmentsStackParamList, 'AppointmentWizard'>>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const booking = useAppointmentBooking(route.params?.id, route.params?.date);
  const [step, setStep] = useState(0);

  const isLast = step === LAST_STEP;
  const Step = STEPS[step]!;
  const title = booking.isEditing ? 'Reprogramar cita' : 'Agendar cita';

  const onNext = async () => {
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    const saved = await booking.submit();
    if (saved) back?.();
  };

  return (
    <MobileShell
      scroll
      header={<AppHeader title={title} onBack={back} />}
      contentStyle={styles.content}
    >
      <AsyncBoundary loading={booking.initializing} error={booking.initError}>
        <StepIndicator steps={STEP_LABELS.length} current={step} labels={STEP_LABELS} />

        {booking.initialDayUnavailable ? (
          <InfoBanner
            tone="info"
            message="El día elegido en el calendario no tiene horarios disponibles. Elige otro día."
          />
        ) : null}

        {booking.submitError ? (
          <InfoBanner tone="destructive" message={booking.submitError} />
        ) : null}

        <Step booking={booking} />

        <View style={styles.actions}>
          {step > 0 ? (
            <Button
              label="Atrás"
              variant="outline"
              disabled={booking.submitting}
              onPress={() => setStep((s) => Math.max(0, s - 1))}
              style={styles.flex}
            />
          ) : null}
          <Button
            label={
              isLast ? (booking.isEditing ? 'Guardar cambios' : 'Confirmar') : 'Siguiente'
            }
            disabled={!canAdvance(step, booking) || booking.submitting}
            loading={booking.submitting}
            onPress={() => void onNext()}
            style={styles.flex}
          />
        </View>
      </AsyncBoundary>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingBottom: 32 },
  step: { gap: 8 },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: { fontSize: 16, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  flex: { flex: 1 },
});
