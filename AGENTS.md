# Pawcare Mobile — Reglas de ingeniería (OBLIGATORIAS)

## Expo HAS CHANGED

Lee la doc versionada exacta en https://docs.expo.dev/versions/v56.0.0/ antes de
escribir cualquier código.

## Regla de oro: TODO real, NADA mockeado

- **Prohibido** mock data, fake data, pantallas falsas o placeholders en código de
  producción. Nada de `src/data/mock.ts` ni equivalentes.
- Toda pantalla visible consume **datos reales** del backend (`../pawcare`, que
  está corriendo) a través de su servicio de dominio.
- Todo lo visible (botones, listas, formularios) debe **funcionar de verdad**.
- Un servicio por dominio en `src/services/<dominio>.ts` contra las rutas reales.
  Los tipos viven en `src/types`. Las pantallas NO se importan desde servicios.

## TDD obligatorio para hooks y lógica de negocio

- Escribe el **test antes** de la implementación (red → green → refactor).
- Aplica a: hooks (`src/hooks`), servicios (`src/services`), repositorios y
  utilidades de negocio.
- Los tests son de **integración REAL** contra el backend en ejecución. `yarn test`
  apunta a `http://localhost:3000`. **Cero respuestas de API mockeadas.**
- Lo único que se permite sustituir son los **shims de plataforma nativa** que no
  existen en el entorno Node de Jest (`expo-secure-store`, `AsyncStorage`) — nunca
  lógica de negocio ni respuestas del servidor. Ver `jest.setup.ts`.
- Credenciales sembradas (de `../pawcare/db/seeds`): `owner1@example.com`,
  `admin@pawcare.com` (password `admin12345`), `vet@pawcare.com` — el resto con
  `password123`.

## Compuertas de calidad — antes de CADA commit

1. `yarn test` en verde (incluye el/los test nuevos del archivo terminado).
2. `yarn typecheck` en verde.
3. `yarn lint` sin errores.
4. `npx react-doctor@latest --no-score` sin hallazgos en los archivos tocados.
5. `yarn format`.

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
