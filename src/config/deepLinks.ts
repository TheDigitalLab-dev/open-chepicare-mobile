/**
 * Esquemas de deep link de la app.
 *
 * `chepicare://` es el principal desde el cambio de nombre. `pawcare://` sigue
 * registrado y aceptado: los QR de emparejamiento y los enlaces ya emitidos (y
 * los servidores que aún no se actualizaron) lo usan. El orden importa: el
 * primero es el que la app genera.
 */
export const DEEP_LINK_SCHEMES = ['chepicare', 'pawcare'] as const;

export const DEEP_LINK_PREFIXES = DEEP_LINK_SCHEMES.map((scheme) => `${scheme}://`);

/** Prefijo con el que la app construye sus propios enlaces. */
export const PRIMARY_DEEP_LINK_PREFIX = DEEP_LINK_PREFIXES[0];
