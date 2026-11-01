import type {
  LabExam,
  LabExamAttachment,
  LabExamResults,
  LabExamStatus,
  Pet,
} from './models';

export type LabExamAudience = 'owner' | 'staff';
export interface LabExamDetail extends LabExam {
  pet_id: number;
  pet: Pet;
  consultation_id: number;
  clinical_history?: string | null;
  clinical_signs?: string | null;
  special_instructions?: string | null;
  fasting_required?: boolean;
  sedation_required?: boolean;
  attachments: LabExamAttachment[];
}
export interface StaffLabExamUpdate {
  results?: LabExamResults;
  status?: LabExamStatus;
}
