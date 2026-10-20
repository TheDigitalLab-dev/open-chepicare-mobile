# Calendario / agenda

La app ChepiCare tiene un **calendario** para propietarios de mascotas y para el
personal de la clínica. Muestra en una vista de mes los días con eventos (con un
punto de color por tipo) y, debajo, la lista del día que elijas. Todo viene del
servidor de tu clínica: es el mismo calendario que la web.

## 📋 Tabla de Contenidos

- [Dónde está el calendario](#dónde-está-el-calendario)
- [Qué muestra a cada quién](#qué-muestra-a-cada-quién)
- [Colores y leyenda](#colores-y-leyenda)
- [Moverse por el calendario](#moverse-por-el-calendario)
- [Filtro de veterinario (personal)](#filtro-de-veterinario-personal)
- [Citas canceladas](#citas-canceladas)
- [Abrir un evento](#abrir-un-evento)
- [Agendar una cita desde el calendario](#agendar-una-cita-desde-el-calendario)
- [Solución de problemas](#solución-de-problemas)

## Dónde está el calendario

| Quién | Cómo llegar |
|-------|-------------|
| Propietario | **Inicio → Accesos rápidos → Calendario**, o pestaña **Citas** → icono de calendario arriba a la derecha |
| Personal | Pestaña **Agenda** → icono de calendario arriba a la derecha, o **Más → Calendario** |

## Qué muestra a cada quién

**Propietarios** — solo sus mascotas:

- **Citas** de sus mascotas (a su hora, en la zona horaria de la clínica).
- **Tratamientos** (recetas): cada medicamento ocupa los días de su periodo,
  desde el día de la consulta hasta el fin de la duración indicada por el
  veterinario («7 días», «2 semanas»…). Si la receta no tiene duración, sale
  solo el día en que se emitió.
- **Próximas vacunas** (próxima dosis y planes de vacunación) y
  **desparasitaciones**. Si la fecha ya pasó aparecen como «Vencida».

**Personal de la clínica:**

- **Veterinarios**: al abrir ven **sus** citas («Mis citas»).
- **Administración y recepción**: ven las citas de **toda la clínica**.
- Las **vacunas** y **desparasitaciones** próximas solo aparecen si tu rol ya
  puede ver esos datos; si no, solo verás citas.
- Quien hoy no puede ver citas (por ejemplo finanzas o RR. HH.) tampoco puede
  ver el calendario: la app muestra «No tienes permiso para realizar esta
  acción».

## Colores y leyenda

| Color | Tipo |
|-------|------|
| 🔵 Azul | Citas |
| 🟣 Morado | Tratamientos (solo propietarios) |
| 🟢 Verde | Vacunas |
| 🟠 Naranja | Desparasitaciones |
| 🩷 Rosa | Eventos de la clínica en los que estás inscrito (solo propietarios; al tocarlo se abre el evento, ver [Eventos de la clínica](eventos.md)) |

Los colores se ajustan al **modo oscuro**. Debajo del mes está la **leyenda**:
toca un tipo para ocultarlo (queda tachado) y vuelve a tocarlo para mostrarlo.

## Moverse por el calendario

- **‹ / ›**: mes anterior / siguiente.
- **Hoy**: vuelve al día de hoy (de la clínica).
- Toca un **día** para ver su lista debajo del mes. El día de hoy tiene un
  borde; el elegido, fondo de color.

## Filtro de veterinario (personal)

Debajo de la leyenda está **Veterinario**:

- **Mis citas** (solo si atiendes citas).
- **Toda la clínica**.
- Un **veterinario** concreto: sus citas y las vacunas o desparasitaciones que
  aplicó a sus pacientes.

## Citas canceladas

Están ocultas. Activa **Mostrar citas canceladas** para verlas (aparecen
tachadas). Las citas reagendadas se ven siempre.

## Abrir un evento

- Una **cita** abre su detalle (confirmar, reprogramar, pagar…).
- Un **tratamiento**, una **vacuna** o una **desparasitación** abre la ficha de
  la mascota.

## Agendar una cita desde el calendario

1. Toca el día.
2. Pulsa **Nueva cita** (junto al título del día).
3. Se abre el asistente de citas de siempre con ese **día ya elegido**: elige
   mascota (y dueño, si eres del personal), servicio, veterinario y hora.

Reglas:

- **Personal**: desde hoy, si tu rol puede crear citas.
- **Propietarios**: desde mañana, igual que el asistente de citas.
- Si el día no tiene horarios en la clínica (cerrado o sin veterinarios), el
  asistente lo avisa y te deja elegir otro día.
- La hora no se precarga: depende del veterinario y del servicio.

## Solución de problemas

| Problema | Qué hacer |
|----------|-----------|
| «No se pudo cargar» | Revisa la conexión y pulsa **Reintentar**. |
| «No tienes permiso…» | Tu rol no puede ver citas; pide acceso al administrador. |
| No veo «Nueva cita» | El día ya pasó (o es hoy, si eres propietario) o tu rol no puede crear citas. |
| Falta un tratamiento | Solo salen las recetas de consultas de tus mascotas; sin duración, solo el día de emisión. |

---

**Nota**: no se puede arrastrar una cita para reprogramarla; usa **Reprogramar**
en el detalle de la cita.
