/**
 * Examen de laboratorio del propietario: subir archivos (PDF o imágenes, desde
 * documentos o la galería) y cargar los resultados ("parámetro → valor"), en
 * el servidor. Solo un examen pendiente o en proceso admite cambios.
 *
 * Lee la ficha autorizada del examen y sus adjuntos persistidos; propietario
 * y personal autorizado ven los mismos archivos al volver a abrirla.
 */
import { useCallback, useMemo, useState } from 'react';

import { useAsync } from '@/hooks/useAsync';
import { pickDocuments, pickImages } from '@/services/filePicker';
import { updateLabExamResults, uploadLabExamFile } from '@/services/medical';
import { ApiError, toApiError } from '@/types/api';
import {
  getOwnerLabExam,
  getStaffLabExam,
  updateStaffLabExam,
  uploadStaffLabExamFile,
} from '@/services/labExams';
import type { LabExamAudience, LabExamDetail } from '@/types/labExams';
import type { LabExam, LabExamAttachment } from '@/types/models';
import type { UploadSource } from '@/types/uploads';
import { type LabResultRow, resultRowsFrom, resultsFromRows } from '@/utils/labResults';

const EDITABLE: readonly LabExam['status'][] = ['pending', 'in_progress'];

/** Fila del formulario con una clave estable para la lista. */
export interface EditableResultRow extends LabResultRow {
  key: number;
}

const EMPTY_ROW: LabResultRow = { parameter: '', value: '' };

function withKeys(rows: LabResultRow[]): EditableResultRow[] {
  return rows.map((row, key) => ({ ...row, key }));
}

function nextKey(rows: EditableResultRow[]): number {
  return rows.reduce((max, row) => Math.max(max, row.key), -1) + 1;
}

export interface LabExamState {
  exam: LabExamDetail | null;
  loading: boolean;
  error: ApiError | null;
  notFound: boolean;
  reload: () => Promise<void>;
  editable: boolean;
  /** Archivos subidos en esta pantalla. */
  uploads: LabExamAttachment[];
  /** Progreso de la subida en curso (`null` si no hay ninguna). */
  uploading: { done: number; total: number } | null;
  uploadFiles: (files: UploadSource[]) => Promise<void>;
  uploadFromDocuments: () => Promise<void>;
  uploadFromGallery: () => Promise<void>;
  rows: EditableResultRow[];
  setRow: (index: number, patch: Partial<LabResultRow>) => void;
  addRow: () => void;
  removeRow: (index: number) => void;
  saving: boolean;
  saveResults: () => Promise<void>;
  actionError: string | null;
  notice: string | null;
}

export function useLabExam(
  petId: number,
  consultationId: number,
  examId: number,
  audience: LabExamAudience = 'owner',
): LabExamState {
  const { data, loading, error, reload } = useAsync(async () => {
    try {
      const detail =
        audience === 'staff'
          ? await getStaffLabExam(consultationId, examId)
          : await getOwnerLabExam(examId);
      return detail.pet_id === petId && detail.consultation_id === consultationId
        ? detail
        : null;
    } catch (cause) {
      if (cause instanceof ApiError && cause.kind === 'notFound') return null;
      throw cause;
    }
  });
  const exam = data ?? null;

  const [newUploads, setUploads] = useState<LabExamAttachment[]>([]);
  const uploads = useMemo(
    () => [
      ...new Map(
        [...(exam?.attachments ?? []), ...newUploads].map((attachment) => [
          attachment.id,
          attachment,
        ]),
      ).values(),
    ],
    [exam, newUploads],
  );
  const [uploading, setUploading] = useState<LabExamState['uploading']>(null);
  // Las filas parten de los resultados guardados hasta que el usuario edita.
  const [edited, setEdited] = useState<EditableResultRow[] | null>(null);
  const initialRows = useMemo(() => withKeys(resultRowsFrom(exam?.results)), [exam]);
  const rows = edited ?? initialRows;
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const uploadFiles = useCallback(
    async (files: UploadSource[]) => {
      if (files.length === 0) return;
      setActionError(null);
      setNotice(null);
      // En paralelo; la lista conserva el orden elegido.
      let done = 0;
      setUploading({ done, total: files.length });
      const settled = await Promise.allSettled(
        files.map(async (file) => {
          try {
            return audience === 'staff'
              ? await uploadStaffLabExamFile(consultationId, examId, file)
              : await uploadLabExamFile(examId, file);
          } finally {
            done += 1;
            setUploading({ done: Math.min(done, files.length - 1), total: files.length });
          }
        }),
      );
      const sentFiles: LabExamAttachment[] = [];
      const failures: string[] = [];
      settled.forEach((result, index) => {
        if (result.status === 'fulfilled') sentFiles.push(result.value);
        else {
          failures.push(
            `No se pudo subir «${files[index]!.name}»: ${toApiError(result.reason).message}`,
          );
        }
      });
      setUploads((prev) => [...prev, ...sentFiles]);
      const sent = sentFiles.length;
      setUploading(null);
      if (failures.length > 0) setActionError(failures.join('\n'));
      if (sent > 0) {
        setNotice(
          sent === 1
            ? 'Archivo enviado a la clínica.'
            : `${sent} archivos enviados a la clínica.`,
        );
      }
    },
    [audience, consultationId, examId],
  );

  const pickAndUpload = useCallback(
    async (pick: () => Promise<UploadSource[]>) => {
      let files: UploadSource[];
      try {
        files = await pick();
      } catch {
        setActionError('No se pudo abrir el selector de archivos.');
        return;
      }
      await uploadFiles(files);
    },
    [uploadFiles],
  );

  const uploadFromDocuments = useCallback(
    () => pickAndUpload(() => pickDocuments()),
    [pickAndUpload],
  );
  const uploadFromGallery = useCallback(
    () => pickAndUpload(() => pickImages(true)),
    [pickAndUpload],
  );

  const editRows = useCallback(
    (change: (current: EditableResultRow[]) => EditableResultRow[]) => {
      setEdited((prev) => change(prev ?? initialRows));
    },
    [initialRows],
  );
  const setRow = useCallback(
    (index: number, patch: Partial<LabResultRow>) => {
      editRows((current) =>
        current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
      );
    },
    [editRows],
  );
  const addRow = useCallback(() => {
    editRows((current) => [...current, { ...EMPTY_ROW, key: nextKey(current) }]);
  }, [editRows]);
  const removeRow = useCallback(
    (index: number) => {
      editRows((current) => {
        const next = current.filter((_, i) => i !== index);
        return next.length > 0 ? next : [{ ...EMPTY_ROW, key: nextKey(current) }];
      });
    },
    [editRows],
  );

  const saveResults = useCallback(async () => {
    setActionError(null);
    setNotice(null);
    const built = resultsFromRows(rows);
    if (!built.ok) {
      setActionError(built.error);
      return;
    }
    setSaving(true);
    try {
      if (audience === 'staff')
        await updateStaffLabExam(consultationId, examId, { results: built.results });
      else await updateLabExamResults(examId, built.results);
      // Lo guardado pasa a ser la base del formulario (y del estado del examen).
      await reload();
      setEdited(null);
      setNotice('Resultados guardados.');
    } catch (e) {
      setActionError(toApiError(e).message);
    } finally {
      setSaving(false);
    }
  }, [rows, audience, consultationId, examId, reload]);

  return {
    exam,
    loading,
    error,
    notFound: !loading && error === null && exam === null,
    reload,
    editable:
      exam !== null &&
      (audience === 'staff'
        ? exam.status !== 'cancelled'
        : EDITABLE.includes(exam.status)),
    uploads,
    uploading,
    uploadFiles,
    uploadFromDocuments,
    uploadFromGallery,
    rows,
    setRow,
    addRow,
    removeRow,
    saving,
    saveResults,
    actionError,
    notice,
  };
}
