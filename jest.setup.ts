/**
 * Setup de Jest.
 *
 * IMPORTANTE: aquí NO se mockea lógica de negocio ni respuestas de API. Lo único
 * que se sustituye son los módulos NATIVOS de almacenamiento (Keychain /
 * AsyncStorage), que no existen en el entorno Node de Jest. Las peticiones HTTP
 * van al backend real (`EXPO_PUBLIC_API_BASE_URL`, por defecto localhost:3000).
 *
 * Nota: en @testing-library/react-native v12.4+ los matchers se registran
 * automáticamente al importar la librería; no hace falta `extend-expect`.
 */

// Backend real por defecto si el script de test no lo definió.
process.env.EXPO_PUBLIC_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

// undici captura `performance.markResourceTiming` (de node:perf_hooks) al CARGAR
// el módulo; en el entorno de Jest ese método no existe. Hay que parchearlo
// ANTES de requerir undici, o el binding queda en undefined.
// undici captura `performance.markResourceTiming` (objeto global) al CARGAR el
// módulo; en el entorno de Jest ese método no existe. Hay que parchear el
// `performance` global (y el de node:perf_hooks) ANTES de requerir undici, o el
// binding queda en undefined y todo DELETE/POST falla al reportar timing.
const noop = () => {};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const perfHooks = require('node:perf_hooks') as {
  performance: { markResourceTiming?: () => void };
};
if (typeof perfHooks.performance.markResourceTiming !== 'function') {
  perfHooks.performance.markResourceTiming = noop;
}
const globalPerf = globalThis as {
  performance?: { markResourceTiming?: () => void };
};
if (
  globalPerf.performance &&
  typeof globalPerf.performance.markResourceTiming !== 'function'
) {
  globalPerf.performance.markResourceTiming = noop;
}

// Node define `Symbol.dispose` solo en su realm principal; el contexto vm de Jest
// no lo hereda. undici 8 limpia sus listeners de abort con
// `events.addAbortListener(...)[Symbol.dispose]`: sin el símbolo, todo fetch que
// termina lanza "removeAbortListener is not a function". Se reutiliza el símbolo
// real de Node (el mismo que usa `node:events`), no se inventa uno.
const symbolCtor = Symbol as unknown as { dispose?: symbol };
if (typeof symbolCtor.dispose !== 'symbol') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const events = require('node:events') as {
    addAbortListener: (signal: AbortSignal, listener: () => void) => object;
  };
  const disposable = events.addAbortListener(new AbortController().signal, noop);
  const nodeDispose = Object.getOwnPropertySymbols(disposable).find(
    (s) => s.description === 'nodejs.dispose',
  );
  if (nodeDispose) {
    Object.defineProperty(Symbol, 'dispose', { value: nodeDispose });
  }
}

// El preset de React Native reemplaza `fetch` por un polyfill que no hace red
// real en Node. Restauramos un cliente HTTP real (undici) para que los tests
// peguen DE VERDAD al backend.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fetch, Headers, Request, Response } = require('undici');
Object.assign(globalThis, { fetch, Headers, Request, Response });

// Shim de plataforma: SecureStore en memoria (no es lógica de negocio).
jest.mock('expo-secure-store', () => {
  const mem = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => (mem.has(k) ? mem.get(k)! : null)),
    setItemAsync: jest.fn(async (k: string, v: string) => {
      mem.set(k, v);
    }),
    deleteItemAsync: jest.fn(async (k: string) => {
      mem.delete(k);
    }),
  };
});

// Shim de plataforma: AsyncStorage en memoria (mock oficial del paquete).
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Shim de plataforma: expo-notifications (módulo NATIVO de alarmas locales; no
// existe en Node). La lógica de negocio de horarios/tomas se prueba de verdad en
// utils/treatmentSchedule y services/treatments contra SQLite real.
jest.mock('expo-notifications', () => {
  let counter = 0;
  return {
    setNotificationChannelAsync: jest.fn(async () => null),
    requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
    getPermissionsAsync: jest.fn(async () => ({ granted: true })),
    scheduleNotificationAsync: jest.fn(async () => `notif-${++counter}`),
    getAllScheduledNotificationsAsync: jest.fn(async () => []),
    cancelScheduledNotificationAsync: jest.fn(async () => undefined),
    cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
    setNotificationHandler: jest.fn(),
    AndroidImportance: { MAX: 5 },
    SchedulableTriggerInputTypes: { DATE: 'date' },
  };
});

// Shim de plataforma: expo-sqlite (nativo). Los tests de base local usan
// `node:sqlite` REAL; este shim solo evita el fallo de import en módulos de app.
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => {
    throw new Error('expo-sqlite no existe en Node: inyecta un SqlExecutor de test.');
  }),
}));

// Shim de plataforma: expo-network (nativo). Los tests de conectividad ejercitan
// la lógica pura de transiciones; aquí solo se simula "en línea".
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(async () => ({
    isConnected: true,
    isInternetReachable: true,
  })),
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
}));
