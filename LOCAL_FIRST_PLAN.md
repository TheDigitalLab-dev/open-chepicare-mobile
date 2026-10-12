# Plan: Local-first + sincronización diferida

> Estado: **propuesta** (no implementado). Objetivo: que los registros clínicos
> creados en el móvil (consultas, historias, **pesaje**, vacunas,
> desparasitaciones, reportes) se guarden **primero en el dispositivo** y
> funcionen sin conexión, y se **sincronicen** con `../pawcare-web` cuando haya
> internet — con opción de sincronizar usando datos móviles.

## 1. Contexto y estado actual

Hoy la app es **online-first**: cada pantalla llama a su servicio de dominio
(`src/services/*`) que hace `fetch` directo al backend vía `src/services/api.ts`.
Si no hay red, la operación falla (`ApiError` network) y **no se guarda nada**.

No existe base de datos local ni cola de sincronización. La única persistencia es
`AsyncStorage` (tema, tokens vía SecureStore, URL de servidor).

Alcance de este plan: **escrituras clínicas del veterinario/staff en campo**
(donde la conectividad es intermitente). Las lecturas públicas (tienda, adopción)
y el checkout **quedan fuera** del alcance inicial.

## 2. Principios local-first

1. **La UI escribe siempre en local primero** y responde de inmediato (optimista).
2. **El identificador lo genera el cliente** (UUID v4) para que el registro exista
   y se pueda referenciar antes de tocar el servidor.
3. **Toda mutación entra en una bitácora (outbox)** y se reintenta hasta confirmar.
4. **La sincronización es idempotente**: reenviar una mutación no la duplica.
5. **Sin pérdida silenciosa**: el usuario ve el estado (pendiente / sincronizado /
   error) de cada registro.

## 3. Arquitectura propuesta

```
Pantallas (UI)
   │  (leen/escriben SOLO en local; nunca fetch directo)
   ▼
Repositorios de dominio  src/db/repositories/*      ← nueva capa
   │  CRUD sobre SQLite + encolar en outbox
   ▼
SQLite local (expo-sqlite)  src/db/*                 ← nueva capa
   ├── tablas espejo por dominio (consultations, weighings, vaccinations, …)
   └── outbox (mutaciones pendientes)
   ▲
Motor de sincronización  src/sync/*                  ← nueva capa
   │  drena el outbox (push) + refresca desde el server (pull)
   ▼
src/services/api.ts (sin cambios de contrato) → ../pawcare-web
   ▲
Conectividad  src/sync/connectivity.ts (NetInfo) — dispara sync al recuperar red
```

Los `src/services/*` actuales **se conservan** como el transporte HTTP que usa el
motor de sync; lo que cambia es que las **pantallas dejan de llamarlos directo** y
pasan a usar los repositorios locales.

## 4. Dependencias nuevas (Expo SDK 56 — verificar en https://docs.expo.dev/versions/v56.0.0/)

- **`expo-sqlite`** — base de datos local (API oficial de Expo, soporta
  transacciones y modo async). Preferido sobre WatermelonDB por menor superficie
  nativa y por alinearse con Expo.
- **`expo-crypto`** — `randomUUID()` para IDs de cliente.
- **`@react-native-community/netinfo`** — estado de conexión y **tipo** de red
  (wifi vs cellular), necesario para "sincronizar usando datos móviles".
- (Opcional) **`drizzle-orm`** con driver `expo-sqlite` para tipar el esquema y
  migraciones sin SQL crudo.

Instalar siempre con `npx expo install <paquete>` para fijar versiones compatibles.

## 5. Modelo de datos local

Cada tabla espejo lleva columnas de control de sincronización:

| Columna | Sentido |
|---|---|
| `id` (TEXT, UUID) | id de cliente; estable entre local y server |
| `server_id` (INTEGER, null) | id que asignó el backend tras sincronizar |
| `sync_status` | `pending` \| `synced` \| `error` |
| `updated_at` (ISO) | para resolución de conflictos (last-write-wins) |
| `deleted_at` (ISO, null) | borrado lógico (se sincroniza como delete) |
| `payload` … | campos del dominio (diagnosis, weight, etc.) |

**Outbox** (`sync_outbox`): `id`, `entity` (`consultation`|`weighing`|…),
`entity_id` (UUID), `op` (`create`|`update`|`delete`), `payload` (JSON),
`attempts`, `last_error`, `created_at`.

**Pesaje**: se modela como entidad propia `weighings` (pet_id, weight_kg,
measured_at, notes) aunque el backend hoy lo guarde dentro de la consulta —
así el historial de peso es consultable offline. Requiere endpoint backend (ver §7).

## 6. Flujo de sincronización

**Escritura (offline o online):**
1. La pantalla llama al repositorio: `consultationsRepo.create({...})`.
2. El repo genera `id = randomUUID()`, inserta con `sync_status='pending'` y añade
   una fila al outbox. La UI muestra el registro con chip "Pendiente".
3. Si hay red, se dispara el push de inmediato; si no, queda en el outbox.

**Push (drenar outbox):**
- Por cada fila (FIFO, respetando dependencias: p.ej. la mascota antes de su
  consulta), llamar al `service` correspondiente enviando `client_uuid`.
- **201/200** → guardar `server_id`, marcar `synced`, borrar del outbox.
- **409 (ya existe ese uuid)** → tratar como éxito (idempotencia) y guardar el
  `server_id` devuelto.
- **422 (validación)** → marcar `error`, mostrar al usuario, **no** reintentar en
  bucle.
- **red/5xx** → incrementar `attempts` con backoff exponencial; reintentar luego.

**Pull (refrescar):**
- `GET .../updated_since=<last_pull_at>` por dominio → upsert por `server_id`.
- Conflicto (registro editado en ambos lados): **last-write-wins** por `updated_at`;
  registrar el descartado en un log para auditoría. Los registros clínicos son
  mayormente *append-only*, así que los conflictos reales serán raros.

**Disparadores de sync:**
- Al recuperar conexión (NetInfo).
- Al abrir la app y al entrar a una pantalla clínica (pull incremental).
- Manualmente (botón "Sincronizar ahora").

## 7. Cambios necesarios en el backend `../pawcare-web`

1. **Aceptar `client_uuid`** en los `create` clínicos (consultas, vacunas,
   desparasitaciones, pesajes) y **deduplicar** por `(client_uuid)` →
   idempotencia. Devolver 409 + el recurso existente si ya se registró.
2. **Endpoints `updated_since`** (o `?since=`) por dominio para el pull incremental.
3. **Endpoint de pesaje** dedicado si se adopta la entidad `weighings`
   (`GET/POST /admin/pets/:id/weighings`), o exponer el peso histórico desde las
   consultas.
4. Cada respuesta debe incluir `updated_at` en UTC.

Estos cambios son aditivos y compatibles con el flujo online actual.

## 8. Fases de implementación (incremental, TDD real)

Respetando `AGENTS.md` (TDD obligatorio, tests de integración contra el backend en
ejecución, nada mockeado salvo shims nativos):

- **F1 — Infraestructura de DB local.** `expo-sqlite`, esquema + migraciones,
  helper de acceso. Tests: migración, CRUD básico, aislamiento por tabla.
- **F2 — Conectividad.** `src/sync/connectivity.ts` con NetInfo (online?, tipo de
  red). Tests unitarios del reductor de estado.
- **F3 — Outbox + un dominio piloto (Pesaje).** Repo `weighings` local + encolado +
  motor de push idempotente. Tests: crear offline → sync online → aparece en el
  backend; reintento tras 409 no duplica.
- **F4 — Pull incremental** del dominio piloto (`updated_since`) + resolución de
  conflictos. Tests de integración reales.
- **F5 — Extender a Consultas, Vacunas, Desparasitaciones, Historias.** Reusar el
  motor; un repo por dominio.
- **F6 — UI de estado.** Chips de estado por registro (Pendiente/Sincronizado/
  Error), banner global "Sin conexión — N cambios pendientes", pantalla
  "Sincronización" con botón manual.
- **F7 — Sincronizar con datos móviles.** Preferencia (por defecto: solo Wi-Fi);
  si hay cambios pendientes y solo hay red celular, ofrecer "Sincronizar usando
  datos móviles". Persistir la preferencia en AsyncStorage.

## 9. UI / UX

- **Indicador global** de conexión + nº de cambios pendientes (barra superior).
- **Estado por registro** en las listas clínicas (chip de color).
- **Pantalla "Sincronización"**: último sync, pendientes, errores con acción de
  reintento, botón "Sincronizar ahora", toggle "Permitir datos móviles".
- **Escritura optimista**: los formularios clínicos guardan y cierran sin esperar
  red; el registro aparece marcado como pendiente.

## 10. Riesgos y decisiones abiertas

- **Autenticación offline**: las escrituras se hacen con el usuario logueado; si el
  token expira estando offline, la sync se hará al recuperar red y re-autenticar.
  Definir ventana de trabajo offline aceptable.
- **Seguridad de datos clínicos en reposo**: evaluar cifrado de la DB local
  (SQLCipher / expo-sqlite con clave) por tratarse de datos sensibles.
- **Migraciones de esquema local** entre versiones de la app.
- **Orden de dependencias** en el outbox (crear mascota antes que su consulta).
- **Elección ORM**: SQL crudo tipado a mano vs. Drizzle (recomendado para
  mantenibilidad).

## 11. Definición de "hecho"

Un veterinario en una zona sin señal puede: registrar consultas, pesajes, vacunas y
notas; ver ese historial de inmediato; y al volver la conexión (Wi-Fi o, si lo
autoriza, datos móviles) todo se sincroniza con `../pawcare-web` **sin duplicados ni
pérdida**, con el estado visible en todo momento.
