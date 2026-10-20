/**
 * Textos del calendario (lógica pura): estado de cada evento, hora o periodo,
 * subtítulo por audiencia, título del mes y etiqueta accesible de cada día.
 */
import type { CalendarEvent } from '@/types/calendar';
import {
  dayAccessibilityLabel,
  eventStatusLabel,
  eventSubtitle,
  eventTimeLabel,
  monthTitle,
  selectedDayTitle,
} from '@/utils/calendarEvents';
import { setClinicConfig } from '@/utils/clinicTime';

const pet = { id: 7, name: 'Max', species: 'dog' as const };

const appointment: CalendarEvent = {
  id: 'appointment-12',
  type: 'appointment',
  record_id: 12,
  title: 'Consulta general · Max',
  all_day: false,
  start_date: '2026-10-21',
  end_date: '2026-10-21',
  starts_at: '2026-10-21T10:00:00-04:00',
  ends_at: '2026-10-21T10:30:00-04:00',
  status: 'confirmed',
  pet,
  details: {
    service: { id: 3, name: 'Consulta general' },
    assigned_to: { id: 5, full_name: 'Ana Pérez' },
    duration_minutes: 30,
    owner: { id: 9, full_name: 'Luis Gómez' },
  },
};

const prescription: CalendarEvent = {
  id: 'prescription-44',
  type: 'prescription',
  record_id: 44,
  title: 'Amoxicilina · Max',
  all_day: true,
  start_date: '2026-10-18',
  end_date: '2026-10-24',
  starts_at: null,
  ends_at: null,
  status: 'active',
  pet,
  details: {
    prescription_id: 20,
    consultation_id: 31,
    medication_name: 'Amoxicilina',
    dose: '250mg',
    frequency: 'Cada 12 horas',
    duration: '7 dias',
    duration_days: 7,
    special_instructions: null,
  },
};

const vaccination: CalendarEvent = {
  id: 'vaccination-15',
  type: 'vaccination',
  record_id: 15,
  title: 'Vacuna Antirrábica · Max',
  all_day: true,
  start_date: '2026-11-02',
  end_date: '2026-11-02',
  starts_at: null,
  ends_at: null,
  status: 'overdue',
  pet,
  details: { source: 'vaccination', vaccine_name: 'Antirrábica' },
};

beforeAll(() => {
  setClinicConfig({
    time_zone: 'America/Caracas',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
  });
});

afterAll(() => setClinicConfig(null));

it('eventStatusLabel por tipo', () => {
  expect(eventStatusLabel(appointment)).toBe('Confirmada');
  expect(eventStatusLabel(prescription)).toBe('En curso');
  expect(eventStatusLabel({ ...prescription, status: 'finished' })).toBe('Terminado');
  expect(eventStatusLabel({ ...prescription, status: 'completed' })).toBe('Completado');
  expect(eventStatusLabel(vaccination)).toBe('Vencida');
  expect(eventStatusLabel({ ...vaccination, status: 'upcoming' })).toBe('Próxima');
});

it('eventTimeLabel: hora de la clínica, periodo o todo el día', () => {
  expect(eventTimeLabel(appointment)).toBe('10:00 – 10:30');
  expect(eventTimeLabel(prescription)).toBe('18/10/2026 – 24/10/2026');
  expect(eventTimeLabel(vaccination)).toBe('Todo el día');
});

it('eventSubtitle: el personal ve el dueño; el propietario, el veterinario', () => {
  expect(eventSubtitle(appointment, 'staff')).toBe(
    '10:00 – 10:30 · Luis Gómez · Ana Pérez',
  );
  expect(eventSubtitle(appointment, 'owner')).toBe('10:00 – 10:30 · Ana Pérez');
  expect(eventSubtitle(prescription, 'owner')).toBe(
    '18/10/2026 – 24/10/2026 · 250mg · Cada 12 horas',
  );
});

it('monthTitle y selectedDayTitle', () => {
  expect(monthTitle({ year: 2026, month: 10 })).toBe('Octubre 2026');
  expect(selectedDayTitle('2026-10-21')).toBe('Miércoles 21 de octubre');
});

it('dayAccessibilityLabel resume el día', () => {
  expect(dayAccessibilityLabel('2026-10-21', [], false)).toBe(
    'miércoles 21 de octubre, sin eventos',
  );
  expect(dayAccessibilityLabel('2026-10-21', ['appointment', 'prescription'], true)).toBe(
    'miércoles 21 de octubre, hoy, con citas y tratamientos',
  );
});
