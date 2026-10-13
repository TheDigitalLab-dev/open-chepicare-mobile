import { Badge, type BadgeVariant } from '@/components/ui';
import type { LabExamStatus } from '@/types/models';

const STATUS_LABEL: Record<LabExamStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En proceso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};
const STATUS_VARIANT: Record<LabExamStatus, BadgeVariant> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'outline',
};

export interface LabExamStatusBadgeProps {
  status: LabExamStatus;
}

/** Estado de un examen de laboratorio, en español. */
export function LabExamStatusBadge({ status }: LabExamStatusBadgeProps) {
  return (
    <Badge
      label={STATUS_LABEL[status] ?? status}
      variant={STATUS_VARIANT[status] ?? 'outline'}
    />
  );
}
