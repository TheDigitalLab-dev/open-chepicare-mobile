import { useRef, useState } from 'react';
import { saveClinicalConsultation } from '@/services/clinicalConsultations';
import type { ClinicalConsultationInput, ClinicalSaveProgress } from '@/types/clinical';

export function useClinicalConsultation() {
  const locked = useRef(false);
  const saved = useRef<ClinicalSaveProgress | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<ClinicalSaveProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (input: ClinicalConsultationInput) => {
    if (locked.current) return null;
    locked.current = true;
    setSaving(true);
    setError(null);
    try {
      const result = await saveClinicalConsultation(input, saved.current);
      saved.current = result;
      setProgress(result);
      return result;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'No se pudo guardar la consulta.',
      );
      return null;
    } finally {
      locked.current = false;
      setSaving(false);
    }
  };
  return { saving, progress, error, submit };
}
