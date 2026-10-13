import { groupVetShifts, monthIndex, shiftMonth } from '@/utils/schedule';

describe('groupVetShifts', () => {
  it('agrupa los turnos de un mismo veterinario (un id, varios turnos)', () => {
    const grouped = groupVetShifts([
      {
        id: 1,
        first_name: 'Ana',
        last_name: 'Ruiz',
        start_time: '08:00',
        end_time: '13:00',
      },
      {
        id: 2,
        first_name: 'Luis',
        last_name: 'Paz',
        start_time: '08:00',
        end_time: '12:00',
      },
      {
        id: 1,
        first_name: 'Ana',
        last_name: 'Ruiz',
        start_time: '14:00',
        end_time: '18:00',
      },
    ]);
    expect(grouped).toEqual([
      {
        id: 1,
        name: 'Ana Ruiz',
        shifts: [
          { start_time: '08:00', end_time: '13:00' },
          { start_time: '14:00', end_time: '18:00' },
        ],
      },
      { id: 2, name: 'Luis Paz', shifts: [{ start_time: '08:00', end_time: '12:00' }] },
    ]);
  });

  it('ignora turnos sin horario', () => {
    expect(
      groupVetShifts([
        { id: 3, first_name: 'Eva', last_name: '', start_time: null, end_time: null },
      ]),
    ).toEqual([{ id: 3, name: 'Eva', shifts: [] }]);
  });
});

describe('shiftMonth', () => {
  it('avanza y retrocede cruzando el año', () => {
    expect(shiftMonth({ month: 12, year: 2026 }, 1)).toEqual({ month: 1, year: 2027 });
    expect(shiftMonth({ month: 1, year: 2027 }, -1)).toEqual({ month: 12, year: 2026 });
    expect(shiftMonth({ month: 5, year: 2026 }, 14)).toEqual({ month: 7, year: 2027 });
  });

  it('compara meses', () => {
    expect(monthIndex({ month: 1, year: 2027 })).toBeGreaterThan(
      monthIndex({ month: 12, year: 2026 }),
    );
  });
});
