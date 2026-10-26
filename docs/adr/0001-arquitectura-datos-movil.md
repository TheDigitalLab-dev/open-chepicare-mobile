# ADR 0001 — Arquitectura de datos móvil (offline-first híbrido)

- **Estado:** Aceptado
- **Fecha:** 2026-05-31
- **Contexto del producto:** Chepicare — App móvil para atención veterinaria a domicilio (Expo SDK 56 · React Native · TypeScript), cliente de un API Rails REST.

## Contexto

La aplicación habilita **atención veterinaria a domicilio**, por lo que la conectividad es
deficiente justo donde ocurre el trabajo (la casa del paciente). No todo el sistema requiere
operar sin conexión: los flujos clínicos y de cobro que suceden en la visita **sí** deben
funcionar offline, mientras que la mayoría de listados, paneles y operaciones administrativas
pueden ser online con una degradación elegante.

Decisiones de stack ya tomadas por el equipo:

- **SQLite** (vía `expo-sqlite`, con Drizzle ORM) como base de datos local.
- **redux-persist** para persistir estado de la aplicación.

Esto exige una política clara de **qué dato vive dónde**, qué se escribe offline y qué se
replica localmente solo para lectura.

## Decisión

Adoptar una **arquitectura de datos híbrida offline-first / online-first**, organizada en capas
con **Repository pattern** como costura entre la UI y las fuentes de datos:

```
UI (Screens/Components)
  → ViewModel (Hooks por feature)
  → Repository (decide local vs remoto)
  → Fuentes: SQLite (verdad offline + copia de lectura + outbox) · SecureStore (tokens) · API REST
  → Sync engine (concilia outbox ↔ API con consentimiento del usuario)
```

### Reparto de almacenamiento (regla: no duplicar el mismo dato)

- **SQLite** — datos relacionales, consultables, grandes o que deben sobrevivir offline:
  entidades offline-first, **copias de solo-lectura** (bundle de visita) y la **tabla `outbox`**
  (cola de mutaciones pendientes).
- **redux-persist** — estado de UI y *server-state* pequeño para arranque instantáneo:
  sesión/rol, tema, filtros, paso del asistente, preferencia de sincronización (opt-in) y, a lo
  sumo, el resumen del dashboard. **No** se guardan listas grandes ni historiales aquí.
- **SecureStore** — tokens y secretos (nunca en redux ni en la BD de datos).

### Clasificación de datos en tres niveles

**Nivel 1 — Offline-first** (SQLite es la fuente de verdad; escritura offline vía outbox):

- Consultas (`consultations`) y su contenido: recetas (`prescriptions`, `prescription_items`),
  vacunaciones, desparasitaciones, exámenes de laboratorio, adjuntos médicos.
- **Registro de pagos recibidos fuera de la clínica** (`POST /owner-payments/:id/register`,
  `POST /admin/payments/:id/register`) y la **subida de comprobante** (`upload_proof`).
- Cambios de estado de la cita hechos en la visita (confirmar / completar).
- Borradores de formularios (autosave).

**Nivel 2 — Online-first con copia local de solo-lectura** (se busca lo último del API; si no
hay red, se muestra la última copia cacheada; la escritura requiere conexión):

- Listados de citas, listados de pagos, productos, dashboard, perfil, pacientes/owners, servicios.
- **Bundle de visita**: copia acotada de los datos necesarios para atender una cita offline
  (la cita, la mascota, su perfil médico e historial reciente, servicios, productos, dueño).

**Nivel 3 — Online-only** (sin valor offline; no se cachea):

- Autenticación (login, registro, recuperación de contraseña).
- Generación, exportación y envío por email de reportes médicos.

### Patrón "bundle de visita" (prefetch para offline)

Antes de la visita (o al confirmar la cita, con conexión), la app **descarga y vuelca a SQLite
una copia de solo-lectura** del paquete de datos de esa cita. Offline, las pantallas de consulta
y de cobro leen esa copia; lo que se **crea** (consulta, receta, **pago recibido**) es
offline-first y entra al outbox. No se replica toda la base, solo el alcance de la visita.

### Camino de escritura offline-first (outbox + sync)

1. El usuario guarda (consulta o **pago recibido**) → `INSERT` en SQLite con
   `_status='created'`, `_local_id`, `updated_at`; la UI lee de SQLite al instante (optimista).
2. Se registra la mutación en la tabla `outbox` (método, endpoint, payload, referencia, reintentos).
   La escritura de la entidad y del outbox ocurren en **una misma transacción SQLite**.
3. Al recuperar red **y** con opt-in activo, el sync engine procesa el outbox en orden (FIFO):
   envía al API, recibe el `id` del servidor, **mapea** `local_id → server_id` (y corrige
   referencias hijas), marca `_status='synced'` y refresca las copias de lectura.

### Identificadores y conflictos

- **IDs locales temporales** para entidades creadas offline; se mapean al `id` del servidor al
  sincronizar.
- Las consultas y los pagos son prácticamente **append-only** (se agregan, no se editan en
  paralelo), por lo que el riesgo de conflicto es bajo; se usa `updated_at` con *last-write-wins*
  y se marca el campo en conflicto en los pocos casos editables.
- El backend Rails es compatible: expone `created_at`/`updated_at` y usa **soft delete (Discard)**.

## Consecuencias

**Positivas**

- El trabajo crítico de la visita (registrar consulta y **cobro**) funciona sin conexión.
- Se evita la sobre-ingeniería: solo se sincroniza bidireccionalmente lo que lo necesita.
- Cumple `RNF-REL-003` (offline), `RNF-MOB-002` (sync con consentimiento), `RNF-REL-002`
  (borradores → RPO) y `RNF-SEC-001` (tokens en SecureStore).

**Negativas / costos**

- Hay que construir y mantener el **outbox**, el mapeo de IDs y el prefetch del bundle.
- Dos almacenes (SQLite y redux-persist) exigen disciplina para no duplicar datos.
- El cobro offline implica que el saldo/estado real del pago se confirma **al sincronizar**; la
  UI debe mostrarlo como "pendiente de sincronización" hasta entonces.

## Alternativas consideradas

- **WatermelonDB** (offline-first reactivo con sync incluido): más potente, pero requiere *dev
  build* y un endpoint de sync dedicado; se descartó para mantener `expo-sqlite` + redux-persist.
- **TanStack Query + persister**: excelente para online-first, pero el offline de **escritura**
  es limitado; no cubre bien el cobro/consulta en casa.
- **Todo offline-first**: costo de sincronización y resolución de conflictos injustificado para
  listados y administración.

## Notas de implementación

- `expo-sqlite` + **Drizzle ORM** (consultas tipadas + migraciones), acorde a TypeScript estricto.
- El **outbox es una tabla SQLite** (transaccional con la escritura), no un slice de redux.
- Repositorios por feature: `offlineFirstRepo` (lee SQLite, escribe SQLite+outbox) vs
  `onlineFirstRepo` (fetch API, cachea copia de lectura, fallback a copia si offline).
- Indicador de estado de sincronización visible (sincronizando / al día / pendiente / error).
- Token en SecureStore; la BD de datos no almacena secretos.
