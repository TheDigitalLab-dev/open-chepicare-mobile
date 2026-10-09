/**
 * Recordatorios locales (plan-notificaciones.md, O1 y O3): funciones PURAS que
 * calculan qué avisos programar a partir de datos ya sincronizados. Al ser
 * push locales, suenan aunque no haya conexión (local-first).
 *
 * El `identifier` de cada aviso es estable (p. ej. `appt-10-24h`): reprogramar
 * con el mismo identificador reemplaza al anterior — sin duplicados.
 */
import {
  clinicDayKey,
  clinicWallTimeToInstant,
  formatClinicDateTime,
} from './clinicTime';

export interface ReminderSpec {
  identifier: string;
  title: string;
  body: string;
  /** ISO del momento en que debe sonar. */
  triggerAt: string;
  /** Categoría de preferencias (opt-out por categoría). */
  category: string;
}

interface AppointmentLike {
  id: number;
  scheduled_at: string;
  /** Zona de la clínica que trae la cita. */
  time_zone?: string | null;
  status: string;
  pet?: { name: string } | null;
  service?: { name: string } | null;
}

interface VaccinationLike {
  id: number;
  vaccine_name: string;
  next_due_date?: string | null;
}

const HOUR_MS = 60 * 60 * 1000;
const SKIP_STATUSES = new Set(['cancelled', 'completed']);

// Hora de la cita en la zona de la clínica (la del aviso, no la del teléfono).
function formatWhen(iso: string, timeZone?: string | null): string {
  return formatClinicDateTime(iso, timeZone);
}

/** Avisos 24 h y 2 h antes de cada cita futura no cancelada/completada. */
export function appointmentReminders(
  appointments: AppointmentLike[],
  nowIso: string,
): ReminderSpec[] {
  const now = Date.parse(nowIso);
  const specs: ReminderSpec[] = [];

  for (const appt of appointments) {
    if (SKIP_STATUSES.has(appt.status)) continue;
    const at = Date.parse(appt.scheduled_at);
    if (Number.isNaN(at) || at <= now) continue;

    const who = [appt.pet?.name, appt.service?.name].filter(Boolean).join(' · ');
    const body = `${who ? `${who} — ` : ''}${formatWhen(appt.scheduled_at, appt.time_zone)}`;

    for (const [suffix, offsetH, lead] of [
      ['24h', 24, 'mañana'],
      ['2h', 2, 'en 2 horas'],
    ] as const) {
      const triggerMs = at - offsetH * HOUR_MS;
      if (triggerMs <= now) continue;
      specs.push({
        identifier: `appt-${appt.id}-${suffix}`,
        title: `📅 Cita ${lead}`,
        body,
        triggerAt: new Date(triggerMs).toISOString(),
        category: 'citas',
      });
    }
  }
  return specs;
}

/** Aviso 3 días antes del vencimiento de la próxima dosis, a las 9:00 locales. */
export function vaccinationReminders(
  vaccinations: VaccinationLike[],
  nowIso: string,
): ReminderSpec[] {
  const now = Date.parse(nowIso);
  const specs: ReminderSpec[] = [];

  for (const vacc of vaccinations) {
    if (!vacc.next_due_date) continue;
    const due = new Date(`${vacc.next_due_date}T09:00:00`);
    if (Number.isNaN(due.getTime())) continue;

    const trigger = new Date(due.getTime());
    trigger.setDate(trigger.getDate() - 3);
    if (trigger.getTime() <= now) continue;

    specs.push({
      identifier: `vacc-${vacc.id}-due`,
      title: '💉 Vacuna próxima a vencer',
      body: `${vacc.vaccine_name} — vence el ${new Date(
        `${vacc.next_due_date}T09:00:00`,
      ).toLocaleDateString('es-VE', { day: 'numeric', month: 'long' })}`,
      triggerAt: trigger.toISOString(),
      category: 'vacunas',
    });
  }
  return specs;
}

interface DewormingLike {
  id: number;
  product_name: string;
  next_due_date?: string | null;
}

/** O4 — desparasitación: aviso 3 días antes de la próxima aplicación, 9:00. */
export function dewormingReminders(
  dewormings: DewormingLike[],
  nowIso: string,
): ReminderSpec[] {
  const now = Date.parse(nowIso);
  const specs: ReminderSpec[] = [];

  for (const dew of dewormings) {
    if (!dew.next_due_date) continue;
    const due = new Date(`${dew.next_due_date}T09:00:00`);
    if (Number.isNaN(due.getTime())) continue;
    const trigger = new Date(due.getTime());
    trigger.setDate(trigger.getDate() - 3);
    if (trigger.getTime() <= now) continue;

    specs.push({
      identifier: `dew-${dew.id}-due`,
      title: '🪱 Desparasitación pendiente',
      body: `${dew.product_name} — próxima aplicación el ${due.toLocaleDateString('es-VE', { day: 'numeric', month: 'long' })}`,
      triggerAt: trigger.toISOString(),
      category: 'vacunas',
    });
  }
  return specs;
}

interface PaymentLike {
  id: number;
  status: string;
  amount: number;
  currency: string;
}

/** O8 — pagos pendientes o vencidos: recordatorio mañana a las 10:00. */
export function pendingPaymentReminders(
  payments: PaymentLike[],
  nowIso: string,
): ReminderSpec[] {
  const now = new Date(nowIso);
  if (Number.isNaN(now.getTime())) return [];
  const trigger = new Date(now.getTime());
  trigger.setDate(trigger.getDate() + 1);
  trigger.setHours(10, 0, 0, 0);

  const specs: ReminderSpec[] = [];
  for (const p of payments) {
    if (p.status !== 'pending' && p.status !== 'overdue') continue;
    specs.push({
      identifier: `pay-${p.id}-pending`,
      title: p.status === 'overdue' ? '⚠️ Pago vencido' : '💳 Pago pendiente',
      body: `${p.currency} ${p.amount} por pagar en el consultorio.`,
      triggerAt: trigger.toISOString(),
      category: 'pagos',
    });
  }
  return specs;
}

interface AgendaAppointmentLike {
  id: number;
  scheduled_at: string;
  time_zone?: string | null;
  status: string;
}

/**
 * A3/V2 — agenda del día para el personal: resumen mañana a las 7:30. "Mañana"
 * y las 7:30 son de la clínica (la zona que traen las citas o la conocida).
 */
export function clinicAgendaReminders(
  appointments: AgendaAppointmentLike[],
  nowIso: string,
): ReminderSpec[] {
  const now = new Date(nowIso);
  if (Number.isNaN(now.getTime())) return [];
  const zone = appointments.find((a) => a.time_zone)?.time_zone;
  // Mediodía de hoy en la clínica + 24 h cae siempre en el día siguiente.
  const today = clinicDayKey(now.toISOString(), zone);
  const noonToday = Date.parse(clinicWallTimeToInstant(today, '12:00', zone));
  const dayKey = clinicDayKey(new Date(noonToday + 24 * HOUR_MS).toISOString(), zone);

  const count = appointments.filter((a) => {
    if (SKIP_STATUSES.has(a.status)) return false;
    if (Number.isNaN(Date.parse(a.scheduled_at))) return false;
    return clinicDayKey(a.scheduled_at, zone) === dayKey;
  }).length;
  if (count === 0) return [];

  return [
    {
      identifier: `agenda-${dayKey}`,
      title: '📋 Agenda de hoy',
      body: `${count} ${count === 1 ? 'cita programada' : 'citas programadas'} para hoy en la clínica.`,
      triggerAt: clinicWallTimeToInstant(dayKey, '07:30', zone),
      category: 'agenda',
    },
  ];
}

interface SponsorshipLike {
  id: number;
  status: string;
  end_date?: string | null;
  pet: { name: string } | null;
}

/** O10 — apadrinamiento por vencer: aviso 5 días antes del fin, 9:00. */
export function sponsorshipReminders(
  sponsorships: SponsorshipLike[],
  nowIso: string,
): ReminderSpec[] {
  const now = Date.parse(nowIso);
  const specs: ReminderSpec[] = [];

  for (const sp of sponsorships) {
    if (!sp.end_date || sp.status !== 'active') continue;
    const end = new Date(`${sp.end_date}T09:00:00`);
    if (Number.isNaN(end.getTime())) continue;
    const trigger = new Date(end.getTime());
    trigger.setDate(trigger.getDate() - 5);
    if (trigger.getTime() <= now) continue;

    specs.push({
      identifier: `sponsor-${sp.id}-renewal`,
      title: '💚 Apadrinamiento por renovar',
      body: `${sp.pet?.name ? `${sp.pet.name} — ` : ''}vence el ${end.toLocaleDateString('es-VE', { day: 'numeric', month: 'long' })}. ¡Gracias por tu apoyo!`,
      triggerAt: trigger.toISOString(),
      category: 'pagos',
    });
  }
  return specs;
}

interface VaccinationScheduleLike {
  id: number;
  schedule_type: string;
  start_date?: string | null;
  status: string;
  pet: { name: string } | null;
}

/** A10 — calendario de vacunación de la clínica: aviso el día previo, 8:00. */
export function vaccinationScheduleReminders(
  schedules: VaccinationScheduleLike[],
  nowIso: string,
): ReminderSpec[] {
  const now = Date.parse(nowIso);
  const specs: ReminderSpec[] = [];

  for (const sched of schedules) {
    if (!sched.start_date || SKIP_STATUSES.has(sched.status)) continue;
    const start = new Date(`${sched.start_date}T08:00:00`);
    if (Number.isNaN(start.getTime())) continue;
    const trigger = new Date(start.getTime());
    trigger.setDate(trigger.getDate() - 1);
    if (trigger.getTime() <= now) continue;

    specs.push({
      identifier: `vsched-${sched.id}`,
      title: '💉 Vacunación programada',
      body: `${sched.pet?.name ? `${sched.pet.name} — ` : ''}${sched.schedule_type} el ${start.toLocaleDateString('es-VE', { day: 'numeric', month: 'long' })}`,
      triggerAt: trigger.toISOString(),
      category: 'agenda',
    });
  }
  return specs;
}
