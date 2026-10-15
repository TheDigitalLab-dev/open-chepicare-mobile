/**
 * Base de datos local (SQLite) para el modo local-first.
 *
 * Usa `expo-sqlite` (API síncrona) y aplica las migraciones al abrir. Este módulo
 * SOLO se importa desde código de la app (no desde tests: los tests ejercitan el
 * mismo SQL con `node:sqlite`, ver `__tests__`).
 */
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import { applyMigrations } from './migrations';
import type { SqlExecutor } from './sqlExecutor';

// Identificador técnico heredado de PawCare: se CONSERVA tras el cambio de nombre
// a ChepiCare. Es el archivo con los datos locales (pesajes, tratamientos, cola
// de sincronización pendiente…); con WAL son tres archivos (.db, -wal, -shm) que
// no se pueden renombrar de forma atómica, y otro nombre abriría una base vacía.
export const DATABASE_NAME = 'pawcare.db';

/** Envuelve una `SQLiteDatabase` de expo-sqlite como `SqlExecutor`. */
export function createExpoExecutor(db: SQLiteDatabase): SqlExecutor {
  return {
    exec: (sql) => db.execSync(sql),
    run: (sql, params = []) => {
      db.runSync(sql, params as never[]);
    },
    all: <T>(sql: string, params: unknown[] = []) =>
      db.getAllSync(sql, params as never[]) as T[],
    get: <T>(sql: string, params: unknown[] = []) =>
      (db.getFirstSync(sql, params as never[]) as T | null) ?? undefined,
  };
}

let executor: SqlExecutor | null = null;

/** Abre la base local (si no lo está) y aplica migraciones pendientes. */
export function initDatabase(): SqlExecutor {
  if (executor) return executor;
  const db = openDatabaseSync(DATABASE_NAME);
  db.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const exec = createExpoExecutor(db);
  applyMigrations(exec);
  executor = exec;
  return executor;
}

/** Ejecutor activo. Lanza si aún no se llamó a `initDatabase()`. */
export function getExecutor(): SqlExecutor {
  if (!executor) throw new Error('initDatabase() no ha sido llamado todavía.');
  return executor;
}

/**
 * Tablas de datos del usuario (todas menos el registro de migraciones). Las
 * hijas antes que sus padres: con `foreign_keys = ON`, borrar `treatments`
 * antes que `treatment_doses` falla.
 */
const USER_DATA_TABLES = [
  'weighings',
  'sync_outbox',
  'treatment_doses',
  'treatments',
  'notifications',
  'entity_snapshots',
  'notification_prefs',
] as const;

/** Vacía las tablas de datos del usuario (lógica pura, testeable). */
export function purgeAllTables(exec: SqlExecutor): void {
  // Todo o nada: una purga a medias dejaría datos del usuario anterior.
  exec.exec('BEGIN');
  try {
    for (const table of USER_DATA_TABLES) {
      exec.run(`DELETE FROM ${table}`);
    }
    exec.exec('COMMIT');
  } catch (e) {
    exec.exec('ROLLBACK');
    throw e;
  }
}

/**
 * Purga los datos locales al cerrar sesión: en un teléfono compartido, el
 * siguiente usuario no debe heredar datos clínicos ni avisos del anterior.
 */
export function purgeLocalData(): void {
  if (!executor) return; // la base nunca se abrió: no hay nada que purgar
  purgeAllTables(executor);
}
