import type { Consultation } from './models';

export type ClinicalSection =
  | 'clinical'
  | 'prescription'
  | 'lab'
  | 'vaccination'
  | 'deworming';

export type LabExamType =
  | 'hemograma'
  | 'bioquimica'
  | 'orina'
  | 'coprologia'
  | 'citologia'
  | 'biopsia'
  | 'radiografia'
  | 'ecografia'
  | 'electrocardiograma'
  | 'other';
export type VaccineType =
  | 'dhpp'
  | 'fvrcp'
  | 'rabies'
  | 'bordetella'
  | 'leptospirosis'
  | 'lyme'
  | 'felv'
  | 'fiv'
  | 'canine_influenza'
  | 'other';

export interface ClinicalConsultationFields {
  pet_id: number;
  appointment_id?: number;
  consultation_date: string;
  anamnesis?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  weight?: number;
  temperature?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  blood_pressure?: string;
}

export interface PrescriptionMedication {
  medication_name: string;
  dose: string;
  frequency: string;
  duration?: string;
  special_instructions?: string;
}

export interface LabExamOrder {
  exam_type: LabExamType;
  exam_name: string;
  clinical_history?: string;
  clinical_signs?: string;
  fasting_required?: boolean;
  sedation_required?: boolean;
  special_instructions?: string;
}

export interface ConsultationVaccination {
  vaccine_type: VaccineType;
  vaccine_name: string;
  manufacturer?: string;
  batch_number?: string;
  dose?: string;
  administration_route?: 'subcutaneous' | 'intramuscular' | 'intranasal' | 'oral';
  next_due_date?: string;
  observations?: string;
}

export interface ConsultationDeworming {
  product_name: string;
  dose?: string;
  administration_route?: 'oral' | 'topical' | 'injectable';
  parasite_type?: 'internal' | 'external' | 'both';
  weight_at_application?: number;
  next_due_date?: string;
  observations?: string;
}

export interface ClinicalConsultationInput {
  consultation: ClinicalConsultationFields;
  medications: PrescriptionMedication[];
  prescriptionInstructions?: string;
  labExams: LabExamOrder[];
  vaccinations: ConsultationVaccination[];
  dewormings: ConsultationDeworming[];
}

export interface ClinicalSaveProgress {
  consultation: Consultation;
  completedSteps: string[];
  failures: { key: string; label: string; message: string }[];
}

export interface ClinicalRecordDraft<T> {
  key: string;
  value: T;
}
export interface ClinicalPlanDraft {
  medications: ClinicalRecordDraft<PrescriptionMedication>[];
  labExams: ClinicalRecordDraft<LabExamOrder>[];
  vaccinations: ClinicalRecordDraft<ConsultationVaccination>[];
  dewormings: ClinicalRecordDraft<ConsultationDeworming>[];
  prescriptionInstructions?: string;
}
