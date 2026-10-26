# Informe Parcial de Ejecución N.° 2

El presente documento constituye el **segundo informe parcial de ejecución** del Proyecto Sociotecnológico **Chepicare: App móvil para atención veterinaria a domicilio**, y actualiza los soportes de la gestión ágil del equipo presentados en el primer informe parcial: entregables por sprint, reporte de velocity, retrospectivas, reuniones de planificación y seguimiento, mejora continua y demostraciones. El foco de esta segunda entrega es **mostrar el avance**: el grado de finalización alcanzado por el producto, la publicación de los repositorios de código y una exploración técnica realizada fuera del alcance del proyecto que el equipo registra como posible siguiente paso. El corte del informe es el **14 de julio de 2026**, durante la ejecución del sprint 4. Toda la información es verificable en los repositorios públicos del proyecto.

# Parte I. Marco de Trabajo y Repositorios

## 1.1 Marco de trabajo

Se mantiene sin cambios el marco descrito en el primer informe parcial: **Scrum** con sprints de 2 semanas (lunes a domingo de la semana siguiente), planificación el lunes de apertura, reuniones de seguimiento cada 3 días, y revisión con demostración y retrospectiva el viernes de cierre. Los roles se conservan: **Iromy León** como Scrum Master durante todo el período (y gestión del proyecto por períodos, compartida con Miguel Figuera), **Alejandra Herde** como QA principal y **Miguel Figuera** como desarrollador. La definición de terminado sigue exigiendo, antes de cada commit: pruebas de integración reales en verde, verificación de tipos, análisis estático sin errores, cero hallazgos de react-doctor y formato aplicado.

## 1.2 Repositorios públicos del proyecto

El código del proyecto está publicado en GitHub, bajo la organización TheDigitalLab-dev:

| Repositorio | Contenido | URL |
|---|---|---|
| chepicare-mobile | Aplicación móvil del proyecto (Expo SDK 56 / React Native / TypeScript): código fuente, pruebas de integración, documentación de diseño y entregables académicos. **Este es el producto del PST.** | https://github.com/TheDigitalLab-dev/chepicare-mobile |
| chepicare-harness | Exploración técnica **fuera del alcance del PST** (ver Parte VII): agente de inteligencia artificial que opera la API del consultorio. | https://github.com/TheDigitalLab-dev/chepicare-harness |

La docente guía puede auditar en el primer repositorio cada entregable citado en este informe y en el anterior: historial de commits, ramas de trabajo, pull requests (#1 y #2) y el hook de calidad pre-push.

# Parte II. Avance por Sprints

## 2.1 Resumen acumulado

| Sprint | Período | Objetivo | Puntos | Estado |
|---|---|---|---|---|
| Sprint 1 | 25 may – 7 jun | Concepción y paquete de diseño (requisitos, ADR, diagramas, demo UI). | 21 | Cerrado |
| Sprint 2 | 8 – 21 jun | Todos los dominios sobre el backend real con TDD; regla "nada simulado". | 34 | Cerrado |
| Sprint 3 | 22 jun – 5 jul | Local-first F1 (SQLite), selector de servidor, calidad react-doctor; PR #1. | 26 | Cerrado |
| Sprint 4 | 6 – 19 jul | Virtualización de listas, cero hallazgos, entregables académicos; PR #2. | 15 (al corte) | En curso |

## 2.2 Sprint 4: avance desde el primer corte

El primer informe parcial reportó 13 puntos completados en el sprint 4. Al presente corte el avance es el siguiente:

| Entregable | Evidencia | Puntos | Situación |
|---|---|---|---|
| Virtualización de listas con FlatList y limpieza total de react-doctor (PR #2) | eacd4dd, 2179ce2 | 8 | Completado (reportado en el informe N.° 1) |
| Arquitectura navegable en HTML y README | e6396e6 | 2 | Completado (reportado en el informe N.° 1) |
| Entregables académicos de Ingeniería de Software: fase de diseño (eval 3), informe técnico de verificación (eval 4) e infografía de implementación y mantenimiento (eval 5), con portada institucional | docs/ing-software | 3 | Completado |
| Informes parciales del PST N.° 1 y N.° 2, con soportes de la gestión Scrum | docs/pst | 2 | Completado |
| **Total del sprint al corte** | | **15** | |

Adicionalmente, durante este sprint el equipo realizó una **exploración técnica fuera del alcance** (el agente chepicare-harness, Parte VII), que por disciplina de gestión **no computa puntos** en la velocity del producto.

# Parte III. Reporte de Velocity del Equipo

## 3.1 Resultados actualizados

| Sprint | Puntos comprometidos | Puntos completados | Cumplimiento |
|---|---|---|---|
| Sprint 1 | 21 | 21 | 100 % |
| Sprint 2 | 31 | 34 | 110 % |
| Sprint 3 | 29 | 26 | 90 % |
| Sprint 4 | 27 | 15 (al corte, en curso) | 56 % del compromiso, con 5 días restantes |
| **Acumulado del proyecto** | **108** | **96** | |

```
Velocity por sprint (puntos completados)

Sprint 1  █████████████████████             21
Sprint 2  ██████████████████████████████████  34
Sprint 3  ██████████████████████████        26
Sprint 4  ███████████████                   15 (en curso)
          ── Promedio de sprints cerrados: 27 ──
```

## 3.2 Análisis del avance

La velocity de los sprints cerrados se mantiene estable en torno al **promedio de 27 puntos**. El sprint 4 acumula 15 de 27 puntos comprometidos con 5 días de ejecución restantes; el equipo estima cerrar entre 24 y 27 puntos, dentro del rango del promedio. El acumulado del proyecto asciende a **96 puntos completados** en menos de cuatro sprints, con una desviación total comprometido/completado inferior al 12 %, lo que valida la calidad de las estimaciones de planificación.

# Parte IV. Retrospectivas: Estado Consolidado

Las retrospectivas de los sprints 1 a 3 y sus acuerdos fueron detalladas en el primer informe parcial. Estado consolidado de los acuerdos al presente corte:

| Acuerdo | Origen | Estado al 14 jul |
|---|---|---|
| Commits convencionales | Retro sprint 1 | Vigente y cumplido en todos los commits desde el 16 jun. |
| Ramas por funcionalidad + pull requests | Retro sprint 1 | Vigente: PR #1 y PR #2 integrados con revisión. |
| Regla "nada simulado en producción" | Retro sprint 2 | Vigente: escrita en la guía de ingeniería del repositorio. |
| Compuertas de calidad antes de cada commit | Retro sprint 2 | Vigente: definición de terminado del equipo. |
| react-doctor como compuerta + hook pre-push | Retro sprint 3 | Vigente: diagnóstico en cero hallazgos desde el PR #2. |
| Integración continua remota (GitHub Actions) | Retro parcial sprint 4 | Propuesto: pendiente de priorización en el próximo sprint. |

**Retrospectiva parcial del sprint 4 (actualizada)**:

- **Qué funcionó**: la deuda de rendimiento se saldó por completo (todas las listas virtualizadas, cero hallazgos); los entregables académicos del corte se cerraron con portada y formato institucional unificados; la publicación de los repositorios en GitHub da transparencia total al avance.
- **Qué mejorar**: la exploración del agente de IA (harness), aunque valiosa, consumió atención del equipo dentro del sprint sin estar en el compromiso; conviene encapsular ese tipo de trabajo como spikes con caja de tiempo (time-box) acordada en la planificación.
- **Acuerdos**: (1) registrar las exploraciones técnicas como **spikes con caja de tiempo** y resultado documentado, fuera de la velocity del producto; (2) mantener la propuesta de integración continua remota para el próximo sprint.

# Parte V. Reuniones de Planificación y Seguimiento

Calendario actualizado al corte (planificación los lunes de apertura, seguimientos cada 3 días, revisión y retrospectiva los viernes de cierre):

| Sprint | Planificación | Seguimientos (cada 3 días) | Revisión + retrospectiva |
|---|---|---|---|
| Sprint 1 | lun 25 may | 28 may · 31 may · 3 jun | vie 5 jun (realizada) |
| Sprint 2 | lun 8 jun | 11 jun · 14 jun · 17 jun | vie 19 jun (realizada) |
| Sprint 3 | lun 22 jun | 25 jun · 28 jun · 1 jul | vie 3 jul (realizada) |
| Sprint 4 | lun 6 jul | 9 jul · 12 jul (realizados) · 15 jul · 18 jul (previstos) | vie 17 jul (prevista) |

En el seguimiento del 9 de julio se presentó al equipo el resultado del spike del agente de IA y se acordó registrarlo como exploración fuera de alcance; en el del 12 de julio se revisó el cierre de los entregables académicos y la preparación de este informe.

# Parte VI. Demostraciones

| Fecha | Sprint | Demostración | Estado |
|---|---|---|---|
| 5 jun | 1 | Demo navegable de la interfaz (maquetas, tema claro/oscuro). | Realizada |
| 19 jun | 2 | Aplicación en emulador Android contra el backend real: flujos de mascotas, citas, pagos e historia clínica. | Realizada |
| 3 jul | 3 | Selector de servidor autoalojado con verificación de salud y arranque con base local SQLite (F1). | Realizada |
| 9 jul | 4 | Demostración interna del spike chepicare-harness: conversación con el agente operando la API del consultorio con confirmación humana. | Realizada (interna) |
| 17 jul | 4 | Listas virtualizadas con volúmenes reales de datos; cierre del sprint. | Prevista |

# Parte VII. Grado de Avance del Producto

Indicadores objetivos de finalización de la aplicación móvil al corte:

| Indicador | Meta | Avance | % |
|---|---|---|---|
| Pantallas implementadas con datos reales | 70 | 70 (dominios público, autenticación, dueño y administrador) | 100 % |
| Endpoints del backend cubiertos por la trazabilidad requisito–ruta–pantalla | 157 | 156 | 99,4 % |
| Servicios de dominio contra la API real | 10 | 10 | 100 % |
| Suites de pruebas de integración real en verde | — | 15 suites / 49 casos | 100 % en verde |
| Hallazgos de análisis estático y react-doctor | 0 | 0 | Cumplido |
| Hoja de ruta offline-first (ADR 0001, fases F1–F4) | 4 fases | F1 completada (base SQLite local con migraciones) | 25 % |

En términos globales, el equipo estima el producto en un **≈ 85 % de finalización** respecto al alcance del PST: la funcionalidad en línea está completa y verificada en los cuatro dominios, y el trabajo restante se concentra en las fases F2–F4 de la arquitectura offline-first (cola de escrituras y sincronización diferida), la integración continua remota y las pruebas E2E automatizadas.

# Parte VIII. Exploración Fuera de Alcance: el Agente chepicare-harness

Dado el grado de finalización alcanzado por la aplicación móvil, en el seguimiento del 9 de julio el equipo conversó sobre los posibles siguientes pasos del producto más allá del alcance del PST. De esa conversación surgió un **spike técnico** materializado en el repositorio **chepicare-harness** (https://github.com/TheDigitalLab-dev/chepicare-harness), que el equipo declara y documenta expresamente **fuera del alcance del proyecto actual**:

- **Qué es**: un servicio Node.js + TypeScript que expone un **agente de inteligencia artificial multi-modelo** (Anthropic, OpenAI, Groq) capaz de operar la API Rails del consultorio **siempre con la identidad del usuario final**: el mismo token de sesión de la app móvil se propaga en cada operación, de modo que el backend sigue siendo la única autoridad de permisos.
- **Capacidades implementadas en el spike**: chat con streaming (SSE) pensado para integrarse en la app móvil y la web; herramientas por rol (22 para el dueño, 16 clínicas, 9 de operaciones); **confirmación humana obligatoria** para toda escritura (token de un solo uso con expiración); registro de auditoría inmutable; presupuesto diario de tokens y limitación de tasa por usuario; transcripción de voz; y un servidor MCP para herramientas de desarrollo. Incluye pruebas automatizadas, contenedor Docker e integración continua.
- **Relación con el PST**: el spike documenta además los cambios que requerirían los otros repositorios (incluido chepicare-mobile) para una eventual integración. Ninguno de esos cambios se ejecutará dentro del PST: el equipo lo registra como **candidato a siguiente paso** del producto — un asistente conversacional dentro de la app para que el dueño consulte citas, vacunas y pagos en lenguaje natural — sujeto a los lineamientos de la docente guía y a la culminación del alcance comprometido.
- **Disciplina de gestión**: conforme al acuerdo de la retrospectiva parcial del sprint 4, este trabajo no computa puntos en la velocity del producto y queda registrado como spike con resultado documentado (8 commits, 8–9 de julio de 2026).

# Parte IX. Próximos Pasos

1. Cerrar el sprint 4 con la demostración y retrospectiva previstas para el 17 de julio.
2. Planificar el sprint 5 (lunes 20 de julio) priorizando la fase F2 del ADR 0001: cola de escrituras y sincronización diferida.
3. Incorporar la integración continua remota (GitHub Actions) con el backend contenerizado, conforme a la recomendación del informe técnico de verificación (eval 4).
4. Añadir pruebas E2E automatizadas de los flujos críticos (inicio de sesión, agendamiento, registro de pago).
5. Mantener en el radar, fuera de alcance, la eventual integración del agente conversacional (chepicare-harness) como evolución del producto posterior al PST.
