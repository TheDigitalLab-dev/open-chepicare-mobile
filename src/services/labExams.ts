import type { LabExamDetail, StaffLabExamUpdate } from '@/types/labExams';
import type { LabExamAttachment } from '@/types/models';
import type { UploadSource } from '@/types/uploads';
import { api } from './api';
import { uploadForm } from './uploads';

export async function getOwnerLabExam(examId: number): Promise<LabExamDetail> {
  const { lab_exam } = await api.get<{ lab_exam: LabExamDetail }>(
    `/owner/lab_exams/${examId}`,
  );
  return lab_exam;
}

export async function getStaffLabExam(
  consultationId: number,
  examId: number,
): Promise<LabExamDetail> {
  const { lab_exam } = await api.get<{ lab_exam: LabExamDetail }>(
    `/admin/consultations/${consultationId}/lab_exams/${examId}`,
  );
  return lab_exam;
}

export async function uploadStaffLabExamFile(
  consultationId: number,
  examId: number,
  file: UploadSource,
): Promise<LabExamAttachment> {
  const { attachment } = await api.upload<{ attachment: LabExamAttachment }>(
    `/admin/consultations/${consultationId}/lab_exams/${examId}/files`,
    uploadForm('file', file),
  );
  return attachment;
}

export async function updateStaffLabExam(
  consultationId: number,
  examId: number,
  update: StaffLabExamUpdate,
): Promise<LabExamDetail> {
  const { lab_exam } = await api.patch<{ lab_exam: LabExamDetail }>(
    `/admin/consultations/${consultationId}/lab_exams/${examId}`,
    { lab_exam: update },
  );
  return lab_exam;
}
