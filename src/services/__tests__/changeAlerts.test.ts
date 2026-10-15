/**
 * Motor de alertas por cambio contra SQLite REAL (`node:sqlite`): siembra
 * silenciosa, altas, cambios de estado y deduplicación, con las configuraciones
 * reales de citas y pagos.
 */
import { DatabaseSync } from 'node:sqlite';

import { applyMigrations } from '@/db/migrations';
import type { SqlExecutor } from '@/db/sqlExecutor';
import { processChangeAlerts } from '@/services/changeAlerts';
import {
  adminPaymentAlerts,
  ownerAppointmentAlerts,
  ownerMedicalReportAlertsFor,
  ownerPaymentAlerts,
} from '@/services/changeAlertConfigs';
import { createNotificationCenter } from '@/services/notificationCenter';
import type { Appointment, MedicalReport, Payment } from '@/types/models';

function nodeExecutor(db: DatabaseSync): SqlExecutor {
  return {
    exec: (sql) => db.exec(sql),
    run: (sql, params = []) => {
      db.prepare(sql).run(...(params as never[]));
    },
    all: <T>(sql: string, params: unknown[] = []) =>
      db.prepare(sql).all(...(params as never[])) as T[],
    get: <T>(sql: string, params: unknown[] = []) =>
      (db.prepare(sql).get(...(params as never[])) as T | undefined) ?? undefined,
  };
}

function appointment(over: Partial<Appointment>): Appointment {
  return {
    id: 1,
    pet_id: 1,
    service_id: 1,
    owner_id: 1,
    assigned_to_id: null,
    scheduled_at: '2026-07-20T14:00:00.000Z',
    status: 'pending',
    payment_status: 'unpaid',
    pet: { id: 1, name: 'Luna', species: 'dog' },
    service: { id: 1, name: 'Consulta general' },
    assigned_to: null,
    ...over,
  } as Appointment;
}

function payment(over: Partial<Payment>): Payment {
  return {
    id: 1,
    owner_id: 1,
    status: 'pending',
    amount: 25,
    currency: 'USD',
    ...over,
  } as Payment;
}

describe('processChangeAlerts', () => {
  let db: DatabaseSync;
  let exec: SqlExecutor;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    exec = nodeExecutor(db);
    applyMigrations(exec);
  });

  afterEach(() => db.close());

  it('rendimiento: con 5 000 registros sin cambios no reescribe ningún snapshot', () => {
    // Antes: un UPSERT por registro, cada uno en su propia transacción, en el
    // hilo de JS y en cada foco de la pantalla (segundos de bloqueo a 10k).
    const many = Array.from({ length: 5000 }, (_, i) => payment({ id: i + 1 }));
    processChangeAlerts(exec, many, ownerPaymentAlerts);

    const writes: string[] = [];
    const counting: SqlExecutor = {
      ...exec,
      run: (sql, params) => {
        writes.push(sql);
        exec.run(sql, params);
      },
    };
    processChangeAlerts(counting, many, ownerPaymentAlerts);
    expect(writes).toHaveLength(0);

    // Un solo cambio → una sola escritura de snapshot (más su aviso).
    const changed = many.map((p) =>
      p.id === 42 ? { ...p, status: 'completed' as const } : p,
    );
    processChangeAlerts(counting, changed, ownerPaymentAlerts);
    const snapshotWrites = writes.filter((sql) => sql.includes('entity_snapshots'));
    expect(snapshotWrites).toHaveLength(1);
    expect(createNotificationCenter(exec).list()).toHaveLength(1);
  });

  it('informes: abrir otra mascota no presenta sus informes viejos como nuevos', () => {
    const report = (id: number, petId: number) =>
      ({
        id,
        pet_id: petId,
        title: `Informe ${id}`,
        created_at: '2026-07-01',
      }) as MedicalReport;
    processChangeAlerts(exec, [report(1, 10)], ownerMedicalReportAlertsFor(10));
    processChangeAlerts(
      exec,
      [report(2, 20), report(3, 20)],
      ownerMedicalReportAlertsFor(20),
    );
    expect(createNotificationCenter(exec).list()).toHaveLength(0);

    // Un informe nuevo de la mascota 20 sí avisa.
    processChangeAlerts(
      exec,
      [report(2, 20), report(3, 20), report(4, 20)],
      ownerMedicalReportAlertsFor(20),
    );
    expect(
      createNotificationCenter(exec)
        .list()
        .map((n) => n.body),
    ).toEqual(['Informe 4']);
  });

  it('la primera sincronización siembra en silencio (sin avisos históricos)', () => {
    processChangeAlerts(
      exec,
      [appointment({ status: 'confirmed' })],
      ownerAppointmentAlerts,
    );
    expect(createNotificationCenter(exec).list()).toHaveLength(0);
  });

  it('detecta el cambio de estado de una cita (O2) tras la siembra', () => {
    processChangeAlerts(
      exec,
      [appointment({ status: 'pending' })],
      ownerAppointmentAlerts,
    );
    processChangeAlerts(
      exec,
      [appointment({ status: 'confirmed' })],
      ownerAppointmentAlerts,
    );

    const items = createNotificationCenter(exec).list();
    expect(items).toHaveLength(1);
    expect(items[0]!.title).toContain('Cita confirmada');
    expect(items[0]!.body).toContain('Luna');
  });

  it('detecta la reprogramación de la cita (cambia la fecha, no el estado)', () => {
    processChangeAlerts(exec, [appointment({})], ownerAppointmentAlerts);
    processChangeAlerts(
      exec,
      [appointment({ scheduled_at: '2026-07-21T10:00:00.000Z' })],
      ownerAppointmentAlerts,
    );

    expect(createNotificationCenter(exec).list()[0]!.title).toContain('reprogramada');
  });

  it('la misma hora con el offset de la clínica no es una reprogramación', () => {
    // Antes de e8ad843 el backend respondía en UTC ("...Z"); ahora responde con
    // el offset de la clínica. Es el mismo instante: no debe avisar.
    processChangeAlerts(exec, [appointment({})], ownerAppointmentAlerts);
    processChangeAlerts(
      exec,
      [
        appointment({
          scheduled_at: '2026-07-20T10:00:00-04:00',
          time_zone: 'America/Caracas',
        }),
      ],
      ownerAppointmentAlerts,
    );

    expect(createNotificationCenter(exec).list()).toHaveLength(0);
  });

  it('el aviso muestra la hora en la zona de la cita', () => {
    processChangeAlerts(exec, [appointment({})], ownerAppointmentAlerts);
    processChangeAlerts(
      exec,
      [
        appointment({
          status: 'confirmed',
          scheduled_at: '2026-07-20T10:00:00-04:00',
          time_zone: 'America/Caracas',
        }),
      ],
      ownerAppointmentAlerts,
    );

    expect(createNotificationCenter(exec).list()[0]!.body).toContain('10:00');
  });

  it('el mismo estado no genera avisos repetidos (dedupe)', () => {
    processChangeAlerts(exec, [appointment({})], ownerAppointmentAlerts);
    processChangeAlerts(
      exec,
      [appointment({ status: 'confirmed' })],
      ownerAppointmentAlerts,
    );
    processChangeAlerts(
      exec,
      [appointment({ status: 'confirmed' })],
      ownerAppointmentAlerts,
    );

    expect(createNotificationCenter(exec).list()).toHaveLength(1);
  });

  it('para el dueño: pago verificado (O7); para el personal: pago nuevo por verificar (A4)', () => {
    // Dueño: siembra con pendiente → luego completado.
    processChangeAlerts(exec, [payment({ status: 'pending' })], ownerPaymentAlerts);
    processChangeAlerts(exec, [payment({ status: 'completed' })], ownerPaymentAlerts);

    // Personal: siembra vacía → aparece un pago pendiente nuevo.
    processChangeAlerts(exec, [], adminPaymentAlerts);
    processChangeAlerts(
      exec,
      [payment({ id: 9, status: 'pending' })],
      adminPaymentAlerts,
    );

    const titles = createNotificationCenter(exec)
      .list()
      .map((n) => n.title);
    expect(titles.some((t) => t.includes('Pago confirmado'))).toBe(true);
    expect(titles.some((t) => t.includes('Pago por verificar'))).toBe(true);
  });
});
