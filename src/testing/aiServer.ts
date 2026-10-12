/**
 * Soporte de tests de integración del asistente IA (SOLO tests).
 *
 * No mockea nada: configura el backend REAL por su endpoint de administración
 * (`PATCH /admin/settings/ai-config`, el mismo que usa Configuración > IA en la
 * web) y lo deja como estaba al terminar.
 *
 * Modo "habilitado sin claves": motor Claude Code con un binario inexistente y
 * transcripción local apuntando a un puerto cerrado. Así el servidor acepta
 * dictados y mensajes y los procesa de verdad, pero termina en sus estados de
 * degradación reales (`failed` con el error del STT o del agente), sin gastar
 * tokens ni depender de claves de terceros.
 *
 * La configuración de IA es global en el servidor y Jest corre archivos en
 * paralelo: un candado (directorio en node_modules/.cache) serializa los
 * archivos que la cambian.
 */
import { mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';

import { seedAdminAccessToken } from './seedCredentials';

const BASE = () => process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const LOCK_DIR = path.join(
  process.cwd(),
  'node_modules',
  '.cache',
  'pawcare-ai-tests.lock',
);
const STALE_LOCK_MS = 180_000;

/**
 * Plazo del `beforeAll` que toma el candado: incluye la espera mientras otro
 * archivo de tests usa la configuración de IA del servidor.
 */
export const AI_SETUP_TIMEOUT = 300_000;

export const DEGRADED_AI = {
  agent_engine: 'claude_cli',
  claude_binary_path: '/nonexistent/pawcare-tests/claude',
  stt_provider: 'local',
  stt_base_url: 'http://127.0.0.1:9/v1',
  timeout_seconds: 30,
} as const;

/**
 * IA habilitada con el doble del CLI de terceros (`src/testing/agent-bin/claude`):
 * el "modelo" llama de verdad al MCP del backend y deja una propuesta
 * (`register_deworming`) revisable. La transcripción sigue sin servidor.
 */
export const TEST_AGENT_AI = {
  ...DEGRADED_AI,
  claude_binary_path: path.join(process.cwd(), 'src', 'testing', 'agent-bin', 'claude'),
} as const;

type AiSettingsPatch = Record<string, string | number>;

async function aiConfig(method: 'GET' | 'PATCH', patch?: AiSettingsPatch) {
  const token = await seedAdminAccessToken();
  const res = await fetch(`${BASE()}/admin/settings/ai-config`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: patch ? JSON.stringify(patch) : undefined,
  });
  if (!res.ok) throw new Error(`ai-config ${method} falló (${res.status})`);
  return (await res.json()) as Record<string, unknown>;
}

async function acquireLock(): Promise<void> {
  await mkdir(path.dirname(LOCK_DIR), { recursive: true });
  for (;;) {
    try {
      await mkdir(LOCK_DIR);
      return;
    } catch {
      const info = await stat(LOCK_DIR).catch(() => null);
      if (info && Date.now() - info.mtimeMs > STALE_LOCK_MS) {
        await rm(LOCK_DIR, { recursive: true, force: true });
        continue;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
}

const EDITABLE = [
  'agent_engine',
  'agent_model',
  'claude_binary_path',
  'max_turns',
  'timeout_seconds',
  'stt_provider',
  'stt_model',
  'stt_base_url',
  'language',
  'apply_policy',
] as const;

/**
 * Toma el candado, guarda la configuración actual y aplica `patch`. Devuelve la
 * función que restaura la configuración original y libera el candado.
 */
export async function applyAiSettings(
  patch: AiSettingsPatch,
): Promise<() => Promise<void>> {
  await acquireLock();
  try {
    const original = await aiConfig('GET');
    await aiConfig('PATCH', patch);
    return async () => {
      try {
        const restore: AiSettingsPatch = {};
        for (const key of EDITABLE) {
          const value = original[key];
          restore[key] =
            typeof value === 'string' || typeof value === 'number' ? value : '';
        }
        await aiConfig('PATCH', restore);
      } finally {
        await rm(LOCK_DIR, { recursive: true, force: true });
      }
    };
  } catch (e) {
    await rm(LOCK_DIR, { recursive: true, force: true });
    throw e;
  }
}

/** Cambia la configuración dentro de un bloque que ya tiene el candado. */
export async function patchAiSettings(patch: AiSettingsPatch): Promise<void> {
  await aiConfig('PATCH', patch);
}

/** Espera hasta que `check` devuelva un valor o vence el plazo. */
export async function waitFor<T>(
  check: () => Promise<T | null | undefined | false>,
  timeoutMs = 15_000,
  intervalMs = 300,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() > deadline) throw new Error('waitFor: se venció el plazo');
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/** Audio mínimo (bytes reales de un contenedor ftyp/M4A) escrito a un archivo. */
export const SAMPLE_M4A_BYTES = new Uint8Array([
  0x00,
  0x00,
  0x00,
  0x18,
  0x66,
  0x74,
  0x79,
  0x70,
  0x4d,
  0x34,
  0x41,
  0x20,
  0x00,
  0x00,
  0x00,
  0x00,
  0x4d,
  0x34,
  0x41,
  0x20,
  0x69,
  0x73,
  0x6f,
  0x6d,
  ...new Array<number>(2048).fill(0),
]);
