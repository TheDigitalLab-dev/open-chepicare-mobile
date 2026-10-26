# ChepiCare Mobile — Componentes UI

> Spec para recrear en React Native (Expo). Tokens en [mobile-design-tokens.css](./mobile-design-tokens.css) y `src/theme/tokens.ts`.

Demo de referencia: [mobile-demo.html](./mobile-demo.html) · Inventario de pantallas: [mobile-screens.md](./mobile-screens.md)

---

## 1. Tokens y primitivos (ya existentes)

Estos vienen del design system CSS y deben mapearse 1:1 en RN:

| Token CSS | Uso RN |
|-----------|--------|
| `--color-*` | `tokens.colors.light.*` |
| `--spacing-*` | `tokens.spacing.*` |
| `--radius-*` | `tokens.radius.*` |
| `--font-size-*` | `tokens.fontSize.*` |
| `--shadow-*` | `tokens.shadows.light.*` |
| `--header-height` (56) | `tokens.layout.headerHeight` |
| `--bottom-nav-height` (64) | `tokens.layout.bottomNavHeight` |

Clases base reutilizables: `.btn`, `.input`, `.label`, `.badge`, `.card`, `.avatar`, `.separator`.

---

## 2. Layout — Shell movil

### `MobileShell`

Contenedor raiz de cada pantalla.

| Prop | Tipo | Descripcion |
|------|------|-------------|
| `showStatusBar` | boolean | Barra de estado decorativa (demo) / `StatusBar` en RN |
| `header` | ReactNode | Slot para AppHeader |
| `footer` | ReactNode | BottomTabBar u opcional |
| `fab` | ReactNode | FAB flotante |
| `scroll` | boolean | Scroll en area de contenido |

**Estructura:**

```
MobileShell
├── StatusBar (opcional)
├── AppHeader
├── ScreenBody (flex:1, padding 16)
└── BottomTabBar | safe area bottom
```

**CSS demo:** `.mobile-shell`, `.status-bar`, `.screen-body`

**RN:** `SafeAreaView` + `View` flex column. Usar `react-native-safe-area-context`.

---

### `AppHeader`

Barra superior de navegacion stack.

| Prop | Tipo | Descripcion |
|------|------|-------------|
| `title` | string | Titulo principal |
| `subtitle` | string? | Linea secundaria |
| `onBack` | () => void | Flecha izquierda |
| `rightAction` | ReactNode? | Icono/texto derecha |

**CSS:** `.app-header`, `.app-header-title`, `.app-header-sub`, `.icon-btn`

**RN:** Altura fija 56px, `borderBottomWidth: 1`, color `tokens.colors.border`.

---

### `BottomTabBar`

Navegacion principal owner/admin.

| Prop | Tipo | Descripcion |
|------|------|-------------|
| `items` | `{ id, label, icon, route }[]` | 4 tabs max recomendado |
| `activeId` | string | Tab activo |

**CSS:** `.bottom-nav`, `.bottom-nav-item`, `.bottom-nav-item.active`

**RN:** `@react-navigation/bottom-tabs` con iconos SVG o `@expo/vector-icons`.

---

## 3. Acciones

### `Button`

Extension de `.btn` del design system.

| Variante | CSS | Uso |
|----------|-----|-----|
| primary | `.btn-primary` | CTA principal |
| secondary | `.btn-secondary` | Secundario |
| outline | `.btn-outline` | Cancelar / alternativa |
| destructive | `.btn-destructive` | Eliminar cuenta |
| ghost | `.btn-ghost` | Links en header |

| Tamano | Altura | CSS |
|--------|--------|-----|
| sm | 36px | `.btn-sm` |
| md | 40px | `.btn-md` |
| lg | 44px | `.btn-lg` (min touch) |

**Prop extra:** `fullWidth` → `.btn-block`

**RN:** `Pressable` con `minHeight: 44`, estados `pressed` opacity 0.9.

---

### `IconButton`

Boton cuadrado solo icono.

**CSS:** `.icon-btn` · **RN:** 44×44 touch target.

---

### `Fab`

Boton flotante para crear (mascota, cita, consulta).

**CSS:** `.fab` · Posicion: bottom-right sobre tab bar.

**RN:** `position: 'absolute'`, `bottom: bottomNavHeight + 16`.

---

## 4. Entrada de datos

### `TextField`

Input con label.

| Prop | Tipo |
|------|------|
| `label` | string |
| `placeholder` | string |
| `secureTextEntry` | boolean |
| `error` | string? |

**CSS:** `.form-group` + `.label` + `.input`

**RN:** `TextInput` fontSize 16 (evita zoom iOS).

---

### `SearchBar`

Campo de busqueda con icono lupa.

**CSS:** `.search-bar` · **RN:** `TextInput` en contenedor con icono.

---

### `FilterChips`

Chips horizontales scrollables.

| Prop | Tipo |
|------|------|
| `options` | `{ id, label }[]` |
| `selectedId` | string |

**CSS:** `.chips`, `.chip`, `.chip.active`

**RN:** `ScrollView horizontal` + `Pressable` pills.

---

### `UploadZone`

Area dashed para subir comprobante/foto/lab.

**CSS:** `.upload-zone` · **RN:** `Pressable` + `expo-image-picker` (implementacion futura).

---

## 5. Contenido y listas

### `Card`

Contenedor con borde y sombra.

**CSS:** `.card`, `.card-content` · Ya definido en tokens.

---

### `HeroCard`

Banner destacado con gradiente primary (dashboard, adopcion).

**CSS:** `.hero-card` · Gradiente teal.

**RN:** `LinearGradient` de `expo-linear-gradient`.

---

### `StatCard`

Metrica numerica en dashboard.

| Slot | Descripcion |
|------|-------------|
| `value` | Numero grande |
| `label` | Texto muted |

**CSS:** `.stats-row`, `.stat-card`

---

### `ListRow`

Fila estandar de lista con avatar/thumb + texto + chevron.

| Prop | Tipo |
|------|------|
| `title` | string |
| `subtitle` | string? |
| `leading` | ReactNode? (avatar/thumb) |
| `trailing` | ReactNode? (badge/chevron) |
| `onPress` | () => void |

**CSS:** `.list-row`, `.list-row-body`, `.list-row-title`, `.list-row-sub`

**RN:** `Pressable` con `flexDirection: 'row'`, padding 12, borderRadius 8.

---

### `PetAvatar`

Avatar circular con emoji/inicial o imagen.

| Tamano | CSS |
|--------|-----|
| sm | 2rem — `.avatar-sm` |
| md | 2.75rem — `.pet-avatar` |
| lg | 4.5rem — detalle |

**RN:** `Image` circular o `View` con inicial.

---

### `Badge`

Etiqueta de estado (confirmada, pendiente, admin).

Variantes: `.badge-primary`, `.badge-success`, `.badge-warning`, `.badge-destructive`, `.badge-outline`

Dominios demo: `.domain-badge-public|owner|admin`

---

### `SectionTitle`

Titulo de seccion en mayusculas pequenas.

**CSS:** `.section-title`

---

### `InfoBanner`

Aviso informativo (cita pendiente confirmacion, pago due).

**CSS:** `.info-banner` · Borde/info tint.

---

### `EmptyState`

Lista vacia.

| Slot | Descripcion |
|------|-------------|
| `icon` | Emoji o SVG |
| `title` | Texto principal |
| `action` | Button opcional |

**CSS:** `.empty-state`

---

## 6. Dominio — Componentes compuestos

### `AppointmentCard`

Extiende `ListRow` con badge de estado + fecha/hora + vet.

Usado en: Owner citas, Admin agenda.

---

### `PaymentCard`

Monto + estado + fecha vencimiento. CTA "Registrar pago" inline.

---

### `ProductCard`

Thumb + nombre + `price` + stock badge.

**CSS auxiliar:** `.thumb`, `.price`

---

### `ActionTileGrid`

Grid 2×2 de accesos rapidos (historial medico hub).

**CSS:** `.action-grid`, `.action-tile`

---

### `AdminModuleGrid`

Grid de modulos admin en dashboard.

**CSS:** `.admin-grid`, `.admin-tile`

---

### `StepIndicator`

Progreso en wizard (agendar cita).

| Prop | Tipo |
|------|------|
| `steps` | number |
| `current` | number (0-based) |

**CSS:** `.stepper`, `.step`, `.step.done`, `.step.active`

---

### `TimelineItem`

Item en historial vacunas/consultas.

**CSS:** `.timeline-item`, `.timeline-dot`, `.timeline-content`

---

### `DetailHero`

Cabecera centrada en detalle (mascota, adopcion).

**CSS:** `.detail-hero`

---

## 7. Pantallas demo — Mapa componentes

| Pantalla demo | Componentes principales |
|---------------|-------------------------|
| Login / Registro | MobileShell, TextField, Button, LinkRow |
| Dashboard | HeroCard, StatCard, ListRow, BottomTabBar |
| Mis mascotas | SearchBar, FilterChips, ListRow, Fab |
| Detalle mascota | DetailHero, ActionTileGrid, Badge |
| Agendar cita | StepIndicator, ListRow, Chip, Button |
| Pagos | FilterChips, PaymentCard, UploadZone |
| Historial medico | TimelineItem, SectionTitle, ListRow |
| Admin inicio | AdminModuleGrid, StatCard |
| Consulta admin | ListRow, Badge, Button outline |
| Checkout | ProductCard, TextField, InfoBanner |

---

## 8. Checklist migracion a React Native

1. Copiar tokens de `src/theme/tokens.ts` (ya existe).
2. Crear `components/ui/` con primitivos: `Button`, `TextField`, `Badge`, `Card`.
3. Crear `components/layout/`: `MobileShell`, `AppHeader`, `ScreenBody`.
4. Crear compuestos de dominio en `components/domain/`.
5. Pantallas en `src/screens/{public,owner,admin}/` segun [mobile-screens.md](./mobile-screens.md).
6. Navegacion: `AuthStack`, `OwnerTabs`, `AdminTabs` + stacks anidados.
7. Touch targets minimo **44px** en todos los controles interactivos.
8. `fontSize` inputs **16px** minimo en iOS.

---

## 9. Convenciones de nombres (RN)

| Demo CSS | Componente RN sugerido |
|----------|--------------------------|
| `.mobile-shell` | `MobileShell` |
| `.app-header` | `AppHeader` |
| `.bottom-nav` | `BottomTabBar` |
| `.list-row` | `ListRow` |
| `.hero-card` | `HeroCard` |
| `.stat-card` | `StatCard` |
| `.action-tile` | `ActionTile` |
| `.upload-zone` | `UploadZone` |
| `.stepper` | `StepIndicator` |

Exportar desde `src/components/ui/index.ts` cuando se implementen.
