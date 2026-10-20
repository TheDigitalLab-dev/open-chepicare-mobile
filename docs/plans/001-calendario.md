# Plan 001 — Calendario / agenda en la app móvil

Pedido del dueño: «calendario/agenda para propietarios y veterinarios, bien
organizado, con las fechas que tienen citas y, en el caso de los propietarios,
con los tratamientos».

Backend: open-chepicare-web PR #73 (plan `docs/plans/034-calendar.md`), ya en
`main`. Endpoints JSON con Bearer:

| Ruta | Quién |
|------|-------|
| `GET /owner-calendar-events?start&end[&pet_id][&types][&include_cancelled]` | Propietario |
| `GET /admin/calendar-events?start&end[&vet_id=me\|all\|id][&types][&include_cancelled]` | Personal con `appointments:read` |

Rango en días de la clínica, ambos incluidos, máximo 62 días (400 si no).

## Epic 1 — Datos del calendario

#### US-1.1: Servicio y tipos del calendario
**Como** desarrollador de la app
**Quiero** un servicio `calendar` con los tipos del contrato
**Para** consumir los eventos reales del backend sin duplicar lógica

**Criterios de aceptación:**
- [x] `getOwnerCalendarEvents` y `getStaffCalendarEvents` contra las rutas reales.
- [x] La respuesta enseña la zona horaria de la clínica (`range.time_zone`).
- [x] Filtros `types`, `include_cancelled`, `vet_id`; errores 400/403 como `ApiError`.
- [x] Test de integración real (propietario y personal, canceladas creadas de verdad).

**Archivos:**
- `src/types/calendar.ts`
- `src/services/calendar.ts`
- `src/services/__tests__/calendar.test.ts`

#### US-1.2: Cuadrícula y textos del calendario
**Como** usuario
**Quiero** ver el mes en semanas de lunes a domingo con los eventos en su día
**Para** entender de un vistazo qué días tienen algo

**Criterios de aceptación:**
- [x] Semanas completas que cubren el mes (≤ 42 días → una sola petición).
- [x] Un tratamiento de varios días aparece en cada día de su periodo.
- [x] Etiquetas de estado, hora/periodo, subtítulo por audiencia y etiqueta accesible por día.
- [x] "Nueva cita": personal desde hoy, propietario desde mañana, solo con `can_create_appointment`.

**Archivos:**
- `src/utils/calendarGrid.ts`, `src/utils/calendarEvents.ts`
- `src/utils/__tests__/calendarGrid.test.ts`, `src/utils/__tests__/calendarEvents.test.ts`

#### US-1.3: Hook `useCalendar`
**Como** pantalla de calendario
**Quiero** un hook con mes, día elegido, eventos, filtros y permisos
**Para** que las pantallas sean solo composición de componentes dumb

**Criterios de aceptación:**
- [x] Solo cuenta la última respuesta (cambiar de mes rápido no mezcla datos).
- [x] Leyenda que oculta tipos en el cliente; toggle de canceladas que pide de nuevo.
- [x] Filtro de veterinario: por defecto el del servidor (vet → «Mis citas», admin/recepción → «Toda la clínica»).
- [x] Estados de carga y error (403 para quien no puede ver citas).

**Archivos:**
- `src/hooks/useCalendar.ts`
- `src/hooks/__tests__/useCalendar.test.tsx`

## Epic 2 — Pantallas

#### US-2.1: Calendario del propietario
**Como** propietario
**Quiero** ver citas, tratamientos, próximas vacunas y desparasitaciones de mis mascotas
**Para** organizar los cuidados de mis mascotas

**Criterios de aceptación:**
- [x] Vista mes con puntos de color por tipo y la lista del día debajo; leyenda.
- [x] Tocar una cita abre su detalle; los demás eventos abren la ficha de la mascota.
- [x] Entrada desde Inicio (accesos rápidos) y desde la pestaña Citas.
- [x] Estados de carga, error y vacío; modo oscuro con tokens `event*`.

**Archivos:**
- `src/screens/owner/OwnerCalendarScreen.tsx`
- `src/components/domain/Calendar*.tsx`, `src/theme/tokens.ts`, `src/theme/eventColors.ts`

#### US-2.2: Calendario del personal
**Como** veterinario, administrador o recepcionista
**Quiero** ver la agenda en un calendario con filtro de veterinario
**Para** organizar las citas de la clínica

**Criterios de aceptación:**
- [x] Filtro «Mis citas / Toda la clínica / otro veterinario».
- [x] Vacunas y desparasitaciones solo si el rol puede verlas (lo decide el servidor).
- [x] Entrada desde la pestaña Agenda y desde Más.

**Archivos:**
- `src/screens/admin/AdminCalendarScreen.tsx`
- `src/navigation/AdminTabs.tsx`, `src/navigation/types.ts`

#### US-2.3: Agendar desde un día del calendario
**Como** usuario que puede agendar
**Quiero** pulsar «Nueva cita» en un día
**Para** abrir el asistente de siempre con ese día ya elegido

**Criterios de aceptación:**
- [x] El asistente abre en el mes del día y lo deja elegido si el servidor lo ofrece.
- [x] Si el día no tiene agenda, avisa y deja elegir otro.
- [x] Mismas reglas de permisos que hoy (personal desde hoy; propietario desde mañana).

**Archivos:**
- `src/hooks/useAppointmentBooking.ts`, `src/hooks/useAdminSchedule.ts` (+ tests)
- `src/screens/owner/AppointmentWizardScreen.tsx`, `src/screens/admin/AdminAppointmentWizardScreen.tsx`
- `src/__tests__/e2e/calendar.e2e.test.tsx`

## Epic 3 — Documentación

#### US-3.1: Manual de usuario
**Como** usuario final
**Quiero** una guía del calendario
**Para** saber qué muestra y cómo agendar desde él

**Criterios de aceptación:**
- [x] `docs/user-manual/calendario.md` enlazado desde `Index.md`.

**Archivos:**
- `docs/user-manual/calendario.md`, `docs/user-manual/Index.md`

## Orden de implementación

1. Fase 1 — US-1.1, US-1.2 (tests primero, integración real).
2. Fase 2 — US-1.3 y precarga de los asistentes (US-2.3, hooks).
3. Fase 3 — Componentes dumb, pantallas y navegación (US-2.1, US-2.2), e2e.
4. Fase 4 — Manual (US-3.1).

## Fuera de alcance

- Arrastrar para reprogramar, vistas semana/día en el teléfono (la web las tiene;
  en el teléfono la vista mes + lista del día cubre el caso), precargar la hora.
