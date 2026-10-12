# Asistente IA en la app móvil

La app puede conectarse al servidor de tu clínica escaneando un código QR, dictar
consultas con una nota de voz y conversar con el asistente por texto o por voz.
Todo lo que el asistente hace queda registrado y lo clínicamente sensible espera
tu confirmación.

## 📋 Tabla de Contenidos

- [Conectar la app a tu servidor con un QR](#conectar-la-app-a-tu-servidor-con-un-qr)
- [Dictar una consulta](#dictar-una-consulta)
- [Chat con el asistente](#chat-con-el-asistente)
- [Notificaciones](#notificaciones)
- [Si no ves el asistente](#si-no-ves-el-asistente)
- [Solución de problemas](#solución-de-problemas)

## Conectar la app a tu servidor con un QR

1. En la **web** de tu clínica entra a **Perfil → Conectar app móvil** y genera
   el código.
2. En la app toca **Emparejar con código QR** (en la pantalla de inicio de
   sesión, en **Configurar servidor**, o en **Más / Perfil**).
3. Permite el uso de la cámara y apunta al código.

La app guarda la dirección del servidor de forma segura e inicia sesión con tu
usuario. El código sirve **una sola vez** y vence a los **10 minutos**; si falla,
genera uno nuevo. Desde el Perfil de la web puedes ver y **revocar** los
teléfonos emparejados.

> ⚠️ El teléfono debe poder llegar a la dirección del servidor que aparece en el
> QR (la misma red o una dirección pública).

## Dictar una consulta

Disponible para el personal con permiso, si el servidor tiene IA activada.

- **Desde la ficha de una consulta** (Más → Consultas → consulta): el dictado
  completa **esa** consulta.
- **Desde la ficha de un paciente** (Pacientes → paciente): el dictado crea una
  **nueva** consulta; al terminar usa **Ver consulta**.

Pasos:

1. Toca **🎙️ Grabar nota de voz** (la primera vez la app pide el micrófono).
2. Dicta con naturalidad: motivo, hallazgos, signos vitales, diagnóstico,
   tratamiento, vacunas, próxima cita…
3. Toca **Detener y enviar** (máximo 15 minutos por nota).
4. Verás el avance en vivo: **Recibido → Transcribiendo → Interpretando →
   Aplicado**. La consulta se actualiza sola en pantalla.
5. Revisa las **Acciones del asistente**:
   - *Aplicada*: ya se guardó (los textos de la consulta se agregan, no se
     borran).
   - *Por confirmar*: recetas, vacunas, desparasitaciones, exámenes, perfil
     médico y citas. Toca **Confirmar** o **Rechazar**, o **Confirmar las N
     propuestas**.

Si el envío falla por la red, usa **Reintentar envío**: no hace falta grabar de
nuevo y no se duplica el dictado.

## Chat con el asistente

**Más → Asistente IA**. Crea una conversación y escribe o toca el 🎙️ para
enviar una nota de voz. Ejemplos:

- «¿Qué vacunas le faltan a Max?»
- «Registra desparasitación con Drontal para Luna.»

La respuesta aparece en vivo. Las acciones sensibles llegan como propuesta
dentro del mensaje para que las confirmes. Las conversaciones quedan guardadas
y puedes eliminarlas desde la lista.

## Notificaciones

Al terminar un dictado o una respuesta recibirás una notificación
(«🎙️ Dictado procesado», «🤖 Respuesta del asistente»). Al tocarla se abre la
consulta, el paciente o la conversación. Puedes apagarlas en **Notificaciones →
Asistente IA**.

## Si no ves el asistente

El asistente y el dictado se ocultan cuando:

- el administrador eligió **«Sin inteligencia artificial»** en la web
  (Configuración → Inteligencia Artificial), o
- tu usuario no tiene permiso.

Las notas de voz requieren además que el servidor tenga la transcripción
configurada; sin ella el chat escrito sigue funcionando.

## Solución de problemas

| Síntoma | Qué hacer |
| --- | --- |
| «Código de emparejamiento inválido o vencido» | Genera un QR nuevo en la web. |
| «Demasiados intentos» | Espera un minuto antes de volver a escanear. |
| «Sin permiso de micrófono» | Actívalo en los ajustes del teléfono para PawCare. |
| El dictado termina «Con error» | El servidor no pudo transcribir/interpretar: el motivo aparece en la tarjeta. Avisa al administrador. |
| El progreso tarda en verse | Sin conexión en tiempo real la app consulta cada pocos segundos; espera o revisa tu red. |

## ✅ Checklist

- [ ] El servidor tiene IA activada (Configuración → Inteligencia Artificial).
- [ ] La app está emparejada con el servidor correcto.
- [ ] Permisos de micrófono y cámara concedidos.

---

**Nota**: Nada clínicamente sensible se guarda sin tu confirmación, y el
asistente nunca puede hacer más de lo que tu usuario podría hacer a mano.
