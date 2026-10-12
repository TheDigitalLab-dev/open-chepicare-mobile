/**
 * Tiempo real del asistente IA: cliente mínimo del protocolo ActionCable
 * (`actioncable-v1-json`) sobre el WebSocket de React Native.
 *
 * - URL: `ws(s)://<servidor>/cable`, derivada del servidor configurado.
 * - Autenticación: cabecera `Authorization: Bearer <access_token>` (el
 *   WebSocket de RN acepta cabeceras). NUNCA token en query params.
 * - Canal `AiUpdatesChannel` (stream por usuario): `{ type: "voice_dictation" }`
 *   y `{ type: "ai_message" }` con el recurso completo.
 * - Reconexión con espera creciente; si el servidor rechaza la sesión (token
 *   vencido) se renueva una vez con el refresh y se reintenta. Si sigue
 *   rechazando queda en `unauthorized` (los hooks siguen con polling).
 */
import { getApiBaseUrl } from '@/config/serverConfig';
import type { AiUpdate } from '@/types/assistant';
import * as secureStore from '@/utils/secureStore';
import { fetchCurrentUser } from './auth';

export type AiUpdatesStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'unauthorized'
  | 'closed';

export interface AiUpdatesHandlers {
  onUpdate: (update: AiUpdate) => void;
  onStatus?: (status: AiUpdatesStatus) => void;
}

export interface AiUpdatesConnection {
  close: () => void;
}

const CHANNEL_IDENTIFIER = JSON.stringify({ channel: 'AiUpdatesChannel' });
const PROTOCOLS = ['actioncable-v1-json', 'actioncable-unsupported'];
/**
 * Constructor del WebSocket de React Native: acepta cabeceras en el tercer
 * argumento. Los tipos DOM del proyecto solo conocen la firma del navegador.
 */
type ReactNativeWebSocketCtor = new (
  uri: string,
  protocols?: string | string[] | null,
  options?: { headers: Record<string, string> },
) => WebSocket;

const RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];

/** `http://host:3000` → `ws://host:3000/cable`; `https://…` → `wss://…/cable`. */
export function cableUrlFor(baseUrl: string): string {
  return `${baseUrl.replace(/^http/i, 'ws').replace(/\/+$/, '')}/cable`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasId(value: unknown): boolean {
  return isRecord(value) && typeof value.id === 'number';
}

/** Valida la forma del mensaje del canal antes de entregarlo a la app. */
export function toAiUpdate(message: unknown): AiUpdate | null {
  if (!isRecord(message)) return null;
  if (message.type === 'voice_dictation' && hasId(message.voice_dictation)) {
    return message as unknown as AiUpdate;
  }
  if (message.type === 'ai_message' && hasId(message.message)) {
    return message as unknown as AiUpdate;
  }
  return null;
}

export function connectAiUpdates(handlers: AiUpdatesHandlers): AiUpdatesConnection {
  let closed = false;
  let socket: WebSocket | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;
  let refreshedAfterReject = false;
  let rejected = false;
  // Cada intento de conexión tiene su generación: los eventos tardíos de un
  // socket anterior no deben disparar reconexiones duplicadas.
  let generation = 0;

  const setStatus = (status: AiUpdatesStatus) => {
    if (!closed || status === 'closed') handlers.onStatus?.(status);
  };

  const scheduleReconnect = () => {
    if (closed) return;
    const delay = RECONNECT_DELAYS_MS[Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)]!;
    attempt += 1;
    retryTimer = setTimeout(() => void open(), delay);
  };

  const onRejected = async () => {
    rejected = true;
    if (refreshedAfterReject) {
      setStatus('unauthorized');
      return;
    }
    refreshedAfterReject = true;
    try {
      // /me renueva el access token de forma transparente si venció.
      await fetchCurrentUser();
      rejected = false;
      socket?.close();
      if (!closed) void open();
    } catch {
      setStatus('unauthorized');
    }
  };

  const handleFrame = (raw: unknown) => {
    if (typeof raw !== 'string') return;
    let frame: unknown;
    try {
      frame = JSON.parse(raw);
    } catch {
      return;
    }
    if (!isRecord(frame)) return;
    switch (frame.type) {
      case 'welcome':
        socket?.send(
          JSON.stringify({ command: 'subscribe', identifier: CHANNEL_IDENTIFIER }),
        );
        return;
      case 'confirm_subscription':
        attempt = 0;
        refreshedAfterReject = false;
        setStatus('connected');
        return;
      case 'reject_subscription':
        void onRejected();
        return;
      case 'disconnect':
        if (frame.reason === 'unauthorized') void onRejected();
        return;
      case 'ping':
        return;
      default: {
        if (frame.identifier !== CHANNEL_IDENTIFIER) return;
        const update = toAiUpdate(frame.message);
        if (update) handlers.onUpdate(update);
      }
    }
  };

  async function open(): Promise<void> {
    if (closed) return;
    const gen = ++generation;
    setStatus('connecting');
    const token = await secureStore.getAccessToken();
    if (closed || gen !== generation) return;
    if (!token) {
      setStatus('unauthorized');
      return;
    }
    const RNWebSocket = WebSocket as unknown as ReactNativeWebSocketCtor;
    const ws = new RNWebSocket(cableUrlFor(getApiBaseUrl()), PROTOCOLS, {
      headers: { Authorization: `Bearer ${token}` },
    });
    socket = ws;
    ws.onmessage = (event) => handleFrame(event.data);
    ws.onclose = () => {
      if (socket === ws) socket = null;
      if (closed || rejected || gen !== generation) return;
      setStatus('disconnected');
      scheduleReconnect();
    };
    // El error siempre viene seguido de `close`, que decide si reintentar.
    ws.onerror = () => {};
  }

  void open();

  return {
    close() {
      if (closed) return;
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
      socket = null;
      setStatus('closed');
    },
  };
}

// --- Conexión compartida ---------------------------------------------------------

type SharedListener = AiUpdatesHandlers;

const sharedListeners = new Set<SharedListener>();
let sharedConnection: AiUpdatesConnection | null = null;
let sharedStatus: AiUpdatesStatus = 'closed';

/**
 * Suscribe a la conexión ÚNICA de la app (una por usuario/dispositivo, con
 * conteo de referencias): varias pantallas montadas a la vez comparten el
 * WebSocket. El oyente recibe enseguida el último estado conocido. Devuelve
 * la función para desuscribirse; con el último oyente se cierra la conexión.
 */
export function subscribeAiUpdates(listener: SharedListener): () => void {
  sharedListeners.add(listener);
  if (sharedConnection) {
    listener.onStatus?.(sharedStatus);
  } else {
    sharedConnection = connectAiUpdates({
      onUpdate: (update) => {
        for (const l of sharedListeners) l.onUpdate(update);
      },
      onStatus: (status) => {
        sharedStatus = status;
        for (const l of sharedListeners) l.onStatus?.(status);
      },
    });
  }
  return () => {
    sharedListeners.delete(listener);
    if (sharedListeners.size === 0 && sharedConnection) {
      const connection = sharedConnection;
      sharedConnection = null;
      connection.close();
      sharedStatus = 'closed';
    }
  };
}

/** Reconecta la conexión compartida (cambio de sesión o de servidor). */
export function restartAiUpdates(): void {
  if (!sharedConnection) return;
  const listeners = [...sharedListeners];
  const connection = sharedConnection;
  sharedConnection = null;
  sharedListeners.clear();
  connection.close();
  for (const l of listeners) subscribeAiUpdates(l);
}
