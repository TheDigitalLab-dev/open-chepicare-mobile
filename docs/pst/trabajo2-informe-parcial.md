# Informe Parcial de Ejecución por Sprints

El presente documento constituye el **informe parcial de ejecución** del Proyecto Sociotecnológico **Chepicare: App móvil para atención veterinaria a domicilio**, y reúne los soportes de la gestión ágil del equipo: los entregables de cada sprint, el reporte de velocity, las retrospectivas, el calendario de reuniones de planificación y seguimiento, las acciones de mejora continua y las demostraciones realizadas. Cubre el período comprendido entre el **25 de mayo y el 14 de julio de 2026** (corte parcial durante el sprint 4). Toda la información aquí presentada es **verificable en el repositorio Git del proyecto**: cada entregable se referencia con el identificador del commit o pull request que lo evidencia.

# Parte I. Marco de Trabajo del Equipo

## 1.1 Metodología y cadencia

El equipo trabaja con el marco ágil **Scrum**, adaptado al contexto académico del PST y a los lineamientos de la docente guía, con la siguiente cadencia:

| Elemento | Definición adoptada |
|---|---|
| Duración del sprint | 2 semanas (lunes a domingo de la semana siguiente). |
| Reunión de planificación | Primer lunes del sprint: se compromete el alcance y se estiman las historias en puntos (escala Fibonacci). |
| Reuniones de seguimiento | Cada 3 días durante el sprint: avance, impedimentos y ajustes. |
| Revisión / demostración | Viernes de cierre: demostración del incremento funcionando con datos reales, con participación de los informantes clave cuando aplica. |
| Retrospectiva | Al cierre de la revisión: qué funcionó, qué mejorar y acuerdos accionables. |
| Definición de terminado | Pruebas de integración reales en verde, verificación de tipos, análisis estático sin errores, cero hallazgos de react-doctor y formato aplicado, antes de cada commit. |

## 1.2 Equipo y roles

El equipo investigador está integrado por **Miguel Figuera, Iromy León y Alejandra Herde**, bajo la guía de la **tutora Yuly Delgado** y con la Dra. Génesis Conesa (consultorio Chepicare) como informante clave. Los roles Scrum se distribuyeron así durante todo el período reportado:

| Integrante | Rol | Responsabilidades |
|---|---|---|
| Iromy León | **Scrum Master** (en todo momento); gestión del proyecto (PM) por períodos, compartida con Miguel Figuera | Facilita las reuniones de planificación, seguimiento, revisión y retrospectiva; remueve impedimentos; vela por el cumplimiento de los acuerdos de mejora continua. |
| Alejandra Herde | **QA principal** | Aseguramiento de la calidad: verificación de los incrementos contra la definición de terminado, ejecución de las compuertas de calidad y validación funcional en emulador. |
| Miguel Figuera | **Desarrollador (DEV)**; gestión del proyecto (PM) por períodos, compartida con Iromy León | Implementación de los dominios con TDD, integración con el backend y mantenimiento del repositorio (ramas, pull requests, hooks). |

## 1.3 Fuentes de evidencia

Los soportes de este informe provienen del historial del repositorio: los commits de la rama principal (main), las ramas de trabajo remotas (feat/real-backend-integration y refactor/flatlist-react-doctor) y los pull requests de integración (#1 y #2). Los identificadores abreviados de commit (por ejemplo, 416eb50) permiten a la docente guía auditar cada entregable.

# Parte II. Ejecución por Sprints

## 2.1 Sprint 1 (25 de mayo – 7 de junio): concepción y diseño

**Objetivo comprometido**: constituir el proyecto y producir el paquete de diseño completo del producto.

| Entregable | Evidencia (commit) | Puntos |
|---|---|---|
| Inicialización del proyecto móvil (Expo SDK 56, React Native, TypeScript estricto, tokens de diseño) | 9245aba | 3 |
| Documento de diseño Chepicare (APA, con script generador) | 65499d1 | 5 |
| ADR 0001 — Arquitectura de datos móvil (offline-first híbrido) | 706a7f9 | 3 |
| Especificación de requisitos (26 RF, 17 RNF) en Markdown y HTML | a0b833f, b1e73d1 | 5 |
| Diagramas de arquitectura imprimibles (tres capas, cliente-servidor) | b1e73d1 | 3 |
| Demo navegable de la interfaz (maquetas, tema claro/oscuro, PDF) | 0040dc6, cc1cf81 | 2 |
| **Total del sprint** | | **21** |

**Demostración**: demo navegable de la interfaz (maquetas HTML/PDF con dos maquetas por página) presentada para validación del concepto visual y del inventario de pantallas.

**Retrospectiva del sprint 1**:

- **Qué funcionó**: el paquete de diseño quedó completo y versionado (requisitos, ADR, diagramas, demo), dando base verificable a la construcción.
- **Qué mejorar**: los mensajes de commit fueron poco descriptivos y heterogéneos ("docs", "other docs", mezcla de idiomas), y se trabajó directamente sobre la rama principal.
- **Acuerdos**: adoptar **commits convencionales** (feat/fix/docs/refactor) y trabajar en **ramas por funcionalidad** integradas mediante pull request. *Cumplimiento verificable: desde el sprint 2 todos los commits siguen la convención y el desarrollo ocurre en la rama feat/real-backend-integration.*

## 2.2 Sprint 2 (8 – 21 de junio): dominios sobre el backend real con TDD

**Objetivo comprometido**: dejar de lado toda simulación y conectar los dominios funcionales de la aplicación al backend real (API REST de 157 rutas), con desarrollo guiado por pruebas.

| Entregable | Evidencia (commit) | Puntos |
|---|---|---|
| Base de ingeniería: compuertas de calidad, Jest contra backend real, Husky | ec911f6 | 3 |
| Dominio mascotas del dueño (TDD) | c30f285 | 3 |
| Dominio citas y agendamiento (TDD) | e824267 | 3 |
| Dominio pagos (TDD) | 35f2588 | 3 |
| Historia médica: consultas, vacunas, desparasitaciones (TDD) | 8172ca9 | 3 |
| Panel del dueño e historial médico con servicios reales | d5ef472 | 2 |
| Dominio público: productos, servicios y adopciones | 7fc11a8 | 3 |
| Perfil real: edición y cambio de contraseña (TDD) | 96c26b1 | 2 |
| Apadrinamientos (dueño y público) | a72ee3e | 2 |
| Administración: pantallas de listado de toda la clínica | 8bb51de | 3 |
| Administración: métricas del panel y pantallas de detalle | 78b0226, c19578f, 699b2cb, cbd120a | 3 |
| Administración: formularios de creación/edición y registros médicos (TDD) | 1c9cbd1, abdf247 | 2 |
| Checkout de la tienda y asistente de citas del administrador | 8f87416 | 2 |
| **Total del sprint** | | **34** |

**Demostración**: aplicación funcionando en emulador Android contra el backend en ejecución, con las credenciales sembradas de dueño, administrador y veterinario: flujos completos de mascotas, citas, pagos e historia clínica.

**Retrospectiva del sprint 2**:

- **Qué funcionó**: 13 entregables de dominio cerrados con TDD y datos reales; se eliminó el último resto simulado del producto (commit f93dc31: la pantalla de perfil pasó a usar la sesión real, "no mock fallback").
- **Qué mejorar**: la integración se concentró en pocas jornadas con lotes de trabajo muy grandes, lo que dificulta la revisión commit a commit y eleva el riesgo de defectos ocultos.
- **Acuerdos**: formalizar por escrito la regla **"nada simulado en producción"** y ejecutar las **compuertas de calidad antes de cada commit** (pruebas, tipos, lint, react-doctor, formato). *Cumplimiento verificable: reglas incorporadas a la guía de ingeniería del repositorio (AGENTS.md) y aplicadas en los sprints siguientes.*

## 2.3 Sprint 3 (22 de junio – 5 de julio): local-first, selector de servidor y calidad

**Objetivo comprometido**: iniciar la arquitectura offline-first (fase F1 del ADR 0001), habilitar el despliegue autoalojado y saldar los hallazgos de calidad detectados.

| Entregable | Evidencia (commit) | Puntos |
|---|---|---|
| Corrección: la agenda del administrador muestra todas las citas (scope=all) | 2e6d8a8 | 2 |
| Selector de servidor autoalojado con verificación de salud (health check) | d61b2a4 | 5 |
| Plan de arquitectura local-first y sincronización diferida | e417bb0 | 3 |
| Componente ThemeToggle reutilizable; cierre de sesión y servidor en admin | 1ce7018 | 3 |
| F1 local-first: base de datos SQLite local con migraciones (TDD) | 416eb50 | 8 |
| Refactorizaciones guiadas por react-doctor (estado perezoso, funciones puras) | 1718d67, d0c7cd2, c61f280 | 3 |
| Integración a main mediante pull request revisado (PR #1) | 16eca4b | 2 |
| **Total del sprint** | | **26** |

**Demostración**: selector de servidor con verificación de salud en vivo y arranque de la aplicación con la base local SQLite (fase F1) inicializada por migraciones.

**Retrospectiva del sprint 3**:

- **Qué funcionó**: la fase F1 de la arquitectura offline-first se entregó con TDD (suite de migraciones), y el primer pull request formal (#1) integró todo el trabajo a main con revisión.
- **Qué mejorar**: los hallazgos de react-doctor se detectaron tarde y de forma reactiva; una parte del alcance comprometido (fase F2 de sincronización) se pospuso al backlog.
- **Acuerdos**: incorporar **react-doctor como compuerta previa a cada commit** y añadir un **hook pre-push** que re-ejecute lint, formato y tipos bloqueando el push defectuoso. *Cumplimiento verificable: hook pre-push activo en el repositorio y sprint 4 dedicado a cerrar los hallazgos restantes (PR #2).*

## 2.4 Sprint 4 (6 – 19 de julio, en curso): rendimiento y documentación académica

**Objetivo comprometido**: virtualizar todas las listas de la aplicación, dejar el diagnóstico de react-doctor en cero y producir los entregables académicos del corte.

| Entregable (al corte del 14 de julio) | Evidencia | Puntos |
|---|---|---|
| Virtualización de listas con FlatList en todas las pantallas de listado y limpieza total de hallazgos de react-doctor (PR #2) | eacd4dd, 2179ce2 | 8 |
| Arquitectura navegable en HTML y README del proyecto | e6396e6 | 2 |
| Entregables académicos: fase de diseño (eval 3), informe técnico de verificación (eval 4), infografía de implementación y mantenimiento (eval 5) e informe parcial del PST | docs/ing-software, docs/pst | 3 |
| **Total parcial del sprint (en curso)** | | **13** |

**Demostración (prevista para el 17 de julio)**: listas de mascotas, citas y pagos con volúmenes reales de datos, mostrando el desplazamiento fluido tras la virtualización.

**Retrospectiva parcial del sprint 4**:

- **Qué funcionó**: la deuda de rendimiento se saldó de una vez (todas las listas virtualizadas) y el diagnóstico de react-doctor quedó en cero hallazgos.
- **Qué mejorar**: las compuertas de calidad aún dependen del entorno local del desarrollador; no existe integración continua remota que las re-ejecute por cada pull request.
- **Acuerdo propuesto**: evaluar la incorporación de integración continua (GitHub Actions) con el backend contenerizado, como recomienda el informe técnico de verificación (eval 4).

# Parte III. Reporte de Velocity del Equipo

## 3.1 Método de medición

Las historias se estiman en **puntos de historia** (escala Fibonacci) durante la reunión de planificación; la velocity de cada sprint es la suma de los puntos de las historias que cumplieron la definición de terminado dentro del sprint. Las cifras se reconstruyen y auditan contra el historial del repositorio.

## 3.2 Resultados

| Sprint | Período | Puntos comprometidos | Puntos completados | Cumplimiento |
|---|---|---|---|---|
| Sprint 1 | 25 may – 7 jun | 21 | 21 | 100 % |
| Sprint 2 | 8 jun – 21 jun | 31 | 34 | 110 % (se incorporó alcance adicional de administración) |
| Sprint 3 | 22 jun – 5 jul | 29 | 26 | 90 % (la fase F2 de sincronización se pospuso al backlog) |
| Sprint 4 | 6 jul – 19 jul | 27 | 13 (parcial al 14 jul) | En curso |

```
Velocity por sprint (puntos completados)

Sprint 1  █████████████████████            21
Sprint 2  ██████████████████████████████████  34
Sprint 3  ██████████████████████████        26
Sprint 4  █████████████                     13 (en curso)
          ── Promedio de sprints cerrados: 27 ──
```

## 3.3 Análisis

La **velocity promedio de los sprints cerrados es de 27 puntos**, con una tendencia estable (21 → 34 → 26). El pico del sprint 2 corresponde a la integración masiva de dominios y no es sostenible como referencia de planificación; el equipo planifica los sprints siguientes sobre el promedio (≈ 27 puntos). La posposición de la fase F2 en el sprint 3 se registró como decisión explícita de alcance — priorizar la calidad (react-doctor, hook pre-push) sobre la funcionalidad nueva — y no como desviación no controlada.

# Parte IV. Reuniones de Planificación y Seguimiento

Calendario ejecutado conforme a la cadencia acordada (planificación el lunes de apertura, seguimientos cada 3 días, revisión y retrospectiva el viernes de cierre):

| Sprint | Planificación | Seguimientos (cada 3 días) | Revisión + retrospectiva |
|---|---|---|---|
| Sprint 1 | lun 25 may | 28 may · 31 may · 3 jun | vie 5 jun |
| Sprint 2 | lun 8 jun | 11 jun · 14 jun · 17 jun | vie 19 jun |
| Sprint 3 | lun 22 jun | 25 jun · 28 jun · 1 jul | vie 3 jul |
| Sprint 4 | lun 6 jul | 9 jul · 12 jul · (15 jul y 18 jul previstos) | vie 17 jul (prevista) |

En las reuniones de planificación se comprometen las historias y sus puntos; en los seguimientos se revisa el avance contra el tablero y se levantan impedimentos (por ejemplo, la disponibilidad del backend de pruebas, resuelta ejecutándolo en modo de prueba local); la revisión incluye la demostración del incremento y la retrospectiva cierra con acuerdos accionables que se auditan en el sprint siguiente.

# Parte V. Mejora Continua

Cada acuerdo de retrospectiva se trata como un compromiso auditable. Estado de los acuerdos al corte:

| Acuerdo | Origen | Evidencia de implementación | Estado |
|---|---|---|---|
| Commits convencionales | Retro sprint 1 | Todos los commits desde el 16 jun siguen la convención (feat/fix/docs/refactor). | Implementado |
| Ramas por funcionalidad + pull requests | Retro sprint 1 | Ramas feat/real-backend-integration y refactor/flatlist-react-doctor; PR #1 (2 jul) y PR #2 (6 jul). | Implementado |
| Regla "nada simulado en producción" | Retro sprint 2 | Guía de ingeniería del repositorio; eliminación del último fallback simulado (f93dc31). | Implementado |
| Compuertas de calidad antes de cada commit | Retro sprint 2 | Scripts yarn test / typecheck / lint / doctor / format; definición de terminado del equipo. | Implementado |
| react-doctor como compuerta + hook pre-push | Retro sprint 3 | Hook pre-push de Husky activo; PR #2 dejó el diagnóstico en cero hallazgos. | Implementado |
| Integración continua remota (GitHub Actions) | Retro parcial sprint 4 | Recomendación registrada en el informe técnico de verificación (eval 4). | Propuesto |

# Parte VI. Demostraciones Realizadas

| Fecha | Sprint | Demostración | Audiencia |
|---|---|---|---|
| 5 jun | 1 | Demo navegable de la interfaz (maquetas, tema claro/oscuro). | Equipo y validación del concepto con la informante clave. |
| 19 jun | 2 | Aplicación en emulador Android contra el backend real: flujos de mascotas, citas, pagos e historia clínica con credenciales de dueño y administrador. | Equipo y docente guía. |
| 3 jul | 3 | Selector de servidor autoalojado con verificación de salud y arranque con base local SQLite (F1 offline-first). | Equipo. |
| 17 jul (prevista) | 4 | Listas virtualizadas con volúmenes reales de datos; desplazamiento fluido. | Equipo y docente guía. |

# Parte VII. Estado Parcial y Próximos Pasos

Al corte del 14 de julio de 2026 el producto cuenta con **70 pantallas** en cuatro dominios (público, autenticación, dueño y administrador) consumiendo datos reales del backend, **15 suites con 49 pruebas de integración real**, base local SQLite (fase F1 de la arquitectura offline-first) y cero hallazgos de análisis estático y de react-doctor. Los próximos pasos priorizados en el backlog son: (1) cerrar el sprint 4 con su demostración y retrospectiva; (2) fase F2 del ADR 0001 — cola de escrituras y sincronización diferida; (3) integración continua remota; y (4) pruebas E2E automatizadas de los flujos críticos, conforme a las recomendaciones del informe técnico de verificación.
