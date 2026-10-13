import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Linking, StyleSheet, Text, View } from 'react-native';

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
import { LabExamStatusBadge, ListRow } from '@/components/domain';
import type { OwnerPetsStackParamList } from '@/navigation/types';
import { useLabExam, type LabExamState } from '@/hooks/useLabExam';
import type { LabExamAttachment } from '@/types/models';
import { formatLabResults } from '@/utils/labResults';
import { absoluteServerUrl } from '@/utils/serverUrl';

function openAttachment(file: LabExamAttachment) {
  const url = absoluteServerUrl(file.file_url);
  if (url) void Linking.openURL(url);
}

function FilesSection({ state }: { state: LabExamState }) {
  const { colors } = useTheme();
  const { uploading, uploads } = state;
  const busy = uploading !== null || state.saving;
  return (
    <>
      <SectionTitle>Archivos</SectionTitle>
      <Card style={styles.card}>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Envía a la clínica el informe del laboratorio: PDF o fotos (JPG, PNG o WebP) de
          hasta 10 MB.
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
      {uploads.map((file) => (
        <ListRow
          key={file.id}
          title={file.filename}
          subtitle={
            file.content_type === 'application/pdf' ? 'PDF enviado' : 'Imagen enviada'
          }
          onPress={() => openAttachment(file)}
        />
      ))}
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

export function LabExamDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<OwnerPetsStackParamList, 'LabExamDetail'>>();
  const { petId, consultationId, examId } = route.params;
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const state = useLabExam(petId, consultationId, examId);
  const { exam } = state;

  return (
    <MobileShell
      scroll
      header={<AppHeader title={exam?.exam_name ?? 'Examen'} onBack={back} />}
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
        {exam ? (
          <>
            <Card style={styles.card}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  {exam.exam_name}
                </Text>
                <LabExamStatusBadge status={exam.status} />
              </View>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                {formatLabResults(exam.results) ?? 'Sin resultados todavía.'}
              </Text>
            </Card>

            {state.notice ? <InfoBanner tone="success" message={state.notice} /> : null}
            {state.actionError ? (
              <InfoBanner tone="destructive" message={state.actionError} />
            ) : null}

            {state.editable ? (
              <>
                <FilesSection state={state} />
                <ResultsForm state={state} />
              </>
            ) : (
              <InfoBanner
                tone="info"
                message="Este examen ya no admite archivos ni resultados: la clínica lo cerró."
              />
            )}
          </>
        ) : null}
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
