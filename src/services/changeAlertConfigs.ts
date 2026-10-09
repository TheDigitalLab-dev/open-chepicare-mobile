/**
 * Configuraciones de alertas por cambio (plan-notificaciones.md): qué entidad
 * se observa, qué define su "estado" y cómo se redacta el aviso. Los textos no
 * afirman quién hizo el cambio (el diff no conoce al actor).
 */
import type { Appointment, LabExam, MedicalReport, Payment } from '@/types/models';
import type { AdoptionRecord } from '@/services/admin';
import { formatClinicDateTime } from '@/utils/clinicTime';

import type { ChangeAlertConfig } from './changeAlerts';

function apptWho(appt: Appointment): string {
  return [appt.pet?.name, appt.service?.name].filter(Boolean).join(' · ');
}

// Hora de la cita en la zona de la clínica (la que trae la cita).
function apptWhen(appt: Appointment): string {
  return formatClinicDateTime(appt.scheduled_at, appt.time_zone);
}

/**
 * Instante normalizado (UTC) de la cita: el backend pasó de responder "…Z" a
 * responder con el offset de la clínica; el mismo instante no es un cambio.
 */
function apptInstant(scheduledAt: string | undefined): string | undefined {
  if (!scheduledAt) return scheduledAt;
  const ms = Date.parse(scheduledAt);
  return Number.isNaN(ms) ? scheduledAt : new Date(ms).toISOString();
}

function apptState(appt: Appointment): string {
  return `${appt.status}|${apptInstant(appt.scheduled_at)}`;
}

/** O2 — la cita del dueño cambió (estado o fecha) desde el consultorio. */
export const ownerAppointmentAlerts: ChangeAlertConfig<Appointment> = {
  entity: 'owner-appointments',
  category: 'citas',
  idOf: (a) => String(a.id),
  stateOf: apptState,
  describe(event, appt) {
    if (event.kind !== 'changed' || !event.prevState) return null;
    const [prevStatus, prevAt] = event.prevState.split('|');
    const body = `${apptWho(appt)} — ${apptWhen(appt)}`;
    if (appt.status !== prevStatus) {
      const titles: Record<string, string> = {
        confirmed: '📅 Cita confirmada',
        cancelled: '📅 Cita cancelada',
        in_progress: '📅 Cita en curso',
        completed: '📅 Cita completada',
      };
      const title = titles[appt.status];
      return title ? { title, body } : null;
    }
    if (apptInstant(appt.scheduled_at) !== apptInstant(prevAt)) {
      return { title: '📅 Cita reprogramada', body };
    }
    return null;
  },
};

/** O7 — el estado de un pago del dueño cambió; también cobros nuevos. */
export const ownerPaymentAlerts: ChangeAlertConfig<Payment> = {
  entity: 'owner-payments',
  category: 'pagos',
  idOf: (p) => String(p.id),
  stateOf: (p) => p.status,
  describe(event, payment) {
    const amount = `${payment.currency} ${payment.amount}`;
    if (event.kind === 'created') {
      return payment.status === 'pending' || payment.status === 'overdue'
        ? { title: '💳 Nuevo cobro registrado', body: `${amount} — pendiente de pago.` }
        : null;
    }
    const titles: Record<string, { title: string; body: string }> = {
      completed: { title: '✅ Pago confirmado', body: `${amount} verificado. ¡Gracias!` },
      overdue: { title: '⚠️ Pago vencido', body: `${amount} sigue pendiente.` },
      cancelled: { title: '💳 Pago anulado', body: `${amount} fue anulado.` },
    };
    return titles[payment.status] ?? null;
  },
};

/** A1/A2 — para el personal: citas nuevas y cancelaciones. */
export const adminAppointmentAlerts: ChangeAlertConfig<Appointment> = {
  entity: 'admin-appointments',
  category: 'agenda',
  idOf: (a) => String(a.id),
  stateOf: apptState,
  describe(event, appt) {
    const body = `${apptWho(appt)} — ${apptWhen(appt)}`;
    if (event.kind === 'created') {
      return { title: '🆕 Nueva cita agendada', body };
    }
    const prevStatus = event.prevState?.split('|')[0];
    if (appt.status === 'cancelled' && prevStatus !== 'cancelled') {
      return { title: '🚫 Cita cancelada', body };
    }
    return null;
  },
};

/** A4 — para el personal: pagos nuevos por verificar. */
export const adminPaymentAlerts: ChangeAlertConfig<Payment> = {
  entity: 'admin-payments',
  category: 'pagos',
  idOf: (p) => String(p.id),
  stateOf: (p) => p.status,
  describe(event, payment) {
    if (event.kind === 'created' && payment.status === 'pending') {
      return {
        title: '🧾 Pago por verificar',
        body: `${payment.currency} ${payment.amount} reportado.`,
      };
    }
    return null;
  },
};

/** A5 — para el personal: registros de adopción nuevos. */
export const adminAdoptionAlerts: ChangeAlertConfig<AdoptionRecord> = {
  entity: 'admin-adoptions',
  category: 'adopciones',
  idOf: (a) => String(a.id),
  stateOf: (a) => a.adoption_date ?? 'nueva',
  describe(event, record) {
    if (event.kind !== 'created') return null;
    return {
      title: '🏠 Nueva adopción registrada',
      body: record.pet ? `${record.pet.name} (${record.pet.species})` : undefined,
    };
  },
};

/** O5 — informes médicos nuevos de la mascota. */
export const ownerMedicalReportAlerts: ChangeAlertConfig<MedicalReport> = {
  entity: 'owner-medical-reports',
  category: 'informes',
  idOf: (r) => String(r.id),
  stateOf: (r) => r.generated_at ?? r.created_at ?? 'nuevo',
  describe(event, report) {
    if (event.kind !== 'created') return null;
    return { title: '📄 Nuevo informe médico disponible', body: report.title };
  },
};

/** V3/O5 — resultados de exámenes de laboratorio listos. */
export const labExamAlerts: ChangeAlertConfig<LabExam> = {
  entity: 'lab-exams',
  category: 'informes',
  idOf: (e) => String(e.id),
  stateOf: (e) => e.status,
  describe(event, exam) {
    if (event.kind === 'changed' && exam.status === 'completed') {
      return { title: '🔬 Resultados de laboratorio listos', body: exam.exam_name };
    }
    return null;
  },
};
