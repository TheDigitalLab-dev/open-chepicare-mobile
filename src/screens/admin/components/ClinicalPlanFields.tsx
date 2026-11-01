import { useId, useRef } from 'react';
import { Switch, Text, View } from 'react-native';
import { Button, Card, FilterChips, SectionTitle, TextField } from '@/components/ui';
import { useTheme } from '@/theme';
import type {
  ClinicalPlanDraft,
  ClinicalRecordDraft,
  ClinicalSaveProgress,
  ClinicalSection,
  ConsultationDeworming,
  ConsultationVaccination,
  LabExamOrder,
  PrescriptionMedication,
} from '@/types/clinical';

type Plan = ClinicalPlanDraft;
type EditorProps<T> = { value: T; change: (patch: Partial<T>) => void; locked: boolean };

const LAB_EXAM_LABELS: Record<LabExamOrder['exam_type'], string> = {
  hemograma: 'Hemograma',
  bioquimica: 'Bioquímica',
  orina: 'Orina',
  coprologia: 'Coprología',
  citologia: 'Citología',
  biopsia: 'Biopsia',
  radiografia: 'Radiografía',
  ecografia: 'Ecografía',
  electrocardiograma: 'Electrocardiograma',
  other: 'Otro',
};
const VACCINE_LABELS: Record<ConsultationVaccination['vaccine_type'], string> = {
  dhpp: 'DHPP',
  fvrcp: 'FVRCP',
  rabies: 'Antirrábica',
  bordetella: 'Bordetella',
  leptospirosis: 'Leptospirosis',
  lyme: 'Lyme',
  felv: 'Leucemia felina',
  fiv: 'Inmunodeficiencia felina',
  canine_influenza: 'Influenza canina',
  other: 'Otra',
};

function Choice<T extends string>({
  label,
  options,
  value,
  change,
  locked,
}: {
  label: string;
  options: Record<T, string>;
  value: T;
  change: (value: T) => void;
  locked: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 4 }} pointerEvents={locked ? 'none' : 'auto'}>
      <Text style={{ color: colors.foreground }}>{label}</Text>
      <FilterChips
        options={Object.entries<string>(options).map(([id, text]) => ({
          id,
          label: text,
        }))}
        selectedId={value}
        onSelect={(id) => {
          if (Object.hasOwn(options, id)) change(id as T);
        }}
      />
    </View>
  );
}

function Flag({
  label,
  value,
  change,
  locked,
}: {
  label: string;
  value: boolean;
  change: (value: boolean) => void;
  locked: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Text style={{ color: colors.foreground }}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={change}
        disabled={locked}
      />
    </View>
  );
}

function MedicationEditor({
  value,
  change,
  locked,
}: EditorProps<PrescriptionMedication>) {
  return (
    <>
      <TextField
        label="Medicamento"
        keyboardType="default"
        value={value.medication_name}
        onChangeText={(medication_name) => change({ medication_name })}
        editable={!locked}
      />
      <TextField
        label="Dosis del medicamento"
        keyboardType="default"
        value={value.dose}
        onChangeText={(dose) => change({ dose })}
        editable={!locked}
      />
      <TextField
        label="Frecuencia"
        keyboardType="default"
        value={value.frequency}
        onChangeText={(frequency) => change({ frequency })}
        editable={!locked}
      />
      <TextField
        label="Duración"
        keyboardType="default"
        value={value.duration ?? ''}
        onChangeText={(duration) => change({ duration })}
        editable={!locked}
      />
      <TextField
        label="Instrucciones del medicamento"
        keyboardType="default"
        multiline
        value={value.special_instructions ?? ''}
        onChangeText={(special_instructions) => change({ special_instructions })}
        editable={!locked}
      />
    </>
  );
}

function LabEditor({ value, change, locked }: EditorProps<LabExamOrder>) {
  return (
    <>
      <Choice
        label="Tipo de examen"
        options={LAB_EXAM_LABELS}
        value={value.exam_type}
        change={(exam_type) => change({ exam_type })}
        locked={locked}
      />
      <TextField
        label="Nombre del examen"
        keyboardType="default"
        value={value.exam_name}
        onChangeText={(exam_name) => change({ exam_name })}
        editable={!locked}
      />
      <TextField
        label="Antecedentes para el examen"
        keyboardType="default"
        multiline
        value={value.clinical_history ?? ''}
        onChangeText={(clinical_history) => change({ clinical_history })}
        editable={!locked}
      />
      <TextField
        label="Signos clínicos"
        keyboardType="default"
        multiline
        value={value.clinical_signs ?? ''}
        onChangeText={(clinical_signs) => change({ clinical_signs })}
        editable={!locked}
      />
      <Flag
        label="Requiere ayuno"
        value={value.fasting_required ?? false}
        change={(fasting_required) => change({ fasting_required })}
        locked={locked}
      />
      <Flag
        label="Requiere sedación"
        value={value.sedation_required ?? false}
        change={(sedation_required) => change({ sedation_required })}
        locked={locked}
      />
      <TextField
        label="Instrucciones del examen"
        keyboardType="default"
        multiline
        value={value.special_instructions ?? ''}
        onChangeText={(special_instructions) => change({ special_instructions })}
        editable={!locked}
      />
    </>
  );
}

export function VaccinationEditor({
  value,
  change,
  locked,
}: EditorProps<ConsultationVaccination>) {
  return (
    <>
      <Choice
        label="Tipo de vacuna"
        options={VACCINE_LABELS}
        value={value.vaccine_type}
        change={(vaccine_type) => change({ vaccine_type })}
        locked={locked}
      />
      <TextField
        label="Nombre de la vacuna"
        keyboardType="default"
        value={value.vaccine_name}
        onChangeText={(vaccine_name) => change({ vaccine_name })}
        editable={!locked}
      />
      <TextField
        label="Fabricante"
        keyboardType="default"
        value={value.manufacturer ?? ''}
        onChangeText={(manufacturer) => change({ manufacturer })}
        editable={!locked}
      />
      <TextField
        label="Lote"
        keyboardType="default"
        value={value.batch_number ?? ''}
        onChangeText={(batch_number) => change({ batch_number })}
        editable={!locked}
      />
      <TextField
        label="Dosis de vacuna"
        keyboardType="default"
        value={value.dose ?? ''}
        onChangeText={(dose) => change({ dose })}
        editable={!locked}
      />
      <Choice
        label="Vía de la vacuna"
        options={{
          subcutaneous: 'Subcutánea',
          intramuscular: 'Intramuscular',
          intranasal: 'Intranasal',
          oral: 'Oral',
        }}
        value={value.administration_route ?? 'subcutaneous'}
        change={(administration_route) => change({ administration_route })}
        locked={locked}
      />
      <TextField
        label="Próxima dosis de vacuna"
        placeholder="AAAA-MM-DD"
        keyboardType="numbers-and-punctuation"
        value={value.next_due_date ?? ''}
        onChangeText={(next_due_date) => change({ next_due_date })}
        editable={!locked}
      />
      <TextField
        label="Observaciones de vacuna"
        keyboardType="default"
        multiline
        value={value.observations ?? ''}
        onChangeText={(observations) => change({ observations })}
        editable={!locked}
      />
    </>
  );
}

function DewormingEditor({ value, change, locked }: EditorProps<ConsultationDeworming>) {
  return (
    <>
      <TextField
        label="Desparasitante"
        keyboardType="default"
        value={value.product_name}
        onChangeText={(product_name) => change({ product_name })}
        editable={!locked}
      />
      <TextField
        label="Dosis de desparasitante"
        keyboardType="default"
        value={value.dose ?? ''}
        onChangeText={(dose) => change({ dose })}
        editable={!locked}
      />
      <Choice
        label="Vía del desparasitante"
        options={{ oral: 'Oral', topical: 'Tópica', injectable: 'Inyectable' }}
        value={value.administration_route ?? 'oral'}
        change={(administration_route) => change({ administration_route })}
        locked={locked}
      />
      <Choice
        label="Tipo de parásito"
        options={{ internal: 'Internos', external: 'Externos', both: 'Ambos' }}
        value={value.parasite_type ?? 'internal'}
        change={(parasite_type) => change({ parasite_type })}
        locked={locked}
      />
      <TextField
        label="Próxima desparasitación"
        placeholder="AAAA-MM-DD"
        keyboardType="numbers-and-punctuation"
        value={value.next_due_date ?? ''}
        onChangeText={(next_due_date) => change({ next_due_date })}
        editable={!locked}
      />
      <TextField
        label="Observaciones de desparasitación"
        keyboardType="default"
        multiline
        value={value.observations ?? ''}
        onChangeText={(observations) => change({ observations })}
        editable={!locked}
      />
    </>
  );
}

function Records<T>({
  title,
  addLabel,
  items,
  create,
  change,
  editor: Editor,
  locked,
  saved,
}: {
  title: string;
  addLabel: string;
  items: ClinicalRecordDraft<T>[];
  create: () => T;
  change: (items: ClinicalRecordDraft<T>[]) => void;
  editor: React.ComponentType<EditorProps<T>>;
  locked: (index: number) => boolean;
  saved: boolean;
}) {
  const prefix = useId();
  const sequence = useRef(0);
  return (
    <View style={{ gap: 10 }}>
      <SectionTitle>{title}</SectionTitle>
      {items.map((record, index) => (
        <Card key={record.key} style={{ gap: 10 }}>
          <Editor
            value={record.value}
            change={(patch) =>
              change(
                items.map((item, i) =>
                  i === index ? { ...item, value: { ...item.value, ...patch } } : item,
                ),
              )
            }
            locked={locked(index)}
          />
          <Button
            label={`Quitar ${title.toLowerCase()} ${index + 1}`}
            variant="ghost"
            disabled={saved}
            onPress={() => change(items.filter((_, i) => i !== index))}
          />
        </Card>
      ))}
      <Button
        label={addLabel}
        variant="outline"
        disabled={saved}
        onPress={() =>
          change([...items, { key: `${prefix}-${sequence.current++}`, value: create() }])
        }
      />
    </View>
  );
}

export function ClinicalPlanFields({
  value,
  change,
  progress,
  section,
}: {
  value: Plan;
  change: (patch: Partial<Plan>) => void;
  progress: ClinicalSaveProgress | null;
  section?: ClinicalSection;
}) {
  const locked = (prefix: string) => (index: number) =>
    progress?.completedSteps.includes(`${prefix}-${index}`) ?? false;
  const saved = progress !== null;
  return (
    <>
      {!section || section === 'prescription' ? (
        <Records<PrescriptionMedication>
          title="Receta"
          addLabel="Añadir medicamento"
          items={value.medications}
          create={() => ({ medication_name: '', dose: '', frequency: '' })}
          change={(medications) => change({ medications })}
          editor={MedicationEditor}
          locked={() => progress?.completedSteps.includes('prescription') ?? false}
          saved={saved}
        />
      ) : null}
      {!section || section === 'lab' ? (
        <Records<LabExamOrder>
          title="Órdenes de exámenes"
          addLabel="Solicitar examen"
          items={value.labExams}
          create={() => ({ exam_type: 'hemograma', exam_name: '' })}
          change={(labExams) => change({ labExams })}
          editor={LabEditor}
          locked={locked('lab')}
          saved={saved}
        />
      ) : null}
      {!section || section === 'vaccination' ? (
        <Records<ConsultationVaccination>
          title="Vacunas aplicadas"
          addLabel="Registrar vacuna"
          items={value.vaccinations}
          create={() => ({ vaccine_type: 'other', vaccine_name: '' })}
          change={(vaccinations) => change({ vaccinations })}
          editor={VaccinationEditor}
          locked={locked('vaccination')}
          saved={saved}
        />
      ) : null}
      {!section || section === 'deworming' ? (
        <Records<ConsultationDeworming>
          title="Desparasitaciones aplicadas"
          addLabel="Registrar desparasitación"
          items={value.dewormings}
          create={() => ({
            product_name: '',
            administration_route: 'oral',
            parasite_type: 'internal',
          })}
          change={(dewormings) => change({ dewormings })}
          editor={DewormingEditor}
          locked={locked('deworming')}
          saved={saved}
        />
      ) : null}
    </>
  );
}
