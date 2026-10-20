# Eventos de la clínica

La clínica publica **eventos** (jornadas de vacunación, ferias de adopción,
charlas…) con un **cupo máximo** de participantes. En la app ChepiCare los
**propietarios** ven los eventos, se inscriben con un toque y cancelan su
inscripción. El **personal** (veterinarios y administradores) solo ve, en su
Inicio, cuántas personas hay inscritas en cada evento próximo: los eventos se
crean, editan y gestionan desde la **web** (Admin → Eventos).

Todo viene del servidor de tu clínica: el cupo es el mismo que en la web y en el
formulario público, donde también se inscriben personas sin cuenta.

## 📋 Tabla de Contenidos

- [Dónde están los eventos](#dónde-están-los-eventos)
- [Propietarios: ver eventos y cupos](#propietarios-ver-eventos-y-cupos)
- [Propietarios: inscribirse](#propietarios-inscribirse)
- [Propietarios: Mis inscripciones y cancelar](#propietarios-mis-inscripciones-y-cancelar)
- [Eventos en el calendario](#eventos-en-el-calendario)
- [Personal: resumen de inscritos](#personal-resumen-de-inscritos)
- [Solución de problemas](#solución-de-problemas)

## Dónde están los eventos

| Quién | Cómo llegar | Qué puede hacer |
|-------|-------------|-----------------|
| Propietario | **Inicio → Accesos rápidos → Eventos** | Ver eventos, inscribirse, cancelar, «Mis inscripciones» |
| Personal (vet/admin) | **Inicio → Eventos próximos** | Solo ver «N inscritos de M» (no se abre ni se gestiona) |

## Propietarios: ver eventos y cupos

La lista muestra los eventos **publicados que aún no terminaron**, del más
cercano al más lejano. Cada tarjeta indica:

- título, fecha y hora (en la zona horaria de la clínica) y lugar;
- los cupos: **«Quedan N cupos»** o **«Cupo completo»**;
- **«Inscrito»** si ya estás inscrito.

Toca un evento para ver su **detalle**: descripción, «N inscritos de M» y hasta
cuándo se aceptan inscripciones.

## Propietarios: inscribirse

En el detalle, pulsa **Inscribirme**. No hay formulario: la clínica usa el
nombre, correo y teléfono de tu cuenta. Al terminar verás **«Estás inscrito en
este evento.»** y recibirás un correo de confirmación (si la clínica tiene el
correo configurado).

| Lo que ves | Significa |
|------------|-----------|
| **Inscribirme** | Hay cupo y las inscripciones están abiertas. |
| **Cupo completo** (botón desactivado) | No quedan plazas. No hay lista de espera. |
| «Las inscripciones de este evento están cerradas.» | Pasó la fecha límite o el evento ya empezó. |
| «La clínica canceló este evento.» | El evento no se realizará. |

Si dos personas piden la última plaza a la vez, el servidor solo acepta una; a
la otra le aparece «Cupo completo» y el cupo se actualiza solo.

## Propietarios: Mis inscripciones y cancelar

**Eventos → Mis inscripciones** lista tus inscripciones activas y canceladas.
Para cancelar, pulsa **Cancelar inscripción** (en la lista o en el detalle del
evento) y confirma. La plaza queda libre para otra persona y puedes volver a
inscribirte mientras haya cupo. Un evento que ya terminó no se puede cancelar.

## Eventos en el calendario

Los eventos en los que estás inscrito aparecen en tu **Calendario** con el color
🩷 **rosa** y la leyenda **«Eventos de la clínica»**. Al tocarlo se abre el
detalle del evento. Ver [Calendario / agenda](calendario.md).

## Personal: resumen de inscritos

En la app, el personal ve en **Inicio** la tarjeta **«Eventos próximos»** con
cada evento, su fecha y **«N inscritos de M»**. Es solo informativa:

- las filas **no se pueden tocar** ni abrir;
- no hay lista de inscritos ni datos personales;
- crear, editar, cancelar inscripciones o exportar el CSV se hace en la **web**
  (Admin → Eventos).

Si tu rol no tiene el permiso de ver eventos, la tarjeta no aparece.

## Solución de problemas

| Problema | Qué hacer |
|----------|-----------|
| «No se pudo cargar» | Revisa la conexión y pulsa **Reintentar**. |
| No veo un evento | Solo salen los publicados que no terminaron; los borradores no se muestran. |
| «Este correo ya está inscrito en el evento» | Ya tienes una inscripción activa (quizá desde el formulario público con el mismo correo). |
| El personal no ve «Eventos próximos» | Su rol no tiene el permiso `events:read`; pídelo al administrador. |

---

**Nota**: requiere el servidor de la clínica con el módulo de eventos
(open-chepicare-web PR #76).
