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
const { fetch, FormData, Headers, Request, Response } = require('undici');
// FormData/Blob/File del mismo realm que undici: las subidas multipart (audio
// del dictado) viajan de verdad al backend. El FormData de React Native del
// preset no es serializable por undici.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Blob, File } = require('node:buffer');
Object.assign(globalThis, { fetch, FormData, Blob, File, Headers, Request, Response });

// Shim de plataforma: WebSocket con la firma de React Native
// `new WebSocket(url, protocols, { headers })` sobre el WebSocket REAL de undici
// (la conexión a /cable del backend es de verdad). Como el módulo nativo de RN,
// envía `Origin` con el origen del propio servidor.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { WebSocket: UndiciWebSocket } = require('undici') as {
  WebSocket: new (
    url: string,
    init: { protocols?: string | string[]; headers?: Record<string, string> },
  ) => object;
};
class ReactNativeWebSocket extends UndiciWebSocket {
  constructor(
    url: string,
    protocols?: string | string[] | null,
    options?: { headers?: Record<string, string> } | null,
  ) {
    const origin = new URL(url.replace(/^ws/i, 'http')).origin;
    super(url, {
      protocols: protocols ?? undefined,
      headers: { Origin: origin, ...(options?.headers ?? {}) },
    });
  }
}
Object.assign(globalThis, { WebSocket: ReactNativeWebSocket });

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
  // Toques en notificaciones: el sistema operativo los entrega a estos
  // listeners. `__tapNotification(data)` simula que el usuario toca una push.
  // (Nombres `mock*`: jest-hoist solo deja referenciar esos dentro del factory.)
  const responseListeners = new Set<(mockResponse: unknown) => void>();
  const mockScheduled = new Map<string, Record<string, unknown>>();
  return {
    getLastNotificationResponseAsync: jest.fn(async () => null),
    clearLastNotificationResponseAsync: jest.fn(async () => undefined),
    addNotificationResponseReceivedListener: jest.fn(
      (mockListener: (mockResponse: unknown) => void) => {
        responseListeners.add(mockListener);
        return { remove: () => responseListeners.delete(mockListener) };
      },
    ),
    __tapNotification: (data: Record<string, unknown>) => {
      const mockResponse = { notification: { request: { content: { data } } } };
      responseListeners.forEach((mockListener) => mockListener(mockResponse));
    },
    setNotificationChannelAsync: jest.fn(async () => null),
    requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
    getPermissionsAsync: jest.fn(async () => ({ granted: true })),
    // Registro en memoria de lo programado (como el del sistema operativo): un
    // identificador repetido reemplaza al anterior y cancelar lo quita.
    scheduleNotificationAsync: jest.fn(
      async (mockRequest: {
        identifier?: string;
        content: unknown;
        trigger: unknown;
      }) => {
        const identifier = mockRequest.identifier ?? `notif-${++counter}`;
        mockScheduled.set(identifier, { ...mockRequest, identifier });
        return identifier;
      },
    ),
    getAllScheduledNotificationsAsync: jest.fn(async () => [...mockScheduled.values()]),
    cancelScheduledNotificationAsync: jest.fn(async (mockId: string) => {
      mockScheduled.delete(mockId);
    }),
    cancelAllScheduledNotificationsAsync: jest.fn(async () => {
      mockScheduled.clear();
    }),
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

// Shim de plataforma: expo-audio (grabadora NATIVA; no existe en Node). Solo lo
// cargan las pantallas del dictado del personal al montar la app completa en
// los recorridos e2e; ningún test graba audio (los dictados suben un m4a real).
jest.mock('expo-audio', () => ({
  RecordingPresets: { HIGH_QUALITY: {} },
  getRecordingPermissionsAsync: jest.fn(async () => ({ granted: false })),
  requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: false })),
  setAudioModeAsync: jest.fn(async () => undefined),
  useAudioRecorder: jest.fn(() => ({
    prepareToRecordAsync: jest.fn(async () => undefined),
    record: jest.fn(),
    stop: jest.fn(async () => undefined),
    uri: null,
  })),
  useAudioRecorderState: jest.fn(() => ({ isRecording: false, durationMillis: 0 })),
}));

// Shim de plataforma: expo-sqlite (módulo NATIVO) sobre el SQLite REAL de Node
// (`node:sqlite`, en memoria por archivo de test). Las migraciones y todo el SQL
// de la app se ejecutan de verdad; solo cambia el binding nativo. Lo necesitan
// los recorridos e2e que montan la app completa (centro de notificaciones,
// tratamientos locales, preferencias).
jest.mock('expo-sqlite', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');
  return {
    openDatabaseSync: () => {
      const db = new DatabaseSync(':memory:');
      return {
        execSync: (sql: string) => db.exec(sql),
        runSync: (sql: string, params: never[] = []) => db.prepare(sql).run(...params),
        getAllSync: (sql: string, params: never[] = []) => db.prepare(sql).all(...params),
        getFirstSync: (sql: string, params: never[] = []) =>
          db.prepare(sql).get(...params) ?? null,
      };
    },
  };
});

// Shim de plataforma: expo-camera (cámara NATIVA). Sin cámara en Node: permiso
// denegado (se puede volver a pedir) y visor vacío. El emparejamiento se prueba
// por el deep link `chepicare://pair?...` que entrega el sistema al escanear.
jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [
    { granted: false, canAskAgain: true, status: 'denied' },
    jest.fn(async () => ({ granted: false, canAskAgain: true, status: 'denied' })),
  ],
}));

// Shim de plataforma: selectores NATIVOS del sistema (documentos y galería).
// Por defecto el usuario cancela; un test elige archivos con
// `mockResolvedValueOnce`, entregando los assets que da el sistema (en Node,
// como en web, con el `File` en memoria: el archivo se sube DE VERDAD).
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(async () => ({ canceled: true, assets: null })),
}));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: null })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
}));

// Shim de plataforma: expo-file-system (módulo NATIVO) sobre el sistema de
// archivos REAL de Node, en un directorio temporal: lo que la app escribe se
// puede leer y verificar byte a byte.
// (Tipos `Mock*`: jest-hoist solo deja referenciar esos nombres en el factory.)
type MockNodeFs = {
  mkdtempSync(prefix: string): string;
  existsSync(p: string): boolean;
  writeFileSync(p: string, data: string | Uint8Array): void;
};
type MockNodeOs = { tmpdir(): string };
type MockNodePath = { join(...parts: string[]): string };
jest.mock('expo-file-system', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const fs = require('node:fs') as MockNodeFs;
  const os = require('node:os') as MockNodeOs;
  const path = require('node:path') as MockNodePath;
  /* eslint-enable @typescript-eslint/no-require-imports */
  const mockCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chepicare-cache-'));
  const toPath = (part: string | { uri: string }) =>
    (typeof part === 'string' ? part : part.uri).replace(/^file:\/\//, '');
  class MockFile {
    readonly path: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.path = path.join(...parts.map(toPath));
    }
    get uri() {
      return `file://${this.path}`;
    }
    get exists() {
      return fs.existsSync(this.path);
    }
    create(options: { overwrite?: boolean } = {}) {
      if (fs.existsSync(this.path) && !options.overwrite) {
        throw new Error('El archivo ya existe');
      }
      fs.writeFileSync(this.path, new Uint8Array());
    }
    write(content: string | Uint8Array) {
      fs.writeFileSync(this.path, content);
    }
  }
  return { File: MockFile, Paths: { cache: { uri: `file://${mockCacheDir}` } } };
});

// Shim de plataforma: menú de compartir del sistema (expo-sharing).
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));
