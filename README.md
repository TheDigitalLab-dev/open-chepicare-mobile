# ChepiCare Mobile

App móvil **Android** (Expo / React Native) para una clínica veterinaria a
domicilio. Una sola app sirve a tres audiencias — **público** (sin sesión),
**dueño** de mascotas y **staff** clínico — y **todas** las pantallas consumen
datos reales del backend Rails [`open-chepicare-web`](https://github.com/TheDigitalLab-dev/open-chepicare-web) (clon hermano en `../open-chepicare-web`) a través de su servicio de
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
- El backend [`open-chepicare-web`](https://github.com/TheDigitalLab-dev/open-chepicare-web) (clon hermano en `../open-chepicare-web`) corriendo (por defecto en
  `http://localhost:3000`).

## 🚀 Instalación y arranque

Los repos se renombraron (antes `pawcare-mobile` y `pawcare-web`) y la marca pasó
de PawCare a **ChepiCare** (ver [Cambio de nombre](#-cambio-de-nombre-pawcare--chepicare)).
El clon hermano del backend se llama `open-chepicare-web`, en la misma carpeta que este:

```bash
git clone https://github.com/TheDigitalLab-dev/open-chepicare-web.git ../open-chepicare-web
```

```bash
corepack enable
yarn install

# 1) Levanta el backend (repo ../open-chepicare-web) en el puerto 3000.
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
| Staff  | `admin@chepicare.com`  | `password123` |
| Vet    | `vet@chepicare.com`    | `password123` |

Las crea `bin/rails db:seed` en open-chepicare-web. Si tu BD es anterior (cuentas
`@pawcare.com` o el admin con la contraseña vieja del seed), vuelve a correr
`db:seed`: renombra las cuentas del seed a `@chepicare.com` y, fuera de
producción, deja la contraseña en `password123`.

## 🕒 Zona horaria y formatos de la clínica

Las horas de las citas, el mes inicial y el "hoy" de los asistentes, las fechas
por defecto de los formularios y los recordatorios usan la **zona y los formatos
de la clínica** (`time_zone`, `date_format`, `time_format`), no los del teléfono.
El backend los envía en `clinic` con `/auth/mobile/me`, login, registro y refresh
(cualquier rol). La app los guarda en AsyncStorage (`services/clinicConfig.ts`)
para arrancar sin red. Cerrar sesión no los borra, porque no son datos del usuario;
cambiar de servidor, sí.

Única excepción: en el **primer arranque sin red y sin ninguna sesión previa**
todavía no hay configuración. En ese caso se usa la zona del dispositivo con los
formatos por defecto del backend (DD/MM/YYYY, 24 h) hasta el primer inicio de
sesión.

## 🤖 Asistente IA, emparejamiento QR y push

Requiere el backend con el asistente IA (open-chepicare-web, PR #59). Guía de uso:
[docs/user-manual/asistente-ia.md](docs/user-manual/asistente-ia.md).

| Pieza | Dónde |
| --- | --- |
| Capacidades del servidor (`GET /auth/mobile/capabilities`) | `services/server.ts`, `session/AssistantProvider.tsx` |
| Dictado de consulta (expo-audio → `POST /admin/voice_dictations` + audio) | `services/assistant.ts`, `hooks/useVoiceDictation.ts`, `hooks/useVoiceRecorder.ts` |
| Chat texto/voz | `hooks/useAiChat.ts`, `screens/admin/AssistantChatScreen.tsx` |
| Tiempo real (ActionCable `/cable`, `Authorization: Bearer`) + polling de respaldo | `services/aiUpdates.ts`, `hooks/useAiUpdates.ts` |
| QR `chepicare://pair?v=1&server=…&code=…` (también `pawcare://`; expo-camera) | `services/pairing.ts`, `hooks/usePairing.ts`, `screens/auth/PairingScanScreen.tsx` |
| Push Expo (`/auth/mobile/devices`, categoría `asistente`) | `services/pushNotifications.ts`, `hooks/usePushNotifications.ts` |

- La URL del servidor se guarda en **almacenamiento seguro** (SecureStore) y se
  puede cambiar en runtime (QR o Configurar servidor); `EXPO_PUBLIC_API_BASE_URL`
  es el valor por defecto del build.
- Push remoto necesita un build de desarrollo/producción con `projectId` de EAS
  (`extra.eas.projectId` en app.json o `EXPO_PUBLIC_EAS_PROJECT_ID`). Sin él la
  app no registra token y sigue funcionando con tiempo real + polling.

## 🔁 Cambio de nombre: PawCare → ChepiCare

La app se llama **ChepiCare** (nombre mostrado `expo.name`, textos, permisos,
APK `chepicare.apk`). Actualizar desde una versión PawCare no pierde nada:

| Qué | Cambio | Compatibilidad |
| --- | --- | --- |
| Claves de SecureStore/AsyncStorage | `pawcare.*` → `chepicare.*` (`src/config/storageKeys.ts`) | Al arrancar (y en cada lectura) se lee la nueva; si falta, la vieja se copia a la nueva y se borra (`src/utils/legacyStorage.ts`). Cerrar sesión borra ambas. Nadie pierde sesión, servidor emparejado, tema ni configuración de la clínica. |
| Deep link | Esquema principal `chepicare://` | `pawcare://` sigue registrado y aceptado (`src/config/deepLinks.ts`): QR ya impresos, enlaces de recuperación y servidores que aún emiten `pawcare://pair`. |
| APK publicado | `chepicare.apk` | Cada release adjunta también una copia idéntica (misma firma) `open-chepicare-mobile.apk` para los enlaces ya compartidos. |
| Cuentas demo | `admin@chepicare.com`, `vet@chepicare.com` | El seed del backend renombra las `@pawcare.com`. |

**Identificadores técnicos heredados (NO cambiar):** son la identidad de la app
instalada o contienen datos; cambiarlos crea otra app (sin actualizaciones ni
datos) o abre una base vacía.

| Identificador | Valor | Por qué se conserva |
| --- | --- | --- |
| `expo.slug` | `pawcare-mobile` | Proyecto Expo/EAS y builds existentes |
| `android.package` | `com.pawcare.mobile` | Identidad en Android: otro package es otra app y no actualiza la instalada |
| Keystore de firma (alias, p. ej. `pawcare`) | — | Otra firma impide actualizar la app instalada |
| Archivo SQLite | `pawcare.db` | Datos locales y cambios sin sincronizar (WAL: no se renombra de forma atómica) |
| Esquema `pawcare://` | — | QR y enlaces ya emitidos |

No hay `ios.bundleIdentifier` ni `owner`/`projectId` de EAS en `app.json`; si se
añaden, deben mantenerse estables desde la primera publicación.

## 🧪 Scripts

| Comando           | Qué hace                                                         |
| ----------------- | --------------------------------------------------------------- |
| `yarn start`      | Inicia Metro / Expo.                                            |
| `yarn test`       | Tests de **integración reales** contra `http://localhost:3000`. |
| `yarn typecheck`  | TypeScript 7 (compilador nativo) estricto (`tsc --noEmit`).     |
| `yarn lint`       | ESLint.                                                          |
| `yarn format`     | Prettier (escritura).                                           |

> TypeScript 7 no expone el API JS que usa typescript-eslint: `.yarnrc.yml`
> (`packageExtensions`) le da a ESLint una copia anidada de TypeScript 6; `tsc`
> usa el 7 de la raíz. Retirarlo cuando typescript-eslint soporte TS ≥ 7.

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
