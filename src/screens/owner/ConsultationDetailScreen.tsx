import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Alert, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import {
  AsyncBoundary,
  Badge,
  Button,
  Card,
  InfoBanner,
  SectionTitle,
} from '@/components/ui';
import type { OwnerPetsStackParamList } from '@/navigation/types';
import { useConsultationCare, type ConsultationCare } from '@/hooks/useConsultationCare';
import { formatDate } from '@/utils/format';
import type { Consultation, PrescriptionItem } from '@/types/models';

type Nav = NativeStackNavigationProp<OwnerPetsStackParamList>;

function Field({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{label}</Text>
      <Text style={{ fontSize: 15, color: colors.foreground }}>{value}</Text>
    </View>
  );
}

function confirmCompleteTreatment(onConfirm: () => void) {
  Alert.alert(
    'Completar tratamiento',
    'Avisarás a la clínica que terminaste todo el tratamiento de esta consulta.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, completar', onPress: onConfirm },
    ],
  );
}

function PrescriptionItemRow({
  item,
  petId,
  care,
}: {
  item: PrescriptionItem;
  petId: number;
  care: ConsultationCare;
}) {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const completed = care.isItemCompleted(item);
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ flex: 1, fontSize: 14, color: colors.foreground }}>
          • {item.medication_name}
          {item.dose ? ` — ${item.dose}` : ''}
          {item.frequency ? `, ${item.frequency}` : ''}
          {item.duration ? `, ${item.duration}` : ''}
        </Text>
        {completed ? <Badge label="Completado" variant="success" /> : null}
      </View>
      {completed ? null : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Button
            label="Tratamiento iniciado 💊"
            variant="outline"
            size="sm"
            onPress={() =>
              navigation.navigate('TreatmentStart', {
                petId,
                prescriptionItemId: item.id,
                medicationName: item.medication_name,
                dose: item.dose ?? undefined,
                frequency: item.frequency ?? undefined,
                duration: item.duration ?? undefined,
              })
            }
          />
          <Button
            label="Marcar completado"
            accessibilityLabel={`Marcar completado: ${item.medication_name}`}
            variant="secondary"
            size="sm"
            loading={care.busy === `item-${item.id}`}
            disabled={care.busy !== null}
            onPress={() => void care.completeItem(item.id)}
          />
        </View>
      )}
    </View>
  );
}

function TreatmentCard({
  consultation,
  care,
}: {
  consultation: Consultation;
  care: ConsultationCare;
}) {
  const { colors } = useTheme();
  if (!consultation.treatment) return null;
  return (
    <Card style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ flex: 1, fontWeight: '600', color: colors.foreground }}>
          Tratamiento
        </Text>
        {care.treatmentCompleted ? <Badge label="Completado" variant="success" /> : null}
      </View>
      <Text style={{ fontSize: 15, color: colors.foreground }}>
        {consultation.treatment}
      </Text>
      {care.treatmentCompleted ? (
        <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
          Completado el {formatDate(consultation.treatment_completed_at)}
        </Text>
      ) : (
        <Button
          label="Completar tratamiento"
          variant="outline"
          fullWidth
          loading={care.busy === 'treatment'}
          disabled={care.busy !== null}
          onPress={() => confirmCompleteTreatment(() => void care.completeTreatment())}
        />
      )}
    </Card>
  );
}

function Body({
  consultation,
  petId,
  care,
}: {
  consultation: Consultation;
  petId: number;
  care: ConsultationCare;
}) {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const vitals = [
    consultation.weight != null ? `Peso: ${consultation.weight} kg` : null,
    consultation.temperature != null ? `Temp: ${consultation.temperature}°` : null,
    consultation.heart_rate != null ? `FC: ${consultation.heart_rate}` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <>
      <Card style={{ gap: 10 }}>
        <Field label="Fecha" value={formatDate(consultation.consultation_date)} />
        <Field label="Veterinario" value={consultation.veterinarian.full_name} />
        {consultation.diagnosis ? (
          <Field label="Diagnóstico" value={consultation.diagnosis} />
        ) : null}
        {vitals ? <Field label="Signos vitales" value={vitals} /> : null}
        {consultation.notes ? <Field label="Notas" value={consultation.notes} /> : null}
      </Card>

      {care.notice ? <InfoBanner tone="success" message={care.notice} /> : null}
      {care.actionError ? (
        <InfoBanner tone="destructive" message={care.actionError} />
      ) : null}

      <TreatmentCard consultation={consultation} care={care} />

      {consultation.prescriptions.length > 0 ? (
        <>
          <SectionTitle>Recetas</SectionTitle>
          {consultation.prescriptions.map((p) => (
            <Card key={p.id} style={{ gap: 8 }}>
              {p.diagnosis ? (
                <Text style={{ fontWeight: '600', color: colors.foreground }}>
                  {p.diagnosis}
                </Text>
              ) : null}
              {p.general_instructions ? (
                <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                  {p.general_instructions}
                </Text>
              ) : null}
              {p.items.map((it) => (
                <PrescriptionItemRow key={it.id} item={it} petId={petId} care={care} />
              ))}
            </Card>
          ))}
          <Button
            label="Descargar receta (PDF)"
            variant="outline"
            fullWidth
            loading={care.busy === 'recipe'}
            disabled={care.busy !== null}
            onPress={() => void care.exportRecipe()}
          />
        </>
      ) : null}

      {consultation.lab_exams.length > 0 ? (
        <Button
          label={`Ver exámenes de laboratorio (${consultation.lab_exams.length})`}
          variant="outline"
          fullWidth
          onPress={() =>
            navigation.navigate('LabExams', { petId, consultationId: consultation.id })
          }
        />
      ) : null}
    </>
  );
}

export function ConsultationDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<OwnerPetsStackParamList, 'ConsultationDetail'>>();
  const { petId, id } = route.params;
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const care = useConsultationCare(petId, id);
  const { consultation } = care;

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Consulta" onBack={back} />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      <AsyncBoundary
        loading={care.loading && consultation === null && !care.notFound}
        error={care.error}
        onRetry={care.reload}
        empty={care.notFound}
        emptyIcon="document-text"
        emptyTitle="Consulta no encontrada"
      >
        {consultation ? (
          <Body consultation={consultation} petId={petId} care={care} />
        ) : null}
      </AsyncBoundary>
    </MobileShell>
  );
}
