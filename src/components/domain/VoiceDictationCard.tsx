import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { Button, Card, InfoBanner, SectionTitle } from '@/components/ui';
import {
  DICTATION_STEPS,
  dictationStep,
  formatRecordingDuration,
  pendingProposals,
} from '@/services/assistant';
import type { DictationPhase } from '@/hooks/useVoiceDictation';
import type { VoiceDictation } from '@/types/assistant';
import { StepIndicator } from './StepIndicator';
import { ToolCallRow } from './ToolCallRow';

export interface VoiceDictationCardProps {
  title: string;
  description: string;
  isRecording: boolean;
  durationMillis: number;
  phase: DictationPhase;
  dictation: VoiceDictation | null;
  /** Error de grabación o del servidor, ya en español. */
  errorMessage: string | null;
  /** El WebSocket está conectado (si no, el progreso llega por consulta periódica). */
  live: boolean;
  busyToolCallId: number | null;
  onStart: () => void;
  onStopAndSend: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onConfirm: (toolCallId: number) => void;
  onReject: (toolCallId: number) => void;
  onConfirmAll: () => void;
  onNew: () => void;
  onOpenConsultation?: () => void;
}

type RecorderControlsProps = Pick<
  VoiceDictationCardProps,
  | 'isRecording'
  | 'durationMillis'
  | 'phase'
  | 'dictation'
  | 'onStart'
  | 'onStopAndSend'
  | 'onCancel'
  | 'onRetry'
>;

function RecorderControls(props: RecorderControlsProps) {
  const { colors } = useTheme();
  if (props.phase === 'sending') {
    return <InfoBanner tone="info" message="Enviando la nota de voz al servidor…" />;
  }
  if (props.phase !== 'idle' && props.phase !== 'error') return null;
  if (props.isRecording) {
    return (
      <View style={styles.block}>
        <Text style={[styles.timer, { color: colors.destructive }]}>
          ● Grabando {formatRecordingDuration(props.durationMillis)}
        </Text>
        <View style={styles.row}>
          <Button
            label="Descartar"
            variant="outline"
            onPress={props.onCancel}
            style={styles.flex}
          />
          <Button
            label="Detener y enviar"
            onPress={props.onStopAndSend}
            style={styles.flex}
          />
        </View>
      </View>
    );
  }
  if (props.phase === 'error' && props.dictation) {
    return <Button label="Reintentar envío" fullWidth onPress={props.onRetry} />;
  }
  return <Button label="🎙️ Grabar nota de voz" fullWidth onPress={props.onStart} />;
}

function DictationProgress({
  dictation,
  phase,
  live,
}: {
  dictation: VoiceDictation;
  phase: DictationPhase;
  live: boolean;
}) {
  const { colors } = useTheme();
  if (dictation.status === 'awaiting_audio') return null;
  return (
    <View style={styles.block}>
      <StepIndicator
        steps={DICTATION_STEPS.length}
        current={dictationStep(dictation.status)}
        labels={DICTATION_STEPS}
      />
      {phase === 'processing' ? (
        <Text style={[styles.muted, { color: colors.mutedForeground }]}>
          {live
            ? 'Procesando… verás cada etapa en tiempo real.'
            : 'Procesando… actualizando cada pocos segundos.'}
        </Text>
      ) : null}
    </View>
  );
}

function DictationResult({ dictation }: { dictation: VoiceDictation }) {
  const { colors } = useTheme();
  const failed = dictation.status === 'failed';
  return (
    <>
      {dictation.error_message ? (
        <InfoBanner
          tone={failed ? 'destructive' : 'warning'}
          message={dictation.error_message}
        />
      ) : null}
      {dictation.summary ? (
        <Text style={[styles.body, { color: colors.foreground }]}>
          {dictation.summary}
        </Text>
      ) : null}
      {dictation.transcript ? (
        <View style={styles.block}>
          <Text style={[styles.label, { color: colors.foreground }]}>Transcripción</Text>
          <Text style={[styles.muted, { color: colors.mutedForeground }]}>
            {dictation.transcript}
          </Text>
        </View>
      ) : null}
    </>
  );
}

type ToolCallsProps = Pick<
  VoiceDictationCardProps,
  'busyToolCallId' | 'onConfirm' | 'onReject' | 'onConfirmAll'
> & { dictation: VoiceDictation };

function DictationToolCalls({ dictation, ...props }: ToolCallsProps) {
  const { colors } = useTheme();
  const visible = dictation.tool_calls.filter((call) => call.risk !== 'read');
  if (visible.length === 0) return null;
  const proposals = pendingProposals(dictation.tool_calls);
  return (
    <View style={styles.block}>
      <Text style={[styles.label, { color: colors.foreground }]}>
        Acciones del asistente
      </Text>
      {visible.map((call) => (
        <ToolCallRow
          key={call.id}
          call={call}
          busy={props.busyToolCallId === call.id}
          onConfirm={() => props.onConfirm(call.id)}
          onReject={() => props.onReject(call.id)}
        />
      ))}
      {proposals.length > 1 ? (
        <Button
          label={`Confirmar las ${proposals.length} propuestas`}
          variant="secondary"
          fullWidth
          onPress={props.onConfirmAll}
        />
      ) : null}
    </View>
  );
}

/** Dictado por voz: grabar → enviar → progreso en vivo → revisar propuestas. */
export function VoiceDictationCard(props: VoiceDictationCardProps) {
  const { colors } = useTheme();
  const { dictation, phase } = props;
  const canOpen = Boolean(props.onOpenConsultation && dictation?.consultation_id);

  return (
    <Card style={styles.card}>
      <SectionTitle>{props.title}</SectionTitle>
      <Text style={[styles.muted, { color: colors.mutedForeground }]}>
        {props.description}
      </Text>
      {props.errorMessage ? (
        <InfoBanner tone="destructive" message={props.errorMessage} />
      ) : null}

      <RecorderControls {...props} />

      {dictation ? (
        <>
          <DictationProgress dictation={dictation} phase={phase} live={props.live} />
          <DictationResult dictation={dictation} />
          <DictationToolCalls {...props} dictation={dictation} />
        </>
      ) : null}

      {phase === 'done' ? (
        <View style={styles.row}>
          {canOpen ? (
            <Button
              label="Ver consulta"
              variant="outline"
              onPress={props.onOpenConsultation}
              style={styles.flex}
            />
          ) : null}
          <Button
            label="Nuevo dictado"
            variant="ghost"
            onPress={props.onNew}
            style={styles.flex}
          />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  muted: { fontSize: 13 },
  body: { fontSize: 15 },
  label: { fontSize: 14, fontWeight: '600' },
  timer: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  block: { gap: 8 },
});
