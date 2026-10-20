/**
 * Tablero del calendario (componente dumb) con eventos REALES del backend:
 * en modo oscuro los puntos y la leyenda usan los tokens `event*` oscuros, los
 * días son botones accesibles y la lista del día solo avisa al tocar.
 */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { CalendarBoard } from '@/components/domain';
import * as authService from '@/services/auth';
import * as calendarService from '@/services/calendar';
import { ThemeProvider, tokens } from '@/theme';
import type { CalendarEvent, OwnerCalendarResponse } from '@/types/calendar';
import {
  dayEventTypes,
  eventsByDay,
  monthGrid,
  monthGridRange,
  isDayInMonth,
} from '@/utils/calendarGrid';
import { dayAccessibilityLabel, selectedDayTitle } from '@/utils/calendarEvents';
import { clinicMonth, clinicToday } from '@/utils/clinicTime';
import * as secureStore from '@/utils/secureStore';

let response: OwnerCalendarResponse;

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
  response = await calendarService.getOwnerCalendarEvents(monthGridRange(clinicMonth()));
});

afterAll(async () => {
  await secureStore.clearTokens();
});

function renderBoard(day: string, events: CalendarEvent[], canCreate = false) {
  const month = clinicMonth();
  const range = monthGridRange(month);
  const byDay = eventsByDay(events, range);
  const markers = new Map([...byDay].map(([d, list]) => [d, dayEventTypes(list)]));
  const handlers = {
    onRetry: jest.fn(),
    onSelectDay: jest.fn(),
    onPrevMonth: jest.fn(),
    onNextMonth: jest.fn(),
    onToday: jest.fn(),
    onToggleType: jest.fn(),
    onIncludeCancelledChange: jest.fn(),
    onOpenEvent: jest.fn(),
    onCreate: jest.fn(),
  };
  render(
    <ThemeProvider initialPreference="dark">
      <CalendarBoard
        audience="owner"
        month={month}
        weeks={monthGrid(month)}
        today={clinicToday()}
        selectedDay={day}
        markersByDay={markers}
        selectedEvents={byDay.get(day) ?? []}
        loading={false}
        error={null}
        legendTypes={response.allowed_types}
        hiddenTypes={[]}
        includeCancelled={false}
        canCreate={canCreate}
        {...handlers}
      />
    </ThemeProvider>,
  );
  return { handlers, markers };
}

it('pinta los eventos del día con los colores oscuros y abre el evento al tocarlo', () => {
  const appointment = response.events.find(
    (e) => e.type === 'appointment' && isDayInMonth(e.start_date, clinicMonth()),
  )!;
  const day = appointment.start_date;
  const { handlers, markers } = renderBoard(day, response.events);

  expect(screen.getByRole('header', { name: selectedDayTitle(day) })).toBeTruthy();
  const cell = screen.getByLabelText(
    dayAccessibilityLabel(day, markers.get(day)!, day === clinicToday()),
  );
  expect(cell.props.accessibilityState).toEqual({ selected: true });

  // Los puntos del día usan los tokens del modo oscuro.
  const dark = tokens.colors.dark;
  const dotColors = screen.UNSAFE_root.findAll(
    (node) =>
      node.props.style &&
      StyleSheet.flatten(node.props.style)?.width === 6 &&
      StyleSheet.flatten(node.props.style)?.borderRadius === 3,
  ).map((node) => StyleSheet.flatten(node.props.style).backgroundColor);
  expect(dotColors).toContain(dark.eventAppointment);
  expect(dotColors).not.toContain(tokens.colors.light.eventAppointment);

  fireEvent.press(screen.getAllByText(appointment.title)[0]!);
  expect(handlers.onOpenEvent).toHaveBeenCalledWith(appointment);

  fireEvent.press(cell);
  expect(handlers.onSelectDay).toHaveBeenCalledWith(day);

  fireEvent.press(screen.getByRole('checkbox', { name: 'Mostrar tratamientos' }));
  expect(handlers.onToggleType).toHaveBeenCalledWith('prescription');
  expect(screen.queryByRole('button', { name: 'Nueva cita' })).toBeNull();
});

it('un día vacío muestra el estado vacío y "Nueva cita" si se puede agendar', () => {
  const { handlers } = renderBoard(clinicToday(), [], true);
  expect(screen.getByText('Sin eventos este día')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Nueva cita' }));
  expect(handlers.onCreate).toHaveBeenCalled();
});
