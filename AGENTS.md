# ChepiCare Mobile — Reglas de ingeniería (OBLIGATORIAS)

## Expo HAS CHANGED

Lee la doc versionada exacta en https://docs.expo.dev/versions/v56.0.0/ antes de
escribir cualquier código.

## Regla de oro: TODO real, NADA mockeado

- **Prohibido** mock data, fake data, pantallas falsas o placeholders en código de
  producción. Nada de `src/data/mock.ts` ni equivalentes.
- Toda pantalla visible consume **datos reales** del backend Rails **open-chepicare-web**
  (repo `TheDigitalLab-dev/open-chepicare-web`, clonado al lado de este en
  `../open-chepicare-web`, que está corriendo) a través de su servicio de dominio.
- Todo lo visible (botones, listas, formularios) debe **funcionar de verdad**.
- Un servicio por dominio en `src/services/<dominio>.ts` contra las rutas reales.
  Los tipos viven en `src/types`. Las pantallas NO se importan desde servicios.

## TDD obligatorio para hooks y lógica de negocio

- Escribe el **test antes** de la implementación (red → green → refactor).
- Aplica a: hooks (`src/hooks`), servicios (`src/services`), repositorios y
  utilidades de negocio.
- Los tests son de **integración REAL** contra el backend en ejecución. `pnpm test`
  apunta a `http://localhost:3000` (otro backend: `EXPO_PUBLIC_API_BASE_URL=http://localhost:3001 pnpm test`).
  **Cero respuestas de API mockeadas.**
- Lo único que se permite sustituir son los **shims de plataforma nativa** que no
  existen en el entorno Node de Jest (`expo-secure-store`, `AsyncStorage`, el
  `WebSocket` de React Native sobre el WebSocket real de undici, los selectores
  de documentos/fotos que entregan archivos reales, `expo-file-system` sobre el
  disco real de Node y el menú de compartir) — nunca lógica
  de negocio ni respuestas del servidor. Ver `jest.setup.ts`. Para el asistente
  IA, el único doble es el del **CLI de terceros** `claude`
  (`src/testing/agent-bin/claude`), que llama de verdad al MCP del backend.
- Credenciales sembradas (de `../open-chepicare-web/db/seeds`): `owner1@example.com`,
  `admin@chepicare.com`, `vet@chepicare.com` — todas con `password123`. Con una BD
  anterior (cuentas `@pawcare.com` o el admin con la contraseña vieja del seed),
  basta con volver a correr `bin/rails db:seed` en open-chepicare-web (renombra las
  cuentas del seed y, fuera de producción, actualiza la contraseña); no hace falta
  tocar la BD a mano.

## Nombre: ChepiCare (antes PawCare)

- Marca visible: **ChepiCare**. Claves locales nuevas: `chepicare.*`, siempre vía
  `src/config/storageKeys.ts` y los helpers de `src/utils/legacyStorage.ts` (migran
  las `pawcare.*` de versiones anteriores).
- **No cambiar** `expo.slug` (`pawcare-mobile`), `android.package`
  (`com.pawcare.mobile`), la firma, el archivo SQLite `pawcare.db` ni el esquema
  `pawcare://` (sigue aceptado junto a `chepicare://`). Ver README.

## Compuertas de calidad — antes de CADA commit

1. `pnpm test` en verde (incluye el/los test nuevos del archivo terminado).
2. `pnpm typecheck` en verde.
3. `pnpm lint` sin errores.
4. `pnpm dlx react-doctor@latest --no-score` sin hallazgos en los archivos tocados.
5. `pnpm format`.

El hook **pre-push** (Husky) re-ejecuta `lint:fix` + `format` + `lint` + `typecheck`
y **bloquea el push** si algo cambió o falla: en ese caso, corrige y haz un nuevo
commit antes de volver a empujar.

## Inputs / teclado

- Todo `TextField`/`TextInput` declara el `keyboardType` correcto
  (`email-address`, `numeric`, `phone-pad`, `decimal-pad`, etc.) y debe **abrir el
  teclado** al enfocarse. Verificar en emulador/dispositivo real.

## Calidad de código

- TypeScript estricto. Sin `any` salvo justificación. Estados de carga, error y
  vacío en toda pantalla que pida datos. Sin caminos fáciles ni atajos.
