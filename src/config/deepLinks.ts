/**
 * Esquemas de deep link de la app: `chepicare://` (QR de emparejamiento y
 * enlaces de recuperación de contraseña que emite el servidor). El primero es
 * el que la app genera.
 */
export const DEEP_LINK_SCHEMES = ['chepicare'] as const;

export const DEEP_LINK_PREFIXES = DEEP_LINK_SCHEMES.map((scheme) => `${scheme}://`);

/** Prefijo con el que la app construye sus propios enlaces. */
export const PRIMARY_DEEP_LINK_PREFIX = DEEP_LINK_PREFIXES[0];
