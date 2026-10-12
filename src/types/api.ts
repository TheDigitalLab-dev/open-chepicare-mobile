/**
 * Tipos compartidos de la capa API (F3).
 *
 * Los contratos concretos de cada dominio (User, Pet, Appointment…) se definen
 * en sus propios archivos de `types/`. Aquí solo viven los genéricos.
 */

/** Errores de validación por campo (respuestas 422). */
export type FieldErrors = Record<string, string[]>;

export type ApiErrorKind =
  | 'network' // sin conexión / DNS / fetch falló
  | 'timeout' // se excedió el tiempo de espera
  | 'unauthorized' // 401
  | 'forbidden' // 403
  | 'notFound' // 404
  | 'conflict' // 409 (p. ej. `ai_disabled`: la IA está apagada en el servidor)
  | 'validation' // 422
  | 'rateLimited' // 429 (Rack::Attack en login/forgot/reset/refresh)
  | 'server' // 5xx
  | 'unknown';

/** Error normalizado que consume la UI (mensajes en español, sin stack/token). */
export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly fieldErrors?: FieldErrors;
  /**
   * Código de error del servidor cuando lo envía (`{ error, code }`), p. ej.
   * `ai_disabled`; o código anónimo de correlación (RNF-OBS-001).
   */
  readonly code?: string;

  constructor(params: {
    message: string;
    status: number;
    kind: ApiErrorKind;
    fieldErrors?: FieldErrors;
    code?: string;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.kind = params.kind;
    this.fieldErrors = params.fieldErrors;
    this.code = params.code;
  }
}

/** Normaliza cualquier excepción a ApiError (para estados de error de UI). */
export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  return new ApiError({
    message: 'Ocurrió un error inesperado.',
    status: 0,
    kind: 'unknown',
  });
}

/** Resultado paginado, cuando el endpoint lo ofrezca (RNF-PERF-001). */
export interface Paginated<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/** Metadatos `pagination` de los índices paginados del backend (snake_case). */
export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/** Búsqueda en el servidor de los índices `*-list` (nombre, correo, documento…). */
export interface SearchOptions {
  search?: string;
}

/** Par de tokens Bearer que entrega el backend. */
export interface AuthTokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  /** Query string. */
  params?: QueryParams;
  /** Cuerpo JSON para métodos que normalmente no lo llevan (p. ej. DELETE). */
  body?: unknown;
  /** Headers extra. */
  headers?: Record<string, string>;
  /** Si false, no inyecta Authorization (endpoints públicos). Default true. */
  auth?: boolean;
  /** Si true, no intenta refresh ante 401 (evita bucles en /auth/refresh). */
  skipRefresh?: boolean;
  /** Timeout específico (ms). */
  timeoutMs?: number;
}
