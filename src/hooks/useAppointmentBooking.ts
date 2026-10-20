/**
 * Asistente de citas del propietario (agendar y reprogramar) contra el backend
 * real. Todo lo que decide si un horario sirve lo calcula el servidor:
 *  - días con agenda del mes (`/owner-available-days`), navegando por meses
 *    desde el mes actual de la clínica;
 *  - veterinarios del día (`/owner-available-vets`, una fila por turno: se
 *    agrupan por veterinario);
 *  - horarios libres (`/owner-time-slots`: sin horas pasadas, ocupadas ni
 *    ausencias, en todos los turnos del veterinario).
 *
 * Con `appointmentId` precarga la cita (solo pendientes o confirmadas), pide los
 * horarios sin contar la propia cita (`exclude_appointment_id`) y envía un
 * PATCH con los campos que cambiaron. Cada carga ignora las respuestas de
 * peticiones anteriores (tocar días rápido no mezcla veterinarios).
 *
 * Con `initialDay` (al agendar desde el calendario) abre en el mes de ese día
 * y lo deja elegido si el servidor lo ofrece; si no, avisa
 * (`initialDayUnavailable`) y el propietario elige otro.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAsync, type AsyncState } from '@/hooks/useAsync';
import {
  createAppointment,
  getAppointment,
  getAvailableDays,
  getAvailableTimeSlots,
  getAvailableVets,
  listServices,
  updateAppointment,
  type AppointmentUpdate,
} from '@/services/appointments';
import { listPets } from '@/services/pets';
import { ApiError, toApiError } from '@/types/api';
import { canReschedule } from '@/utils/appointmentGroups';
import type { Appointment, Pet, Service } from '@/types/models';
import {
  clinicDayKey,
  clinicHourKey,
  clinicMonth,
  clinicWallDateTime,
} from '@/utils/clinicTime';
import {
  groupVetShifts,
  monthIndex,
  shiftMonth,
  type MonthRef,
  type VetWithShifts,
} from '@/utils/schedule';

/** Hasta dónde se puede navegar (el servidor limita además la anticipación). */
const MAX_MONTHS_AHEAD = 12;

const EDITABLE_STATUSES = ['pending', 'confirmed'];

export interface BookingSelection {
  petId?: number;
  serviceId?: number;
  day?: string;
  vetId?: number;
  time?: string;
}

export interface RemoteList<T> {
  data: T[];
  loading: boolean;
  error: ApiError | null;
}

const IDLE = { data: [], loading: false, error: null };

export interface AppointmentBooking {
  isEditing: boolean;
  /** El día que vino del calendario no tiene agenda (no se preseleccionó). */
  initialDayUnavailable: boolean;
  /** Cargando la cita a editar. */
  initializing: boolean;
  initError: ApiError | null;
  pets: AsyncState<Pet[]>;
  services: AsyncState<Service[]>;
  month: MonthRef;
  canGoPrevMonth: boolean;
  canGoNextMonth: boolean;
  prevMonth: () => Promise<void>;
  nextMonth: () => Promise<void>;
  days: RemoteList<string> & { reload: () => Promise<void> };
  vets: RemoteList<VetWithShifts> & { reload: () => Promise<void> };
  slots: RemoteList<string> & { reload: () => Promise<void> };
  selection: BookingSelection;
  notes: string;
  selectPet: (id: number) => void;
  selectService: (id: number) => void;
  selectDay: (day: string) => Promise<void>;
  selectVet: (id: number) => Promise<void>;
  selectTime: (time: string) => void;
  setNotes: (notes: string) => void;
  canSubmit: boolean;
  submitting: boolean;
  submitError?: string;
  /** Crea o reprograma. Devuelve la cita o `null` si el servidor la rechazó. */
  submit: () => Promise<Appointment | null>;
}

function monthOfDay(day: string): MonthRef {
  return { year: Number(day.slice(0, 4)), month: Number(day.slice(5, 7)) };
}

/** Campos que cambiaron respecto de la cita original (PATCH mínimo). */
function changedFields(
  original: Appointment,
  sel: Required<BookingSelection>,
  notes: string,
): AppointmentUpdate {
  const patch: AppointmentUpdate = {};
  if (sel.petId !== original.pet_id) patch.pet_id = sel.petId;
  if (sel.serviceId !== original.service_id) patch.service_id = sel.serviceId;
  if (sel.vetId !== original.assigned_to_id) patch.assigned_to_id = sel.vetId;
  const sameDay = sel.day === clinicDayKey(original.scheduled_at, original.time_zone);
  const sameTime = sel.time === clinicHourKey(original.scheduled_at, original.time_zone);
  if (!sameDay || !sameTime) patch.scheduled_at = clinicWallDateTime(sel.day, sel.time);
  if (notes.trim() !== (original.notes ?? '')) patch.notes = notes.trim();
  return patch;
}

function isComplete(sel: BookingSelection): sel is Required<BookingSelection> {
  return (
    sel.petId !== undefined &&
    sel.serviceId !== undefined &&
    sel.day !== undefined &&
    sel.vetId !== undefined &&
    sel.time !== undefined
  );
}

/** Mes inicial: el del día precargado si cae en la ventana navegable. */
function initialMonth(minMonth: MonthRef, initialDay?: string): MonthRef {
  if (!initialDay) return minMonth;
  const target = monthOfDay(initialDay);
  const offset = monthIndex(target) - monthIndex(minMonth);
  return offset >= 0 && offset <= MAX_MONTHS_AHEAD ? target : minMonth;
}

export function useAppointmentBooking(
  appointmentId?: number,
  initialDay?: string,
): AppointmentBooking {
  const isEditing = appointmentId !== undefined;
  const pets = useAsync(() => listPets());
  const services = useAsync(() => listServices());

  const [minMonth] = useState(() => clinicMonth());
  const [startMonth] = useState(() => initialMonth(minMonth, initialDay));
  const [month, setMonth] = useState<MonthRef>(startMonth);
  const [initialDayUnavailable, setInitialDayUnavailable] = useState(false);
  const [days, setDays] = useState<RemoteList<string>>({ ...IDLE, loading: true });
  const [vets, setVets] = useState<RemoteList<VetWithShifts>>(IDLE);
  const [slots, setSlots] = useState<RemoteList<string>>(IDLE);

  const [selection, setSelection] = useState<BookingSelection>({});
  const [notes, setNotes] = useState('');
  const [original, setOriginal] = useState<Appointment | null>(null);
  const [initializing, setInitializing] = useState(isEditing);
  const [initError, setInitError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  // Última petición de cada lista: las respuestas viejas se descartan.
  const daysReq = useRef(0);
  const vetsReq = useRef(0);
  const slotsReq = useRef(0);

  /** Carga los días del mes; devuelve los días o `null` si quedó obsoleta o falló. */
  const loadDays = useCallback(async (m: MonthRef): Promise<string[] | null> => {
    const req = ++daysReq.current;
    setDays((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getAvailableDays(m.month, m.year);
      if (req !== daysReq.current) return null;
      setDays({ data, loading: false, error: null });
      return data;
    } catch (e) {
      if (req === daysReq.current)
        setDays({ data: [], loading: false, error: toApiError(e) });
      return null;
    }
  }, []);

  const loadVets = useCallback(async (day: string) => {
    const req = ++vetsReq.current;
    setVets({ data: [], loading: true, error: null });
    try {
      const data = groupVetShifts(await getAvailableVets(day));
      if (req === vetsReq.current) setVets({ data, loading: false, error: null });
    } catch (e) {
      // Un fallo de red NO es "sin veterinarios": se muestra con reintento.
      if (req === vetsReq.current)
        setVets({ data: [], loading: false, error: toApiError(e) });
    }
  }, []);

  const loadSlots = useCallback(
    async (day: string, vetId: number, serviceId: number, keep?: Appointment | null) => {
      const req = ++slotsReq.current;
      setSlots({ data: [], loading: true, error: null });
      try {
        // Al reprogramar, el servidor no cuenta la propia cita como ocupada
        // (`exclude_appointment_id`): se ofrecen su horario y los que solo
        // chocaban con ella, con el mismo cálculo que valida el PATCH.
        const free = (await getAvailableTimeSlots(day, vetId, serviceId, keep?.id))
          .filter((s) => s.available)
          .map((s) => s.time);
        if (req === slotsReq.current)
          setSlots({ data: free, loading: false, error: null });
      } catch (e) {
        if (req === slotsReq.current) {
          setSlots({ data: [], loading: false, error: toApiError(e) });
        }
      }
    },
    [],
  );

  const appointmentIdRef = useRef(appointmentId);
  const initialDayRef = useRef(initialDay);
  useEffect(() => {
    const init = async () => {
      const id = appointmentIdRef.current;
      if (id === undefined) {
        const day = initialDayRef.current;
        const available = await loadDays(startMonth);
        if (!day || available === null) return;
        if (!available.includes(day)) {
          setInitialDayUnavailable(true);
          return;
        }
        setSelection((prev) => ({ ...prev, day }));
        await loadVets(day);
        return;
      }
      try {
        const appt = await getAppointment(id);
        if (!EDITABLE_STATUSES.includes(appt.status)) {
          throw new ApiError({
            message: 'Esta cita ya no se puede modificar.',
            status: 422,
            kind: 'validation',
          });
        }
        // Mismo límite que el backend: se avisa al abrir, no tras 5 pasos.
        if (!canReschedule(appt, new Date().toISOString())) {
          throw new ApiError({
            message: 'Solo se pueden modificar citas futuras.',
            status: 422,
            kind: 'validation',
          });
        }
        const day = clinicDayKey(appt.scheduled_at, appt.time_zone);
        const vetId = appt.assigned_to_id ?? undefined;
        setOriginal(appt);
        setMonth(monthOfDay(day));
        setSelection({
          petId: appt.pet_id,
          serviceId: appt.service_id,
          day,
          vetId,
          time: clinicHourKey(appt.scheduled_at, appt.time_zone),
        });
        setNotes(appt.notes ?? '');
        await Promise.all([
          loadDays(monthOfDay(day)),
          loadVets(day),
          vetId !== undefined ? loadSlots(day, vetId, appt.service_id, appt) : null,
        ]);
      } catch (e) {
        setInitError(toApiError(e));
      } finally {
        setInitializing(false);
      }
    };
    // Diferido para no encadenar setState dentro del efecto (como useAsync).
    const timer = setTimeout(() => void init(), 0);
    return () => clearTimeout(timer);
  }, [loadDays, loadVets, loadSlots, startMonth]);

  const changeMonth = async (delta: number) => {
    const target = shiftMonth(month, delta);
    const offset = monthIndex(target) - monthIndex(minMonth);
    if (offset < 0 || offset > MAX_MONTHS_AHEAD) return;
    setMonth(target);
    setInitialDayUnavailable(false);
    // Otro mes: el día, el veterinario y la hora elegidos ya no aplican.
    setSelection((prev) => ({ petId: prev.petId, serviceId: prev.serviceId }));
    setVets(IDLE);
    setSlots(IDLE);
    await loadDays(target);
  };

  const selectService = (id: number) => {
    if (id === selection.serviceId) return;
    setSelection((prev) => ({ ...prev, serviceId: id, time: undefined }));
    // La duración cambia los horarios libres.
    if (selection.day && selection.vetId !== undefined) {
      void loadSlots(selection.day, selection.vetId, id, original);
    }
  };

  const selectDay = async (day: string) => {
    setInitialDayUnavailable(false);
    setSelection((prev) => ({ ...prev, day, vetId: undefined, time: undefined }));
    setSlots(IDLE);
    await loadVets(day);
  };

  const selectVet = async (id: number) => {
    setSelection((prev) => ({ ...prev, vetId: id, time: undefined }));
    if (selection.day && selection.serviceId !== undefined) {
      await loadSlots(selection.day, id, selection.serviceId, original);
    }
  };

  const submit = async (): Promise<Appointment | null> => {
    if (!isComplete(selection) || submitting) return null;
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      if (original) {
        const patch = changedFields(original, selection, notes);
        if (Object.keys(patch).length === 0) return original;
        return await updateAppointment(original.id, patch);
      }
      return await createAppointment({
        pet_id: selection.petId,
        service_id: selection.serviceId,
        assigned_to_id: selection.vetId,
        scheduled_at: clinicWallDateTime(selection.day, selection.time),
        notes: notes.trim() || undefined,
      });
    } catch (e) {
      setSubmitError(
        e instanceof ApiError
          ? e.message
          : isEditing
            ? 'No se pudo reprogramar la cita.'
            : 'No se pudo agendar la cita.',
      );
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const offset = monthIndex(month) - monthIndex(minMonth);

  return {
    isEditing,
    initializing,
    initError,
    pets,
    services,
    month,
    canGoPrevMonth: offset > 0,
    canGoNextMonth: offset < MAX_MONTHS_AHEAD,
    prevMonth: () => changeMonth(-1),
    nextMonth: () => changeMonth(1),
    initialDayUnavailable,
    days: {
      ...days,
      reload: async () => {
        await loadDays(month);
      },
    },
    vets: {
      ...vets,
      reload: async () => {
        if (selection.day) await loadVets(selection.day);
      },
    },
    slots: {
      ...slots,
      reload: async () => {
        if (
          selection.day &&
          selection.vetId !== undefined &&
          selection.serviceId !== undefined
        ) {
          await loadSlots(selection.day, selection.vetId, selection.serviceId, original);
        }
      },
    },
    selection,
    notes,
    selectPet: (id) => setSelection((prev) => ({ ...prev, petId: id })),
    selectService,
    selectDay,
    selectVet,
    selectTime: (time) => setSelection((prev) => ({ ...prev, time })),
    setNotes,
    canSubmit: isComplete(selection) && !submitting,
    submitting,
    submitError,
    submit,
  };
}
