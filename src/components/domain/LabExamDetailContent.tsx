import { useState } from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import {
  AsyncBoundary,
  Button,
  Card,
  IconButton,
  InfoBanner,
  SectionTitle,
  TextField,
} from '@/components/ui';
import { LabExamStatusBadge } from './LabExamStatusBadge';
import { ListRow } from './ListRow';
import type { LabExamAudience, LabExamDetail } from '@/types/labExams';
import { useLabExam, type LabExamState } from '@/hooks/useLabExam';
import type { LabExamAttachment } from '@/types/models';
import { formatLabResults } from '@/utils/labResults';
import { absoluteServerUrl } from '@/utils/serverUrl';

function openAttachment(file: LabExamAttachment) {
  const url = absoluteServerUrl(file.file_url);
  if (url)
    void Linking.openURL(url).catch(() =>
      Alert.alert('No se pudo abrir el archivo', 'Inténtalo de nuevo.'),
    );
}

function Attachment({ file }: { file: LabExamAttachment }) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const url = absoluteServerUrl(file.file_url);
  return (
    <Card padding={0}>
      {url && file.content_type.startsWith('image/') && !failed ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver foto ${file.filename}`}
          onPress={() => openAttachment(file)}
        >
          <Image
            source={{ uri: url }}
            accessibilityLabel={file.description ?? file.filename}
            style={{ width: '100%', height: 200 }}
            resizeMode="contain"
            onError={() => setFailed(true)}
          />
        </Pressable>
      ) : null}
      {failed ? (
        <Text style={{ color: colors.mutedForeground, padding: 12 }}>
          No se pudo cargar la vista previa. Puedes abrir el archivo.
        </Text>
      ) : null}
      <ListRow
        title={file.filename}
        subtitle={
          file.description ??
          (file.content_type === 'application/pdf' ? 'Informe PDF' : 'Foto del resultado')
        }
        onPress={() => openAttachment(file)}
      />
    </Card>
  );
}

function FilesSection({ state }: { state: LabExamState }) {
  const { colors } = useTheme();
  const { uploading, uploads } = state;
  const busy = uploading !== null || state.saving;
  return (
    <>
      <SectionTitle>Archivos</SectionTitle>
      {state.editable ? (
        <Card style={styles.card}>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Adjunta informes o fotos del resultado (PDF, JPG, PNG o WebP, hasta 10 MB).
            Quedarán disponibles en el historial de la mascota.
          </Text>
          <Button
            label="Subir PDF o documento"
            variant="outline"
            fullWidth
            disabled={busy}
            onPress={() => void state.uploadFromDocuments()}
          />
          <Button
            label="Elegir fotos de la galería"
            variant="outline"
            fullWidth
            disabled={busy}
            onPress={() => void state.uploadFromGallery()}
          />
          {uploading ? (
            <Text style={[styles.hint, { color: colors.foreground }]}>
              Subiendo {uploading.done + 1} de {uploading.total}…
            </Text>
          ) : null}
        </Card>
      ) : null}
      {uploads.map((file) => (
        <Attachment key={file.id} file={file} />
      ))}
      {uploads.length === 0 ? (
        <Text style={{ color: colors.mutedForeground }}>Sin archivos adjuntos.</Text>
      ) : null}
    </>
  );
}

function ResultsForm({ state }: { state: LabExamState }) {
  const busy = state.saving || state.uploading !== null;
  return (
    <>
      <SectionTitle>Resultados</SectionTitle>
      <Card style={styles.card}>
        {state.rows.map((row, index) => (
          <View key={row.key} style={styles.row}>
            <View style={styles.rowFields}>
              <TextField
                label={`Parámetro ${index + 1}`}
                placeholder="Ej.: Hemoglobina"
                keyboardType="default"
                autoCapitalize="sentences"
                value={row.parameter}
                onChangeText={(parameter) => state.setRow(index, { parameter })}
              />
              <TextField
                label={`Valor ${index + 1}`}
                placeholder="Ej.: 13 g/dL"
                keyboardType="default"
                autoCapitalize="none"
                value={row.value}
                onChangeText={(value) => state.setRow(index, { value })}
              />
            </View>
            <IconButton
              icon="trash-outline"
              accessibilityLabel={`Quitar parámetro ${index + 1}`}
              onPress={() => state.removeRow(index)}
            />
          </View>
        ))}
        <Button
          label="Agregar parámetro"
          variant="ghost"
          size="sm"
          disabled={busy}
          onPress={state.addRow}
        />
        <Button
          label="Guardar resultados"
          fullWidth
          loading={state.saving}
          disabled={busy}
          onPress={() => void state.saveResults()}
        />
      </Card>
    </>
  );
}

function ExamInstructions({ exam }: { exam: LabExamDetail }) {
  return (
    <>
      {exam.clinical_history ? (
        <ListRow title="Antecedentes" subtitle={exam.clinical_history} />
      ) : null}
      {exam.clinical_signs ? (
        <ListRow title="Signos clínicos" subtitle={exam.clinical_signs} />
      ) : null}
      {exam.special_instructions ? (
        <ListRow title="Instrucciones del examen" subtitle={exam.special_instructions} />
      ) : null}
      {exam.fasting_required ? (
        <InfoBanner tone="info" message="Este examen requiere ayuno." />
      ) : null}
      {exam.sedation_required ? (
        <InfoBanner tone="info" message="Este examen requiere sedación." />
      ) : null}
    </>
  );
}

function ExamBody({ state }: { state: LabExamState }) {
  const { colors } = useTheme();
  const { exam } = state;
  return (
    <>
      {exam ? (
        <>
          <Card style={styles.card}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {exam.pet.name} — {exam.exam_name}
              </Text>
              <LabExamStatusBadge status={exam.status} />
            </View>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Tutor: {exam.pet.proprietary?.full_name ?? 'No registrado'}
            </Text>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              {formatLabResults(exam.results) ?? 'Sin resultados todavía.'}
            </Text>
          </Card>

          {state.notice ? <InfoBanner tone="success" message={state.notice} /> : null}
          {state.actionError ? (
            <InfoBanner tone="destructive" message={state.actionError} />
          ) : null}

          <ExamInstructions exam={exam} />
          <FilesSection state={state} />
          {state.editable ? (
            <>
              <ResultsForm state={state} />
            </>
          ) : (
            <InfoBanner
              tone="info"
              message="La clínica cerró este examen. Los resultados y archivos permanecen disponibles."
            />
          )}
        </>
      ) : null}
    </>
  );
}

export function LabExamDetailContent({
  petId,
  consultationId,
  examId,
  audience = 'owner',
  onBack,
}: {
  petId: number;
  consultationId: number;
  examId: number;
  audience?: LabExamAudience;
  onBack?: () => void;
}) {
  const state = useLabExam(petId, consultationId, examId, audience);
  const { exam } = state;

  return (
    <MobileShell
      scroll
      header={<AppHeader title={exam?.exam_name ?? 'Examen'} onBack={onBack} />}
      contentStyle={styles.content}
    >
      <AsyncBoundary
        loading={state.loading && exam === null}
        error={state.error}
        onRetry={state.reload}
        empty={state.notFound}
        emptyIcon="flask"
        emptyTitle="Examen no encontrado"
        emptyDescription="Puede que la clínica lo haya eliminado."
      >
        <ExamBody state={state} />
      </AsyncBoundary>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 32 },
  card: { gap: 10 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  hint: { fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowFields: { flex: 1, gap: 8 },
});
