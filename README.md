# Pawcare Mobile

App móvil **Android** (Expo / React Native) para una clínica veterinaria a
domicilio. Una sola app sirve a tres audiencias — **público** (sin sesión),
**dueño** de mascotas y **staff** clínico — y **todas** las pantallas consumen
datos reales del backend Rails [`pawcare`](../pawcare) a través de su servicio de
dominio (sin datos mockeados).

> **Open source y self-hosted:** la URL del backend se elige en tiempo de
> ejecución desde la app (pantalla _Configurar servidor_), sin recompilar.

## 📐 Documentación de arquitectura

La arquitectura está documentada módulo por módulo, con **diagramas Mermaid que se
amplían al hacer click**, en [`docs/arquitectura/`](docs/arquitectura/).

```bash
# Servir la documentación localmente (los diagramas necesitan un servidor HTTP)
python3 -m http.server 8099 --directory docs/arquitectura
# luego abre http://127.0.0.1:8099/index.html
```

Los HTML son **autocontenidos** (un archivo por módulo). Si cambias el código y
quieres regenerarlos:

```bash
python3 docs/arquitectura/build.py
```

Índice de módulos: visión general · navegación y roles · sesión y autenticación ·
capa HTTP · configuración de servidor · servicios de dominio · áreas
(público/dueño/staff) · componentes y tema · estado y hooks · local-first ·
testing.

## 🧰 Requisitos

- **Node ≥ 20** y **Yarn 4** (vía Corepack).
- **Android**: un emulador (AVD) o un dispositivo con **Expo Go**.
- El backend [`pawcare`](../pawcare) corriendo (por defecto en
  `http://localhost:3000`).

## 🚀 Instalación y arranque

```bash
corepack enable
yarn install

# 1) Levanta el backend (repo ../pawcare) en el puerto 3000.
#    El emulador Android alcanza el localhost del host en 10.0.2.2,
#    por eso el valor de desarrollo por defecto es http://10.0.2.2:3000.

# 2) Arranca Metro / Expo
yarn start        # abre el proyecto en Expo Go o en el dev client
```

Para cambiar de servidor sin recompilar: en la app, pantalla de bienvenida →
**Configurar servidor** (escribe la URL, _Probar conexión_ y _Guardar_).

## 🔑 Credenciales sembradas (desarrollo)

| Rol    | Login                  | Contraseña    |
| ------ | ---------------------- | ------------- |
| Dueño  | `owner1@example.com`   | `password123` |
| Staff  | `admin@pawcare.com`    | `admin12345` (o `password123` en backends con el asistente IA) |
| Vet    | `vet@pawcare.com`      | `password123` |

## 🤖 Asistente IA, emparejamiento QR y push

Requiere el backend con el asistente IA (pawcare-web, PR #59). Guía de uso:
[docs/user-manual/asistente-ia.md](docs/user-manual/asistente-ia.md).

| Pieza | Dónde |
| --- | --- |
| Capacidades del servidor (`GET /auth/mobile/capabilities`) | `services/server.ts`, `session/AssistantProvider.tsx` |
| Dictado de consulta (expo-audio → `POST /admin/voice_dictations` + audio) | `services/assistant.ts`, `hooks/useVoiceDictation.ts`, `hooks/useVoiceRecorder.ts` |
| Chat texto/voz | `hooks/useAiChat.ts`, `screens/admin/AssistantChatScreen.tsx` |
| Tiempo real (ActionCable `/cable`, `Authorization: Bearer`) + polling de respaldo | `services/aiUpdates.ts`, `hooks/useAiUpdates.ts` |
| QR `pawcare://pair?v=1&server=…&code=…` (expo-camera) | `services/pairing.ts`, `hooks/usePairing.ts`, `screens/auth/PairingScanScreen.tsx` |
| Push Expo (`/auth/mobile/devices`, categoría `asistente`) | `services/pushNotifications.ts`, `hooks/usePushNotifications.ts` |

- La URL del servidor se guarda en **almacenamiento seguro** (SecureStore) y se
  puede cambiar en runtime (QR o Configurar servidor); `EXPO_PUBLIC_API_BASE_URL`
  es el valor por defecto del build.
- Push remoto necesita un build de desarrollo/producción con `projectId` de EAS
  (`extra.eas.projectId` en app.json o `EXPO_PUBLIC_EAS_PROJECT_ID`). Sin él la
  app no registra token y sigue funcionando con tiempo real + polling.

## 🧪 Scripts

| Comando           | Qué hace                                                         |
| ----------------- | --------------------------------------------------------------- |
| `yarn start`      | Inicia Metro / Expo.                                            |
| `yarn test`       | Tests de **integración reales** contra `http://localhost:3000`. |
| `yarn typecheck`  | TypeScript en modo estricto (`tsc --noEmit`).                   |
| `yarn lint`       | ESLint.                                                          |
| `yarn format`     | Prettier (escritura).                                           |

> Correr **toda** la suite de golpe puede disparar el _rate-limit_ del backend en
> `/auth` por exceso de logins; conviene correr por dominios.

## 🗂️ Estructura

```
src/
  components/   ui · domain · layout       (presentación reutilizable)
  config/       env · serverConfig          (entorno y servidor runtime)
  db/           SQLite local + migraciones  (local-first)
  hooks/        useAsync · useAuth · useTheme
  navigation/   RootNavigator + stacks por rol
  screens/      public · owner · admin · auth
  services/     un archivo por dominio + api.ts (cliente HTTP)
  session/      SessionProvider
  theme/        ThemeProvider + tokens + ciclo de tema
  types/        models.ts · api.ts
  utils/        format · schedule · secureStore
```

## 📴 Local-first (en progreso)

El registro clínico offline (consultas, historias, **pesaje**, vacunas) con
sincronización diferida está descrito en
[`LOCAL_FIRST_PLAN.md`](LOCAL_FIRST_PLAN.md). La **Fase 1** (base de datos local
con `expo-sqlite` + migraciones) ya está implementada; la sincronización está en
el roadmap.

## 📏 Reglas de ingeniería

Las reglas obligatorias del proyecto (todo real / nada mockeado, TDD, compuertas
de calidad por commit, `keyboardType` en inputs, etc.) viven en
[`AGENTS.md`](AGENTS.md).
