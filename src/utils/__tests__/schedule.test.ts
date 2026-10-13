import { generateTimeSlots, groupVetShifts } from '@/utils/schedule';

describe('generateTimeSlots', () => {
  it('genera huecos en pasos del tamaño dado', () => {
    expect(generateTimeSlots('09:00', '11:00', 30)).toEqual([
      '09:00',
      '09:30',
      '10:00',
      '10:30',
    ]);
  });

  it('solo incluye huecos que caben completos antes del fin', () => {
    expect(generateTimeSlots('09:00', '10:00', 45)).toEqual(['09:00']);
  });

  it('devuelve vacío con entradas inválidas o paso no positivo', () => {
    expect(generateTimeSlots('bad', '10:00', 30)).toEqual([]);
    expect(generateTimeSlots('09:00', '10:00', 0)).toEqual([]);
    expect(generateTimeSlots('10:00', '09:00', 30)).toEqual([]);
  });
});

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
