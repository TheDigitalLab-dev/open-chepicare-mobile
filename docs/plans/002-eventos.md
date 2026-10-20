# Plan 002 — Eventos de la clínica en la app móvil

Pedido del dueño: «módulo de eventos con inscripciones por formulario y límite
de participantes para externos, que se vea también en los propietarios, aparte
del lado de vet y admins. En la app móvil solo debe poderse acceder desde el
lado de propietarios; en vet y admin (app móvil) solo puede verse la cantidad de
inscritos, pero no debe manejarse desde allí ni poderse abrir desde allí».

Backend: open-chepicare-web PR #76 (plan `docs/plans/035-clinic-events.md`,
**sin mergear**: esta app depende de él). Endpoints JSON con Bearer:

| Ruta | Quién |
|------|-------|
| `GET /owner-events-list` · `GET /owner-events/:id` | Propietario |
| `POST /owner-events/:id/register` | Propietario (un toque, datos de su cuenta) |
| `GET /owner-event-registrations-list` · `POST /owner-event-registrations/:id/cancel` | Propietario |
| `GET /admin/events-summary` | Personal con `events:read` (solo id, título, fechas, cupo e inscritos) |
| `GET /owner-calendar-events` | Propietario: tipo nuevo `clinic_event` (aditivo, `pet: null`) |

Los externos se inscriben en la web pública (`/eventos/:slug`); la app no
expone ese formulario.

## Epic 1 — Datos

#### US-1.1: Servicio y tipos de eventos
**Como** desarrollador de la app
**Quiero** un servicio `events` con los tipos del contrato
**Para** consumir los eventos reales del backend

**Criterios de aceptación:**
- [x] Listar, detalle, inscribirse, Mis inscripciones y cancelar contra las rutas reales.
- [x] Errores `duplicate`/`full` (409) y `closed`/`invalid` (422) llegan como `ApiError` con `code`.
- [x] Resumen del personal sin datos de inscritos (el test verifica las claves exactas).
- [x] Test de integración real; cada inscripción creada se cancela de verdad.

**Archivos:**
- `src/types/events.ts`, `src/services/events.ts`
- `src/services/__tests__/events.test.ts`

#### US-1.2: Reglas de presentación
**Como** propietario o miembro del personal
**Quiero** textos claros de cupo, horario y estado
**Para** saber si puedo inscribirme y cuántos van

**Criterios de aceptación:**
- [x] «Quedan N cupos» / «Queda 1 cupo» / «Cupo completo».
- [x] Estado del botón: abierto, inscrito, lleno, cerrado, cancelado.
- [x] «N inscritos de M» con singular; horario en la zona de la clínica.
- [x] Solo se cancela una inscripción activa de un evento que no terminó.

**Archivos:**
- `src/utils/clinicEvents.ts`, `src/utils/__tests__/clinicEvents.test.ts`

## Epic 2 — Propietario

#### US-2.1: Lista y detalle de eventos
**Como** propietario
**Quiero** ver los eventos próximos con sus cupos y su detalle
**Para** decidir a cuál ir

**Criterios de aceptación:**
- [x] Acceso desde Inicio → Accesos rápidos → Eventos.
- [x] Estados de carga, error (con reintento) y vacío; modo oscuro con tokens.
- [x] «Inscrito» y cupos en cada tarjeta; detalle con «N inscritos de M» y fecha límite.

**Archivos:**
- `src/hooks/useOwnerEvents.ts`, `src/hooks/useOwnerEvent.ts`
- `src/screens/owner/OwnerEventsScreen.tsx`, `src/screens/owner/OwnerEventDetailScreen.tsx`
- `src/components/domain/ClinicEventCard.tsx`

#### US-2.2: Inscripción de un toque y cancelación
**Como** propietario
**Quiero** inscribirme con un toque y poder cancelar
**Para** no repetir mis datos

**Criterios de aceptación:**
- [x] «Inscribirme» sin formulario; el cupo se actualiza con la respuesta del servidor.
- [x] Evento lleno: «Cupo completo» y botón desactivado; si el servidor rechaza, se muestra su mensaje y se recarga el cupo real.
- [x] «Mis inscripciones» (activas y canceladas) con «Cancelar inscripción» y confirmación.

**Archivos:**
- `src/hooks/useMyEventRegistrations.ts`
- `src/screens/owner/OwnerEventRegistrationsScreen.tsx`
- `src/components/domain/EventRegistrationRow.tsx`
- `src/hooks/__tests__/useOwnerEvents.test.tsx`

#### US-2.3: Eventos en el calendario
**Como** propietario
**Quiero** ver en mi calendario los eventos en los que estoy inscrito
**Para** tenerlos junto a mis citas

**Criterios de aceptación:**
- [x] Tipo `clinic_event` con color `eventClinic` (claro/oscuro, mismo tono que `--event-clinic` de la web) y leyenda «Eventos de la clínica».
- [x] Tocarlo abre el detalle del evento; `pet: null` tolerado en todo el calendario.

**Archivos:**
- `src/types/calendar.ts`, `src/theme/tokens.ts`, `src/theme/eventColors.ts`
- `src/utils/calendarEvents.ts`, `src/screens/owner/OwnerCalendarScreen.tsx`

## Epic 3 — Personal (solo lectura)

#### US-3.1: Resumen «Eventos próximos»
**Como** veterinario o administrador en la app
**Quiero** ver cuántos inscritos tiene cada evento próximo
**Para** estar al tanto sin gestionar desde el teléfono

**Criterios de aceptación:**
- [x] Tarjeta en Inicio con título, fecha y «N inscritos de M».
- [x] Las filas NO son tocables: sin `onPress`, sin navegación, sin rol de botón.
- [x] No existe ninguna pantalla de eventos en el árbol del personal (test e2e recorre todas sus pestañas).
- [x] Sin permiso `events:read` (403) la tarjeta no aparece.

**Archivos:**
- `src/hooks/useStaffEventsSummary.ts`, `src/hooks/__tests__/useStaffEventsSummary.test.tsx`
- `src/components/domain/StaffEventsSummaryCard.tsx`
- `src/screens/admin/AdminDashboardScreen.tsx`
- `src/__tests__/e2e/events.e2e.test.tsx`

## Orden de implementación

1. US-1.1 → US-1.2 (TDD: test de integración / unitario primero).
2. US-2.1 → US-2.2 (hooks con TDD, luego pantallas).
3. US-2.3 (calendario).
4. US-3.1 y e2e de propietario y personal.

## Fuera de alcance

- Formulario de externos en la app (es web pública).
- Lista de espera, notas en la inscripción desde la app (el backend las acepta; la
  inscripción es de un toque).
- Gestión de eventos desde la app del personal (decisión del dueño).
