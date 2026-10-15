/**
 * Ejercita el esquema local-first contra SQLite REAL (`node:sqlite`, incluido en
 * Node). Nada mockeado: el mismo SQL corre en la app vía expo-sqlite.
 */
import { DatabaseSync } from 'node:sqlite';

import { purgeAllTables } from '@/db/database';
import { applyMigrations } from '@/db/migrations';
import type { SqlExecutor } from '@/db/sqlExecutor';

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

function freshDb(): { db: DatabaseSync; exec: SqlExecutor } {
  const db = new DatabaseSync(':memory:');
  return { db, exec: nodeExecutor(db) };
}

describe('applyMigrations', () => {
  it('aplica las migraciones en orden y es idempotente', () => {
    const { db, exec } = freshDb();

    expect(applyMigrations(exec)).toEqual([1, 2, 3, 4]);
    // Segunda pasada: no reaplica nada.
    expect(applyMigrations(exec)).toEqual([]);

    const tables = exec
      .all<{
        name: string;
      }>("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .map((r) => r.name);
    expect(tables).toEqual(
      expect.arrayContaining([
        'schema_migrations',
        'sync_outbox',
        'weighings',
        'treatments',
        'treatment_doses',
        'notifications',
        'entity_snapshots',
        'notification_prefs',
      ]),
    );

    db.close();
  });

  it('permite registrar un pesaje pendiente y leerlo por mascota', () => {
    const { db, exec } = freshDb();
    applyMigrations(exec);

    exec.run(
      `INSERT INTO weighings (id, pet_id, weight_kg, measured_at, sync_status, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      ['uuid-1', 42, 12.5, '2026-06-16T10:00:00Z', '2026-06-16T10:00:00Z'],
    );

    const row = exec.get<{ weight_kg: number; sync_status: string }>(
      'SELECT weight_kg, sync_status FROM weighings WHERE pet_id = ?',
      [42],
    );
    expect(row?.weight_kg).toBe(12.5);
    expect(row?.sync_status).toBe('pending');

    db.close();
  });

  it('purgeAllTables vacía los datos del usuario al cerrar sesión', () => {
    const { db, exec } = freshDb();
    applyMigrations(exec);
    exec.run(
      `INSERT INTO weighings (id, pet_id, weight_kg, measured_at, sync_status, updated_at)
       VALUES ('w1', 1, 10, '2026-07-15T10:00:00Z', 'pending', '2026-07-15T10:00:00Z')`,
    );
    exec.run(
      `INSERT INTO notifications (id, type, title, created_at)
       VALUES ('n1', 'citas', 'Cita confirmada', '2026-07-15T10:00:00Z')`,
    );

    purgeAllTables(exec);

    expect(exec.all('SELECT * FROM weighings')).toEqual([]);
    expect(exec.all('SELECT * FROM notifications')).toEqual([]);
    db.close();
  });

  it('purgeAllTables funciona con claves foráneas activas (como en la app)', () => {
    // La app abre la base con `PRAGMA foreign_keys = ON`: borrar `treatments`
    // antes que sus dosis fallaba y el cierre de sesión dejaba tratamientos,
    // dosis, avisos y snapshots del usuario anterior en el teléfono.
    const { db, exec } = freshDb();
    exec.exec('PRAGMA foreign_keys = ON;');
    applyMigrations(exec);
    exec.run(
      `INSERT INTO treatments (id, pet_id, medication_name, frequency_hours, duration_days,
         started_at, updated_at)
       VALUES ('t1', 1, 'Amoxicilina', 8, 7, '2026-07-15T10:00:00Z', '2026-07-15T10:00:00Z')`,
    );
    exec.run(
      `INSERT INTO treatment_doses (id, treatment_id, dose_index, scheduled_at, updated_at)
       VALUES ('d1', 't1', 0, '2026-07-15T10:00:00Z', '2026-07-15T10:00:00Z')`,
    );
    exec.run(
      `INSERT INTO entity_snapshots (entity, entity_id, state, updated_at)
       VALUES ('owner-payments', '1', 'pending', '2026-07-15T10:00:00Z')`,
    );

    purgeAllTables(exec);

    expect(exec.all('SELECT * FROM treatment_doses')).toEqual([]);
    expect(exec.all('SELECT * FROM treatments')).toEqual([]);
    expect(exec.all('SELECT * FROM entity_snapshots')).toEqual([]);
    db.close();
  });

  it('rechaza un op inválido en la bitácora (constraint real)', () => {
    const { db, exec } = freshDb();
    applyMigrations(exec);

    expect(() =>
      exec.run(
        `INSERT INTO sync_outbox (id, entity, entity_id, op, payload, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['o1', 'weighing', 'uuid-1', 'INVALID', '{}', '2026-06-16T10:00:00Z'],
      ),
    ).toThrow();

    db.close();
  });
});
