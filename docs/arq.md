# PawCare Mobile — Arquitectura

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React Native (Expo SDK 56) |
| Lenguaje | TypeScript (estricto) |
| Package Manager | Yarn Berry 4.x (node-modules linker) |
| Navegación | React Navigation |
| Base local (local-first F1) | SQLite (expo-sqlite) — 4 migraciones, 7 tablas |
| Notificaciones/alarmas | expo-notifications (programación local, sin conexión) |
| Credenciales | expo-secure-store (tokens Bearer) |
| Backend | Rails API (existente) — sesión móvil por `/auth/mobile/*` |

## Estructura de Directorios

```
open-chepicare-mobile/
├── App.tsx                  # Entry point
├── index.ts                 # Registro del componente raíz
├── app.json                 # Configuración Expo
├── tsconfig.json            # Config TypeScript
├── src/
│   ├── theme/               # Design tokens y theming
│   │   ├── index.ts         # Re-exports
│   │   └── tokens.ts        # Colores, spacing, tipografía, sombras
│   ├── components/          # Componentes reutilizables (UI)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── screens/             # 74 pantallas completas
│   │   ├── public/          # Dominio público (14): tienda, adopción, patrocinios…
│   │   ├── auth/            # Autenticación (6): login, registro, selector de servidor…
│   │   ├── owner/           # Dueño (26): mascotas, citas, historia, tratamientos…
│   │   ├── admin/           # Administrador (26): agenda, consultas, pagos…
│   │   └── common/          # Comunes (2): centro y preferencias de notificaciones
│   ├── navigation/          # Configuración de navegación
│   │   ├── RootNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   ├── PublicStack.tsx
│   │   ├── OwnerTabs.tsx
│   │   └── AdminTabs.tsx
│   ├── db/                  # Base local SQLite (local-first F1)
│   │   ├── database.ts      # Apertura y acceso a la base
│   │   ├── migrations.ts    # 4 migraciones · 7 tablas (sync_outbox, treatments…)
│   │   └── sqlExecutor.ts   # Ejecutor SQL tipado
│   ├── services/            # 10 servicios HTTP + servicios locales
│   │   ├── api.ts           # Cliente HTTP base (Bearer + refresh)
│   │   ├── auth.ts …        # HTTP: auth, profile, pets, appointments, payments,
│   │   │                    #   medical, orders, public, sponsorships, admin
│   │   └── treatments.ts …  # Locales (SQLite): treatments, notificationCenter,
│   │                        #   notificationPrefs, changeAlerts, alarms, reminderAlarms
│   ├── session/             # Estado de sesión y tokens
│   ├── config/              # Selector de servidor (autoalojado)
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useNotifications.ts
│   │   ├── useTreatments.ts
│   │   ├── useChangeAlerts.ts
│   │   ├── useConnectivity.ts
│   │   └── useAsync.ts
│   ├── types/               # Tipos TypeScript compartidos
│   │   ├── api.ts
│   │   ├── models.ts
│   │   └── navigation.ts
│   └── utils/               # Funciones utilitarias
│       ├── storage.ts       # AsyncStorage helpers
│       └── format.ts        # Formateo de fechas, moneda, etc.
├── assets/                  # Imágenes, iconos, fuentes
└── docs/                    # Documentación del proyecto
```

## Capas de Arquitectura

### 1. Navegación (React Navigation)

Maneja todo el flujo entre pantallas:

- **RootNavigator** — decide el árbol según el estado de sesión y el rol (público / dueño / staff).
- **PublicStack** — dominio público sin autenticación (tienda, adopción, patrocinios, contacto).
- **AuthStack** — Login → Registro → Recuperar/Cambiar contraseña → Selector de servidor.
- **OwnerTabs** — bottom tabs del dueño (Home, Mascotas, Citas, Perfil), cada uno con su stack.
- **AdminTabs** — bottom tabs del staff (panel con métricas, gestión clínica y administrativa).

```
RootNavigator
├── PublicStack (sin auth · 14 pantallas)
├── AuthStack (no autenticado · 6 pantallas)
├── OwnerTabs (dueño · 26 pantallas)
│   ├── HomeStack      → Panel · Notificaciones · Pagos · Historia · Patrocinios
│   ├── PetsStack      → Lista · Detalle · Hub médico · Vacunas · Tratamientos…
│   ├── ApptStack      → Lista · Detalle · Asistente de agendamiento
│   └── ProfileStack   → Perfil · Editar · Contraseña · Preferencias
└── AdminTabs (staff · 26 pantallas)
    └── Panel · Mascotas · Citas · Consultas · Vacunas · Pagos · Adopciones…
```

Las 2 pantallas comunes (centro y preferencias de notificaciones) se montan dentro
de los navegadores autenticados.

### 2. Screens (Pantallas)

Cada pantalla es un componente que:
- Recibe parámetros de navegación vía React Navigation.
- Orquesta la lógica de la vista (fetching, estado, interacciones).
- Compone componentes reutilizables del directorio `components/`.

### 3. Components (UI)

Piezas reutilizables que consumen los tokens del theme:
- **Button** — variantes primary, secondary, outline, destructive, ghost. Tamaños sm/md/lg.
- **Card** — contenedor con header, content, footer.
- **Input** — campo de texto con label, placeholder, estados de error.
- **Badge** — etiquetas de estado (primary, success, warning, destructive).
- **Avatar** — imagen circular con fallback a iniciales.

Estos componentes se construyen con `StyleSheet.create()` y los valores de `src/theme/tokens.ts`.

### 4. Theme

Los design tokens en `src/theme/tokens.ts` definen:
- **Paletas de color** — light y dark, con colores semánticos (primary, success, destructive, etc.)
- **Tipografía** — tamaños de fuente, line heights, font weights.
- **Espaciado** — escala de 4px (0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80).
- **Border radius** — sm (4px) hasta full (circular).
- **Sombras** — adaptadas al formato nativo (iOS shadow + Android elevation).
- **Layout** — constantes de header, bottom nav, padding, touch targets.

### 5. Services (API y locales)

Capa de comunicación con el backend Rails (10 servicios de dominio):
- Un **cliente HTTP base** (`api.ts`) configura la URL (con selector de servidor), headers Bearer y refresh automático ante 401 vía `/auth/mobile/refresh`.
- Servicios HTTP: `auth`, `profile`, `pets`, `appointments`, `payments`, `medical`, `orders`, `public`, `sponsorships`, `admin`.
- Las rutas del API están documentadas en `docs/rails-routes.txt` y `docs/mobile-routes.md`.

Servicios **locales** sobre SQLite (operan sin conexión):
- `treatments` — tratamientos de medicación con tomas reajustables.
- `notificationCenter` — centro de notificaciones in-app (tabla `notifications`).
- `notificationPrefs` — preferencias por categoría.
- `changeAlerts` / `changeAlertConfigs` — detección de cambios al sincronizar (`entity_snapshots`).
- `alarms` / `reminderAlarms` — programación de alarmas con expo-notifications.

### 6. Base local (src/db · local-first F1)

- `migrations.ts` define 4 migraciones verificadas por pruebas que crean 7 tablas:
  `sync_outbox`, `weighings`, `treatments`, `treatment_doses`, `notifications`,
  `entity_snapshots`, `notification_prefs` (más `schema_migrations` de control).
- `sync_outbox` queda lista para la cola de escrituras de la fase F2 (ADR 0001).

### 7. Hooks

Custom hooks que encapsulan lógica reutilizable:
- `useAuth` — estado de autenticación, login, logout, token management.
- `useTheme` — acceso a los tokens según el color scheme del dispositivo.
- `useNotifications` / `useTreatments` / `useChangeAlerts` — datos locales de notificaciones y tratamientos.
- `useConnectivity` — estado de red para los indicadores offline.
- `useAsync` — ciclo carga / error / dato para pantallas que piden datos.

### 8. Types

Tipos TypeScript compartidos:
- **Models** — interfaces para entidades (User, Pet, Appointment, etc.)
- **API** — tipos de request/response.
- **Navigation** — tipado de las rutas y parámetros de navegación.

## Flujo de Datos

```
Usuario interactúa
       ↓
Screen (orquesta)
       ↓
Hook (useAsync · useAuth · useNotifications…)
       ↓
Service HTTP (Bearer) ←→ Rails API        Service local ←→ SQLite (sin conexión)
       ↓
Estado local / React State
       ↓
Components (renderizan con tokens del Theme)
```

## Convenciones

- **Archivos**: PascalCase para componentes (`Button.tsx`), camelCase para utilidades (`format.ts`).
- **Exports**: named exports preferidos sobre default exports (excepto screens para lazy loading).
- **Estilos**: `StyleSheet.create()` al final de cada archivo de componente, usando tokens del theme.
- **Tipos**: interfaces para objetos, types para unions y utilidades.
