# Conectar la app a tu clínica con un código QR

La app PawCare puede conectarse al servidor de tu clínica (por ejemplo, una
instalación propia de la versión open source) escaneando un código QR. Sirve
tanto para el **personal de la clínica** (veterinarios y administradores) como
para los **propietarios de mascotas**: la app guarda la dirección del servidor,
abre la sesión de quien generó el código y entra en su modo.

No necesitas escribir la dirección del servidor ni tu contraseña en el teléfono.

## 📋 Tabla de Contenidos

- [Propietarios de mascotas](#propietarios-de-mascotas)
- [Personal de la clínica](#personal-de-la-clínica)
- [Dónde está el escáner en la app](#dónde-está-el-escáner-en-la-app)
- [Dispositivos conectados y revocación](#dispositivos-conectados-y-revocación)
- [Seguridad](#seguridad)
- [Solución de problemas](#solución-de-problemas)

## Propietarios de mascotas

1. En la **web** de tu clínica entra con tu usuario de propietario.
2. Abre **Mi Perfil** y, en **Conectar la app móvil**, pulsa **Generar código
   QR**.
3. En la app toca **Emparejar con código QR** y apunta la cámara al código antes
   de 10 minutos.
4. La app muestra «Conectando como propietario…» y entra en tu cuenta: tus
   mascotas, tus citas, pagos e historial médico. El teléfono queda registrado
   para recibir los recordatorios.

El emparejamiento funciona aunque el servidor tenga la opción **Sin
inteligencia artificial**. El asistente IA (chat y dictado) es solo para el
personal de la clínica y no aparece en el modo propietario.

> 💡 El código siempre abre la cuenta de quien lo generó. Si alguien de la
> clínica te muestra **su** QR, la app abriría **su** cuenta: genera siempre el
> tuyo desde tu perfil.

## Personal de la clínica

1. En la **web** entra a **Perfil → Conectar la app móvil** y genera el código.
2. En la app toca **Emparejar con código QR** y apunta la cámara al código.
3. La app muestra «Conectando como personal de la clínica…» y abre el modo de
   la clínica (agenda, pacientes y, si el servidor tiene IA, el asistente).

## Dónde está el escáner en la app

- En la pantalla de **inicio de sesión**: **Emparejar con código QR**.
- Al **primer arranque** sin servidor configurado: **Configurar servidor →
  Emparejar con código QR**.
- Con la sesión abierta: **Perfil → Servidor** (propietarios) o **Más → Cuenta
  y servidor** (personal).

Si ya tenías una sesión abierta con otra cuenta, al emparejar la app la cierra
en su servidor y borra del teléfono los datos guardados de esa cuenta (incluidos
los cambios sin sincronizar y las alarmas) antes de abrir la nueva.

También puedes abrir el enlace `pawcare://pair?...` del código desde el teléfono
(sin sesión abierta): la app lo canjea igual que si lo escanearas.

## Dispositivos conectados y revocación

En la misma tarjeta **Conectar la app móvil** de tu perfil web verás los
teléfonos conectados con QR (nombre, sistema y fecha). Pulsa **Revocar** para
desconectar uno: deja de recibir notificaciones y su sesión ya no puede
renovarse. Como mucho 30 minutos después, la app vuelve sola a la pantalla de
inicio de sesión.

Los teléfonos también se desconectan cuando cambias o restableces tu contraseña,
o cuando la cuenta se desactiva o se elimina.

## Seguridad

- El código sirve **una sola vez** y vence a los **10 minutos**.
- Generar un código nuevo invalida los anteriores que no se usaron.
- El código no contiene tu contraseña ni ninguna credencial permanente.
- Cada canje queda registrado (fecha, dispositivo y dirección IP).

## Solución de problemas

| Mensaje en la app | Qué hacer |
| --- | --- |
| «El código venció o ya se usó…» | Genera uno nuevo en tu perfil de la web y escanéalo antes de 10 minutos. |
| «No se pudo contactar al servidor del código…» | El teléfono debe poder llegar a la dirección del QR (la misma red o una dirección pública). La app sigue conectada al servidor anterior. |
| «La cuenta está inactiva» | Pide a la clínica que reactive tu cuenta. |
| «Demasiados intentos» | Espera un minuto antes de volver a escanear. |
| «Este QR no es un código de PawCare» | Escanea el código de la tarjeta **Conectar la app móvil**, no otro. |
| «Versión de código no compatible» | Actualiza la app. |

## ✅ Checklist

- [ ] Generaste el código desde **tu** perfil (Perfil o Mi Perfil).
- [ ] Lo escaneaste antes de 10 minutos.
- [ ] El teléfono llega a la dirección del servidor.
- [ ] Permiso de cámara concedido.

---

**Nota**: El asistente IA y el dictado de consultas siguen disponibles solo para
el personal. Ver [Asistente IA](asistente-ia.md).
