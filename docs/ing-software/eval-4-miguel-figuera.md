# Resumen Ejecutivo

Este informe técnico documenta y analiza los procedimientos de verificación del producto aplicados durante el desarrollo de **Chepicare**, aplicación móvil para la atención veterinaria a domicilio del consultorio Chepicare (La Victoria, estado Aragua), construida con Expo SDK 56, React Native y TypeScript sobre un backend API REST de 157 rutas. El problema abordado es asegurar, con evidencia objetiva, que cada incremento del producto cumple sus requisitos antes de integrarse a la rama principal del repositorio. La metodología combina verificación estática (compilación estricta de TypeScript, análisis con ESLint y react-doctor, formato con Prettier), verificación dinámica mediante desarrollo guiado por pruebas (TDD) con pruebas de integración ejecutadas contra el backend real — sin respuestas simuladas —, verificación funcional en emulador Android y revisión por pares mediante pull requests; todo ello encadenado en compuertas de calidad previas a cada commit y en un hook pre-push que bloquea la publicación de código defectuoso. Los resultados principales son: 15 suites con 49 casos de prueba de integración real en verde, cero errores de tipos y de análisis estático, cero hallazgos de react-doctor en los archivos tocados y una trazabilidad requisito–ruta–pantalla que cubre 156 de 157 endpoints. Se concluye que el proceso detecta defectos de forma temprana y sistemática, y se recomienda incorporar integración continua remota, pruebas E2E automatizadas y medición de cobertura de código.

[[INDICE]]

# Introducción

El presente informe técnico corresponde a la actividad evaluativa de la sección didáctica N.° 4 — procedimientos de verificación del producto en ingeniería de software — y toma como objeto de estudio el mismo producto documentado en el plan de la calidad del proyecto: **Chepicare**, aplicación móvil Android (Expo SDK 56 / React Native 0.85 / TypeScript estricto) que digitaliza la gestión de citas, historias clínicas, control de vacunación, pagos y adopciones del consultorio veterinario Chepicare, consumiendo un backend API REST (Ruby on Rails) con 157 rutas documentadas para el cliente móvil.

La verificación responde a la pregunta de si el producto se está construyendo correctamente, es decir, si cada artefacto es consistente con los requisitos y las especificaciones que lo originan; se distingue de la validación, que evalúa si el producto correcto responde a las necesidades del usuario (Institute of Electrical and Electronics Engineers [IEEE], 2017). En un proyecto donde la calidad del producto está determinada en buena medida por la calidad del proceso que lo produce (Álvarez y López, 2005), los procedimientos de verificación son el mecanismo concreto que convierte esa premisa en práctica diaria.

**Objetivo del informe**: documentar, describir y analizar los procedimientos de verificación del producto aplicados en el desarrollo del cliente móvil Chepicare, presentando la evidencia objetiva que generan y evaluando sus fortalezas y limitaciones.

**Alcance**: el informe cubre la verificación del cliente móvil (código de la aplicación, sus servicios de dominio, hooks, utilidades, base de datos local y pantallas) y de su integración con el backend; no cubre la verificación interna del backend, que posee su propio proceso.

**Justificación**: el dominio del producto — datos de salud animal, historial clínico y registro de pagos — exige integridad y trazabilidad. Detectar defectos en el momento en que se introducen cuesta órdenes de magnitud menos que corregirlos en producción, y solo un proceso de verificación sistemático, automatizado y no discrecional garantiza esa detección temprana en un equipo pequeño.

# Metodología

La elaboración de este informe siguió un enfoque documental y de observación directa sobre el repositorio del proyecto: se examinaron la configuración de las herramientas de verificación, los guiones (scripts) de calidad, el hook de control previo al push, el historial de commits y pull requests, y se ejecutaron las compuertas de calidad para registrar sus resultados. Como marco normativo de referencia se emplearon la norma ISO/IEC/IEEE 29119-1 para los conceptos de proceso de pruebas (International Organization for Standardization [ISO], 2022), el estándar IEEE 1012-2016 para la distinción y organización de las actividades de verificación y validación (IEEE, 2017) y el modelo de calidad ISO/IEC 25010 como referente de los atributos de calidad perseguidos (ISO, 2011).

Los procedimientos de verificación del producto que se documentan combinan técnicas estáticas y dinámicas:

- **Verificación estática** (sin ejecutar el producto): compilación con TypeScript en modo estricto (tsc --noEmit), análisis de código con ESLint 9 (configuración eslint-config-expo), diagnóstico especializado de React con react-doctor y verificación de formato con Prettier.
- **Verificación dinámica** (ejecutando el producto): desarrollo guiado por pruebas — TDD, ciclo rojo → verde → refactorización (Beck, 2003) — para hooks, servicios, repositorios y utilidades de negocio, con pruebas de integración ejecutadas contra el backend real en ejecución, sin respuestas de API simuladas; el propósito es ejecutar el software con la intención de encontrar errores (Myers et al., 2011), no de confirmar que funciona.
- **Verificación funcional interactiva**: ejecución de la aplicación en un emulador Android (Pixel) para verificar los flujos completos, la apertura del teclado correcto en cada campo y los estados de carga, error y vacío de cada pantalla.
- **Verificación del flujo de integración**: compuertas de calidad obligatorias antes de cada commit, hook pre-push automatizado que re-ejecuta las verificaciones y bloquea el push si algo falla, y revisión por pares mediante pull requests sobre la rama principal.

La evidencia presentada en el desarrollo del informe proviene de la ejecución real de estos procedimientos y del estado del repositorio a la fecha de elaboración.

# Desarrollo y Análisis Técnico

## El producto verificado

Chepicare es una aplicación móvil organizada en tres dominios funcionales — público, dueño y administrador — más el módulo de autenticación. La interfaz comprende 70 pantallas que consumen datos reales del backend a través de 10 servicios de dominio (un servicio por dominio en src/services, con los tipos centralizados en src/types y un cliente HTTP común). La arquitectura de datos es offline-first híbrida, registrada en el documento de decisión arquitectónica ADR 0001: caché local en SQLite, cola de escrituras y sincronización con el backend.

| Dominio | Pantallas | Ejemplos representativos |
|---|---|---|
| Público | 14 | Catálogo de productos, servicios, adopciones, apadrinamientos, checkout, contacto. |
| Autenticación | 6 | Inicio de sesión, registro, recuperación y cambio de contraseña, selector de servidor. |
| Dueño | 24 | Mascotas, citas (asistente de agendamiento), historia clínica, vacunas, pagos, perfil. |
| Administrador | 26 | Panel de control, gestión de citas, consultas, vacunación, pagos, adopciones, reportes médicos. |

El principio rector del proyecto — nada simulado — implica que toda pantalla visible consume datos reales del backend y que todo elemento visible (botones, listas, formularios) funciona de verdad. Este principio condiciona directamente los procedimientos de verificación: no existe una capa de datos ficticios que pudiera enmascarar defectos de integración.

## Procedimientos de verificación estática

La verificación estática se ejecuta sobre el código fuente sin ejecutar la aplicación y ataca clases de defectos complementarias:

| Procedimiento | Herramienta y comando | Defectos que detecta |
|---|---|---|
| Verificación de tipos | TypeScript estricto — yarn typecheck (tsc --noEmit) | Incompatibilidades de tipos, valores posiblemente nulos, contratos incumplidos entre servicios, pantallas y tipos del API. |
| Análisis de código | ESLint 9 — yarn lint / yarn lint:fix | Errores de programación comunes, importaciones inválidas, violaciones de las reglas de hooks de React, código inalcanzable. |
| Diagnóstico de React | react-doctor — npx react-doctor@latest --no-score | Antipatrones de rendimiento y corrección específicos de React/React Native (por ejemplo, listas sin virtualizar, dependencias de efectos incorrectas). |
| Formato del código | Prettier — yarn format / yarn format:check | Inconsistencias de estilo que dificultan la revisión por pares y ensucian los diffs. |

El diagnóstico de react-doctor ha demostrado valor real: sus hallazgos motivaron la refactorización que sustituyó los listados basados en ScrollView por listas virtualizadas con FlatList en todas las pantallas de listado (pull request #2), mejorando el uso de memoria y el desempeño de desplazamiento con conjuntos de datos reales. La política del proyecto exige cero hallazgos de react-doctor en los archivos tocados antes de cada commit.

## Procedimientos de verificación dinámica

El desarrollo de hooks, servicios, repositorios y utilidades de negocio sigue TDD de forma obligatoria: la prueba se escribe antes que la implementación y el ciclo rojo → verde → refactorización garantiza que toda pieza de lógica nace con su verificación asociada (Beck, 2003). La característica distintiva del proyecto es que las pruebas son de **integración real**: yarn test apunta al backend Rails en ejecución (variable EXPO_PUBLIC_API_BASE_URL, por defecto http://localhost:3000) y ninguna respuesta del API se simula. Lo único que se sustituye son los shims de plataforma nativa que no existen en el entorno Node de Jest (expo-secure-store, AsyncStorage), nunca lógica de negocio ni respuestas del servidor. Las pruebas emplean las credenciales sembradas del backend (dueño, administrador y veterinario) para ejercitar los tres dominios con sus permisos reales.

La batería actual comprende 15 suites con 49 casos de prueba distribuidos por capa:

| Capa verificada | Suites | Qué se verifica |
|---|---|---|
| Servicios de dominio (src/services) | 10 | Autenticación por Bearer, mascotas, citas, historia médica, pagos, pedidos, perfil, apadrinamientos, rutas públicas y administración, contra las rutas reales del backend. |
| Hooks (src/hooks) | 1 | Ciclo de vida de useAsync: estados de carga, éxito y error. |
| Utilidades de negocio (src/utils) | 1 | Lógica de horarios y agendamiento (schedule). |
| Configuración (src/config) | 1 | Selector de servidor y resolución de la URL base del API. |
| Base de datos local (src/db) | 1 | Migraciones del esquema SQLite local (offline-first). |
| Componentes de dominio (src/components) | 1 | Alternancia de tema claro/oscuro. |

Este diseño de pruebas asume el propósito clásico de la prueba de software — encontrar errores, no demostrar su ausencia (Myers et al., 2011) — y lo potencia al eliminar la falsa confianza que producen los dobles de prueba del API: si el contrato del backend cambia, las pruebas fallan de inmediato.

A la verificación automatizada se suma la verificación funcional interactiva en emulador Android (dispositivo virtual Pixel), donde se comprueban los flujos completos de cada incremento, la apertura del teclado correcto en cada campo de texto (email-address, numeric, phone-pad, decimal-pad según corresponda) y la presencia de los estados de carga, error y vacío exigidos a toda pantalla que solicite datos.

## Verificación en el flujo de integración

Los procedimientos anteriores se encadenan en dos puntos de control obligatorios. Antes de **cada commit** deben pasar, en orden: (1) yarn test en verde, incluidas las pruebas nuevas del archivo terminado; (2) yarn typecheck en verde; (3) yarn lint sin errores; (4) react-doctor sin hallazgos en los archivos tocados; y (5) yarn format. Antes de **cada push**, el hook pre-push de Husky re-ejecuta lint:fix, format, lint y typecheck, y bloquea el push en dos supuestos: si las herramientas de autocorrección modificaron archivos (el desarrollador debe revisarlos y crear un nuevo commit) o si el análisis estático o la verificación de tipos fallan. El detalle del hook se reproduce en el Anexo A.

Finalmente, la integración a la rama principal se realiza mediante ramas cortas y pull requests con revisión, y el historial usa commits convencionales, lo que preserva la trazabilidad entre cada cambio, su motivación y su verificación. La matriz de trazabilidad requisito → ruta → pantalla → componente, heredada de la fase de diseño, permite auditar que cada requisito está cubierto por un elemento implementado y verificado.

## Resultados de la verificación

La ejecución de los procedimientos descritos arroja, a la fecha de este informe, los siguientes resultados:

| Indicador | Meta | Resultado |
|---|---|---|
| Suites de pruebas de integración en verde | 100 % | 15 de 15. |
| Casos de prueba de integración real | Crecer con cada módulo | 49 casos, cero respuestas de API simuladas. |
| Errores de verificación de tipos (typecheck) | 0 | 0. |
| Errores de análisis estático (lint) | 0 | 0. |
| Hallazgos de react-doctor en archivos tocados | 0 | 0 (hallazgos previos corregidos en el pull request #2). |
| Trazabilidad endpoint → requisito → pantalla | ≥ 99 % | 156 de 157 endpoints (99,4 %). |
| Pantallas con estados de carga, error y vacío | 100 % | 100 % de las pantallas que solicitan datos. |
| Pushes bloqueados con defectos conocidos | 100 % | El hook pre-push impide publicar código que falle las compuertas. |

## Análisis

Los resultados permiten un análisis en dos direcciones. Entre las **fortalezas** del proceso destacan: primero, el realismo — al probar contra el backend real con datos sembrados, la verificación cubre el contrato completo cliente-servidor y elimina la clase de defectos que los dobles de API ocultan (rutas renombradas, cambios de esquema, permisos por rol); segundo, la automatización no discrecional — las compuertas y el hook pre-push no dependen de la disciplina individual: el propio repositorio rechaza el código defectuoso; tercero, la detección temprana — TDD y la verificación de tipos estricta sitúan la detección del defecto en el momento de su introducción, donde la corrección es más barata; y cuarto, la complementariedad de técnicas — la verificación estática ataca defectos estructurales y la dinámica defectos de comportamiento, cubriendo entre ambas un espectro que ninguna alcanzaría sola.

Entre las **limitaciones** se identifican: la dependencia de un backend local en ejecución para correr las pruebas, lo que acopla la verificación al entorno del desarrollador; la ausencia de integración continua remota que re-ejecute las compuertas en un entorno neutral para cada pull request; la concentración de los casos de prueba en la capa de servicios (10 de 15 suites), con cobertura automatizada aún incipiente de pantallas y componentes, cuya verificación descansa en el emulador; la falta de una métrica de cobertura de código con umbral definido; y la ausencia de pruebas E2E automatizadas que ejerciten los flujos completos del usuario sin intervención manual.

# Conclusiones

Respecto al objetivo planteado, el informe documenta un sistema de verificación del producto completo y operativo, articulado en cuatro procedimientos — verificación estática, verificación dinámica con TDD e integración real, verificación funcional en emulador y verificación del flujo de integración — cuya evidencia es objetiva y auditable en el propio repositorio. La conclusión central es que la verificación en Chepicare no es una fase posterior al desarrollo sino una propiedad del proceso: cada pieza de lógica nace con su prueba, cada commit atraviesa cinco compuertas y cada push es interceptado por un control automatizado que no admite excepciones.

La decisión de prohibir los datos simulados, costosa en infraestructura (exige un backend en ejecución para desarrollar y probar), se revela como la de mayor impacto en la eficacia de la verificación: las 49 pruebas verifican exactamente lo que el usuario final va a ejecutar, con el contrato real del API y los permisos reales de cada rol. Asimismo, la combinación de técnicas estáticas y dinámicas confirma en la práctica lo que la literatura establece: los defectos que detecta la compilación estricta de tipos no son los que detecta react-doctor, ni estos los que detectan las pruebas de integración; la calidad resulta de la superposición deliberada de filtros distintos, integrada al proceso conforme al plan de la calidad del proyecto (Álvarez y López, 2005) y con registros controlados en el repositorio según el enfoque documental ya adoptado (Romero Mosquera, 2006).

# Recomendaciones

Del análisis anterior se derivan las siguientes acciones de mejora, ordenadas por prioridad:

1. **Incorporar integración continua remota** (por ejemplo, GitHub Actions) que levante el backend contenerizado con sus datos sembrados y re-ejecute las compuertas completas — pruebas, typecheck, lint, react-doctor — en cada pull request, eliminando la dependencia del entorno local del desarrollador.
2. **Añadir pruebas E2E automatizadas** sobre los flujos críticos del negocio — inicio de sesión, agendamiento de cita, registro de pago, consulta de historia clínica — con una herramienta de automatización móvil (por ejemplo, Maestro), reduciendo la carga de verificación manual en emulador.
3. **Medir la cobertura de código** (jest --coverage) y fijar un umbral inicial realista con incremento progresivo por sprint, priorizando la capa de pantallas y componentes, hoy la menos cubierta por pruebas automatizadas.
4. **Ampliar las pruebas de componentes y pantallas** con Testing Library para verificar de forma automatizada los estados de carga, error y vacío que hoy se comprueban manualmente.
5. **Formalizar los registros de verificación** como actas versionadas en el repositorio (resultado de cada corrida de compuertas por entrega), consolidando la evidencia para auditorías académicas y para el consultorio.
6. **Extender la verificación a atributos no funcionales** — rendimiento de listas con volúmenes reales de datos y accesibilidad (etiquetas y roles en los componentes interactivos) — incorporándolos como criterios de las compuertas.

# Referencias

Álvarez, A. I., y López, M. (2005). Elaboración de planes de la calidad en proyectos de software. Universidad ORT Uruguay, Laboratorio de Ingeniería de Software. SEDICI, Repositorio Institucional de la UNLP. http://sedici.unlp.edu.ar/bitstream/handle/10915/23062/Documento_completo.pdf?sequence=1

Beck, K. (2003). Test-driven development: By example. Addison-Wesley.

Institute of Electrical and Electronics Engineers. (2017). IEEE standard for system, software, and hardware verification and validation (IEEE Std 1012-2016). IEEE.

International Organization for Standardization. (2011). ISO/IEC 25010: Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models. ISO.

International Organization for Standardization. (2022). ISO/IEC/IEEE 29119-1: Software and systems engineering — Software testing — Part 1: General concepts. ISO.

Myers, G. J., Sandler, C., y Badgett, T. (2011). The art of software testing (3.ª ed.). John Wiley & Sons.

Romero Mosquera, K. L. (2006). Documentación del proceso de desarrollo de software para la certificación ISO 9000:2000 [Pasantía de grado, Universidad Autónoma de Occidente]. Repositorio Educativo Digital UAO. https://red.uao.edu.co/handle/10614/7057

# Anexos

## Anexo A. Compuertas de calidad y hook pre-push

Compuertas obligatorias antes de cada commit:

```
yarn test        # 1. Pruebas de integración reales contra el backend en ejecución
yarn typecheck   # 2. Verificación de tipos: tsc --noEmit (TypeScript estricto)
yarn lint        # 3. Análisis estático: ESLint 9 sin errores
npx react-doctor@latest --no-score   # 4. Cero hallazgos en los archivos tocados
yarn format      # 5. Formato con Prettier
```

Lógica del hook pre-push (Husky), que bloquea la publicación de código defectuoso:

```
yarn lint:fix || true       # autocorrige lo corregible
yarn format
# Si la autocorrección modificó archivos rastreados → BLOQUEA el push:
# el desarrollador debe revisar y commitear esos cambios.
git diff --quiet || exit 1
yarn lint                   # compuertas duras: lint estricto...
yarn typecheck              # ...y tipos correctos (si fallan, aborta el push)
```

## Anexo B. Inventario de suites de pruebas de integración

| Suite | Capa | Objeto verificado |
|---|---|---|
| auth.test.ts | Servicios | Autenticación móvil por Bearer (inicio de sesión, registro, sesión). |
| pets.test.ts | Servicios | Gestión de mascotas del dueño. |
| appointments.test.ts | Servicios | Citas y agendamiento. |
| medical.test.ts | Servicios | Historia clínica, consultas, vacunas y desparasitaciones. |
| payments.test.ts | Servicios | Registro y consulta de pagos. |
| orders.test.ts | Servicios | Pedidos y checkout de la tienda. |
| profile.test.ts | Servicios | Perfil del usuario y cambio de contraseña. |
| sponsorships.test.ts | Servicios | Apadrinamientos. |
| public.test.ts | Servicios | Rutas públicas (productos, servicios, adopciones). |
| admin.test.ts | Servicios | Operaciones del dominio administrador. |
| useAsync.test.tsx | Hooks | Estados de carga, éxito y error del hook useAsync. |
| schedule.test.ts | Utilidades | Lógica de horarios y agendamiento. |
| serverConfig.test.ts | Configuración | Selector de servidor y URL base del API. |
| migrations.test.ts | Base de datos local | Migraciones del esquema SQLite (offline-first). |
| themeToggle.test.ts | Componentes | Alternancia de tema claro/oscuro. |

## Anexo C. Entorno de verificación

- **Backend de pruebas**: aplicación Rails del proyecto en ejecución local con RAILS_ENV=test (sin limitación de intentos de inicio de sesión), datos sembrados desde db/seeds.
- **URL del API**: variable EXPO_PUBLIC_API_BASE_URL (por defecto http://localhost:3000), inyectada por el script yarn test.
- **Credenciales sembradas**: cuentas de dueño, administrador y veterinario provistas por las semillas del backend, usadas para ejercitar los permisos reales de cada rol.
- **Sustituciones permitidas**: únicamente los shims de plataforma nativa inexistentes en el entorno Node de Jest (expo-secure-store, AsyncStorage), documentados en jest.setup.ts; ninguna lógica de negocio ni respuesta del servidor se simula.
- **Verificación interactiva**: emulador Android (dispositivo virtual Pixel) para flujos completos, teclados y estados de pantalla.

## Anexo D. Glosario

- **Verificación**: conjunto de actividades que evalúan si el producto se construye conforme a sus requisitos y especificaciones (IEEE, 2017).
- **TDD (Test-Driven Development)**: técnica en la que la prueba se escribe antes que la implementación, siguiendo el ciclo rojo → verde → refactorización (Beck, 2003).
- **Compuerta de calidad**: verificación obligatoria que debe pasar en verde antes de permitir el avance del código al siguiente estadio (commit, push, integración).
- **Hook pre-push**: script que el sistema de control de versiones ejecuta automáticamente antes de publicar cambios, capaz de abortar la operación si una verificación falla.
- **Prueba de integración real**: prueba automatizada que ejercita el código contra el backend en ejecución, sin sustituir sus respuestas por datos simulados.
- **Virtualización de listas**: técnica de renderizado (FlatList) que solo materializa los elementos visibles de una lista, esencial para el desempeño con datos reales.
