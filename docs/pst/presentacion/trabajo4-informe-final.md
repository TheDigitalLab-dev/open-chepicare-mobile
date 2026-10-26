# DEDICATORIA

Miguel

A Fedora y Chepino. Nos vemos en el Valhalla.

# AGRADECIMIENTO

Miguel

A Rafael Hernandez y Augusto Gonzalez por todas las preguntas que respondieron sobre arquitectura para mobile, system design, local first y otro montón de inventos que metí en una aplicación solo porque sí.

A Jose Manuel da Silva; especialmente por el aprendizaje obtenido en economía y emprendimiento. Gracias a ti he logrado conseguir el capital para varios proyectos propios y universitarios también, parte de este trabajo es gracias a estas valiosas habilidades.

A algo expert, Wadie Aziz y la profesora yuly; quienes a pesar de la UNETI hacen esfuerzos sobrehumanos para mantener la calidad de la educación.

A la Uneti, por ser un mal ejemplo, gracias a esto pude canalizar mi ira y mi decepción en un proyecto como este y convertirlo en un bien para todo el ecosistema relacionado con el cuidado animal.

# RESUMEN

La presente investigación tiene como objetivo el desarrollo de **Chepicare, aplicación móvil para atención veterinaria a domicilio**, segunda etapa del Proyecto Sociotecnológico iniciado con la plataforma CRM del consultorio veterinario Chepicare (urbanización La Mora I, La Victoria, estado Aragua). El diagnóstico participativo realizado con la Dra. Génesis Conesa y su equipo evidenció que, si bien la plataforma web resolvió la gestión interna del consultorio, dos realidades limitaban su alcance: la **atención a domicilio se realiza en campo, con conectividad intermitente**, y **una parte importante de los usuarios no utiliza computadoras — su único dispositivo de acceso digital es el teléfono**. Como respuesta se construyó una aplicación móvil Android (Expo SDK 56, React Native, TypeScript estricto) cuyo eje arquitectónico es el enfoque **local-first**: los datos residen primero en el dispositivo (base SQLite local) y se **sincronizan con el servidor cuando existe conexión**, garantizando que la atención clínica en campo nunca dependa de la red — incluidas las alarmas de medicación y el sistema de notificaciones, que operan sin conexión. La aplicación consume el API REST del CRM (157 rutas) mediante 10 servicios de dominio y expone 74 pantallas en los dominios público, dueño y administrador. El proceso se gestionó con Scrum en sprints de dos semanas, con desarrollo guiado por pruebas (TDD) y una regla estricta de trabajo sin datos simulados: 24 suites con 108 pruebas de integración se ejecutan contra el backend real. Los resultados demuestran el cumplimiento de los objetivos planificados con una velocity estable de 27 puntos por sprint, y el impacto se valida con la comunidad mediante el Formato de Evaluación de PST provisto por la universidad, aplicado a los usuarios finales.

**Palabras clave:** aplicación móvil, local-first, sincronización, atención veterinaria a domicilio, React Native, Scrum, desarrollo guiado por pruebas, Investigación Acción Participativa.

# INTRODUCCIÓN

En Venezuela, el teléfono inteligente es el dispositivo digital de mayor penetración: para una parte significativa de la población es, en la práctica, **el único punto de acceso a servicios digitales**, pues no posee ni utiliza computadoras personales. Cualquier solución tecnológica pensada para llegar a la comunidad — y no solo al mostrador de un negocio — debe partir de esa realidad. La primera etapa de este Proyecto Sociotecnológico entregó al consultorio veterinario Chepicare una plataforma web de gestión de relaciones con los clientes (CRM) que digitalizó sus procesos internos; la etapa que documenta este informe lleva ese sistema **al bolsillo de los usuarios**: una aplicación móvil que acompaña al equipo del consultorio en la atención a domicilio y acerca los servicios al dueño de la mascota desde su teléfono.

El desafío técnico central no fue estético sino estructural: la atención a domicilio ocurre donde la conectividad es intermitente o inexistente. Por ello, la decisión arquitectónica más importante del proyecto — registrada en el documento de decisión ADR 0001 — fue adoptar un enfoque **local-first**: la aplicación funciona primero con datos locales en el dispositivo y **sincroniza con el servidor cuando hay conexión disponible**, en lugar de exigir red permanente. Este informe final documenta las tres fases del proyecto: el diagnóstico situacional que fundamenta la necesidad (Fase I), la planificación bajo el marco Scrum (Fase II) y los resultados y logros alcanzados, incluyendo el análisis de cumplimiento de objetivos, el rendimiento del equipo y la evaluación de resultados e impacto con la comunidad (Fase III).

# FASE I — DIAGNÓSTICO SITUACIONAL

## Descripción del contexto

El consultorio veterinario Chepicare, dirigido por la Dra. Génesis Conesa, se encuentra ubicado en la urbanización La Mora I, La Victoria, municipio José Félix Ribas, estado Aragua. Ofrece servicios integrales de salud animal — consultas, hospedaje, peluquería canina y **atención a domicilio** — a precios accesibles, atendiendo a familias de distintos estratos socioeconómicos de la ciudad, y participa activamente en campañas de vacunación y jornadas de atención comunitaria. El equipo base lo conforman la Dra. Conesa y su asistente, apoyadas por veterinarios auxiliares en procedimientos especiales.

El diagnóstico participativo de esta etapa se realizó mediante entrevistas a profundidad con la Dra. Conesa y su asistente, observación directa de la operación — incluyendo salidas de atención a domicilio — y talleres de validación de incrementos, siguiendo el enfoque de Investigación Acción Participativa (IAP) que caracterizó todo el proyecto.

## Naturaleza de la comunidad

La urbanización La Mora I es un sector residencial consolidado de La Victoria, compuesto por edificios multifamiliares y viviendas unifamiliares, con servicios públicos completos y buena conectividad vial. Alberga familias de diversos estratos socioeconómicos, muchas de ellas propietarias de mascotas. Un rasgo determinante para este proyecto: en los hogares de la comunidad **el teléfono inteligente es el dispositivo digital predominante** — la computadora personal es minoritaria — por lo que los canales digitales del consultorio deben vivir, ante todo, en el teléfono.

## Antecedente: la plataforma CRM (primera etapa del PST)

La primera etapa del proyecto entregó la plataforma CRM Chepicare (Ruby on Rails 8, React, Inertia.js), que digitalizó la gestión de citas, historias clínicas electrónicas, control de vacunación, comunicación con clientes y registro de pagos del consultorio, con dos portales web (propietario y administración) y 41 requisitos funcionales documentados. Esa plataforma opera correctamente en el mostrador del consultorio; el presente proyecto parte de su API para extender el sistema hacia el campo y hacia el teléfono del usuario.

## Análisis del problema

Con el CRM web en operación, el diagnóstico participativo identificó una brecha de acceso y una brecha de campo:

**Causas del problema:**

- La atención a domicilio — servicio distintivo del consultorio — se realiza en sectores donde la **conectividad móvil es intermitente o inexistente**, impidiendo consultar o registrar información clínica contra un sistema que exige conexión permanente.
- **Muchos usuarios del consultorio no usan computadora**: su acceso digital es exclusivamente el teléfono, por lo que un portal web pensado para escritorio les resulta ajeno o inaccesible.
- El navegador móvil no ofrece la experiencia ni las capacidades del dispositivo (almacenamiento local robusto, credenciales seguras, notificaciones), limitando la adopción del canal web en teléfonos.
- El registro de la atención en campo seguía apoyándose en notas manuales que luego debían transcribirse al sistema, duplicando trabajo y generando errores.

**Efectos del problema:**

- Información clínica de la atención a domicilio incompleta, tardía o perdida.
- Subutilización del CRM por parte de los dueños de mascotas sin computadora.
- Dependencia de llamadas telefónicas para agendar citas o consultar vacunas, recargando al personal del consultorio.
- Riesgo de decisiones clínicas en campo sin acceso a la historia del paciente.

## Matriz de priorización de problemas

| Problema | Frecuencia | Impacto | Factibilidad de solución | Prioridad |
|---|---|---|---|---|
| Imposibilidad de operar el sistema durante la atención a domicilio sin conexión | Alta | Crítico | Alta (arquitectura local-first) | 1 |
| Usuarios sin computadora no acceden a los servicios digitales del consultorio | Alta | Alto | Alta (app móvil nativa) | 2 |
| Registro en campo duplicado (papel → sistema) | Alta | Alto | Alta | 3 |
| Consultas telefónicas recurrentes por citas y vacunas | Media | Medio | Alta | 4 |
| Ausencia de canal móvil para adopciones, apadrinamientos y tienda | Media | Medio | Media | 5 |

## Propósito u objetivos

### Objetivo General

Desarrollar una aplicación móvil **local-first** para el consultorio veterinario Chepicare que extienda la plataforma CRM hacia la atención a domicilio y hacia los teléfonos de los dueños de mascotas, garantizando la operación sin conexión con **sincronización automática cuando exista conectividad**, mediante un enfoque de Investigación Acción Participativa.

### Objetivos Específicos

1. Diagnosticar, mediante técnicas participativas, las limitaciones de acceso y de campo de la plataforma CRM existente, priorizando las necesidades de los usuarios que solo disponen de teléfono y del equipo clínico que atiende a domicilio.
2. Diseñar la arquitectura de la aplicación móvil — incluyendo la decisión local-first (ADR 0001), el modelo de datos local y la estrategia de sincronización diferida — y su sistema visual con temas claro y oscuro.
3. Desarrollar los dominios funcionales de la aplicación (público, dueño y administrador) sobre el API real del CRM, con desarrollo guiado por pruebas (TDD) y sin datos simulados en ninguna pantalla.
4. Implementar la fase inicial de la arquitectura local-first (base de datos SQLite en el dispositivo con migraciones verificadas) como fundamento de la operación sin conexión y la sincronización posterior.
5. Verificar la calidad del producto mediante pruebas de integración reales contra el backend, compuertas de calidad automatizadas y validación funcional con los informantes clave del consultorio.

## Vinculación con las líneas estratégicas de desarrollo de la nación e impacto social

El proyecto se vincula con el Plan de Desarrollo Económico y Social de la Nación en su línea de transformación relativa a la ciencia y la tecnología al servicio de la solución de problemas concretos de las comunidades, y se sustenta en el siguiente marco legal:

- **Constitución de la República Bolivariana de Venezuela (1999)**: artículo 110 (interés público de la ciencia, la tecnología y la innovación), artículo 108 (incorporación del conocimiento y aplicación de las nuevas tecnologías en los centros educativos) y artículo 98 (libertad de creación y divulgación de la obra científica y tecnológica).
- **Ley Orgánica de Ciencia, Tecnología e Innovación (LOCTI, 2005)**: artículos 1 y 2 — aplicación de conocimientos académicos a la solución de problemas concretos de la sociedad y declaración de interés público de las actividades tecnológicas.
- **Ley de Infogobierno (2013)**: artículos 1 y 34 — promoción de las tecnologías de información libres y del conocimiento abierto; el proyecto publica su código fuente en repositorios públicos.
- **Ley de Ejercicio de la Medicina Veterinaria (1968) y Código Deontológico de la FCMVV**: obligaciones de registro clínico, confidencialidad y seguimiento de pacientes, que la aplicación facilita al llevar la historia clínica al punto de atención — incluso sin conexión.

El impacto social es directo: democratiza el acceso a los servicios digitales del consultorio para la mayoría que solo dispone de teléfono, y eleva la calidad del registro clínico de la atención a domicilio en sectores con conectividad limitada.

## Población beneficiada

**Directa:**

- El equipo del consultorio Chepicare (la Dra. Génesis Conesa, su asistente y los veterinarios auxiliares), que dispone de la historia clínica y la agenda en el teléfono durante la atención a domicilio, con o sin conexión.
- Los dueños de mascotas atendidos por el consultorio — cientos de familias de La Victoria — que ahora agendan citas, consultan vacunas, historias y pagos **desde su teléfono**, sin necesidad de computadora.
- Las mascotas, beneficiarias finales de un seguimiento clínico continuo y de esquemas de vacunación al día.

**Indirecta:**

- Otros consultorios veterinarios de Venezuela: el código de la aplicación es público y reutilizable (municipio José Félix Ribas: más de 214.000 habitantes con demanda de servicios veterinarios similares).
- La comunidad académica de la UNETI, que recibe una referencia metodológica de desarrollo móvil local-first con calidad verificada.
- La comunidad de software libre, que obtiene una solución móvil especializada en un nicho poco atendido.

## Razones del proyecto

La razón de fondo es de **efectividad del acceso**: una aplicación específica instalada en el teléfono del usuario es, en este contexto, más efectiva que cualquier portal web — funciona en el dispositivo que la gente realmente usa, opera sin conexión donde la red falla y aprovecha las capacidades del equipo (almacenamiento local, credenciales seguras). A ello se suman la razón clínica (historia del paciente disponible en el punto de atención), la razón operativa (menos llamadas, menos transcripción manual) y la razón académica (aplicar ingeniería de software rigurosa — TDD, verificación continua, Scrum — a un problema comunitario real).

# FASE II — PLANIFICACIÓN DEL PROYECTO

## Factibilidad del proyecto

**Factibilidad técnica.** El stack elegido es maduro y de código abierto: Expo SDK 56 y React Native 0.85 con TypeScript estricto para el cliente móvil; SQLite (expo-sqlite) para la base local del enfoque local-first; el API REST existente del CRM (Ruby on Rails, 157 rutas) como backend. La documentación es extensa y las comunidades activas; el equipo domina el ecosistema React desde la primera etapa del proyecto.

**Factibilidad operativa.** La Dra. Conesa y su asistente participaron como informantes clave y validadoras de cada incremento; el consultorio dispone de teléfonos Android e internet para la sincronización. La aplicación reutiliza las cuentas y permisos del CRM, por lo que no crea cargas administrativas nuevas.

**Factibilidad económica.** El proyecto no requirió inversión adicional: herramientas de desarrollo gratuitas y de código abierto, el backend ya desplegado por la primera etapa, y equipos propios del equipo investigador. El costo marginal de operación es nulo para el consultorio.

**Recursos humanos.** Equipo investigador de tres estudiantes con roles Scrum definidos (ver Metodología), la tutora académica y los informantes clave del consultorio.

**Recursos tecnológicos.** Repositorios Git públicos (GitHub), backend Rails de referencia en ejecución, emulador Android y dispositivos reales para verificación, herramientas de calidad automatizadas (Jest, TypeScript, ESLint, react-doctor, Husky).

## Metodología: Scrum

A diferencia de la primera etapa (gestionada con metodología en cascada y tablero Kanban), esta etapa adoptó **Scrum**: el producto se construyó en **sprints de dos semanas** (lunes a domingo de la semana siguiente), con planificación al inicio, reuniones de seguimiento cada 3 días, y revisión con demostración y retrospectiva al cierre de cada sprint. Los roles fueron:

| Integrante | Rol |
|---|---|
| Iromy León | Scrum Master (durante todo el proyecto); gestión del proyecto por períodos, compartida con Miguel Figuera. |
| Alejandra Herde | QA principal: verificación de los incrementos contra la definición de terminado y validación funcional. |
| Miguel Figuera | Desarrollador; gestión del proyecto por períodos, compartida con Iromy León. |

**Justificación.** El alcance de esta etapa exigía retroalimentación rápida de los informantes clave (cada dominio de la app se validaba con el consultorio) y una arquitectura que evolucionaba por fases (local-first F1–F4). Scrum, con entregas incrementales verificadas cada dos semanas y velocity medible, se ajustó a esa necesidad mejor que un ciclo secuencial. La definición de terminado incorporó las compuertas de calidad del equipo: pruebas de integración reales en verde, verificación de tipos, análisis estático sin errores, cero hallazgos de react-doctor y formato aplicado, antes de cada commit.

## Cronograma de actividades

| Sprint | Período | Hito principal |
|---|---|---|
| Sprint 1 | 25 may – 7 jun 2026 | Concepción y paquete de diseño: requisitos (26 RF, 17 RNF), ADR 0001 local-first, diagramas, demo de interfaz. |
| Sprint 2 | 8 – 21 jun 2026 | Todos los dominios funcionales sobre el API real con TDD; regla "nada simulado". |
| Sprint 3 | 22 jun – 5 jul 2026 | Fase F1 local-first (SQLite con migraciones), selector de servidor autoalojado, calidad react-doctor; PR #1. |
| Sprint 4 | 6 – 19 jul 2026 | Virtualización de listas (PR #2), sistema completo de notificaciones y alarmas de medicación local-first (PR #3), entregables académicos. |

## Módulos desarrollados

La aplicación expone **74 pantallas** organizadas en cuatro dominios (más dos comunes), todas consumiendo datos reales del API:

| Dominio | Pantallas | Contenido |
|---|---|---|
| Público | 14 | Catálogo de productos y servicios, adopciones, apadrinamientos, checkout, contacto, términos y privacidad. |
| Autenticación | 6 | Inicio de sesión, registro, recuperación y cambio de contraseña, selector de servidor. |
| Dueño | 26 | Panel, mascotas, citas con asistente de agendamiento, historia clínica completa (consultas, vacunas, desparasitaciones, exámenes, informes), pagos, apadrinamientos, perfil, y tratamientos de medicación con alarmas. |
| Administrador | 26 | Panel con métricas, gestión de citas, consultas, vacunación, pagos, adopciones, informes médicos, recetas y exámenes de laboratorio. |
| Comunes | 2 | Centro de notificaciones (campana con badge) y preferencias de notificaciones por categoría. |

## Plan de acción

| Actividad | Responsable | Producto verificable |
|---|---|---|
| Diagnóstico participativo de la brecha móvil | Equipo + informantes clave | Matriz de priorización; requisitos móviles. |
| Diseño de la arquitectura local-first | DEV con revisión del equipo | ADR 0001; plan de sincronización diferida. |
| Construcción por dominios con TDD | DEV; QA verifica | Código + 15 suites de pruebas reales. |
| Verificación continua | QA | Compuertas de calidad; hook pre-push; react-doctor en cero. |
| Validación con la comunidad | Scrum Master + equipo | Demostraciones por sprint; aplicación del Formato de Evaluación de PST de la universidad. |
| Gestión y seguimiento | Scrum Master | Informes parciales 1 y 2; reporte de velocity. |

# FASE III — RESULTADOS Y LOGROS

## Resultados por fase del desarrollo

**Fase de análisis de requisitos.** Se documentaron 26 requisitos funcionales y 17 no funcionales específicos del cliente móvil, trazados contra las 157 rutas del API del CRM. La trazabilidad requisito → ruta → pantalla → componente alcanzó 156 de 157 endpoints (99,4 %).

**Fase de diseño.** Se produjo el paquete completo de diseño: ADR 0001 — Arquitectura de datos móvil (offline-first híbrido), que establece el principio rector del proyecto — **los datos viven primero en el dispositivo y se sincronizan cuando hay conexión** —; el mapa de navegación por dominios; y el sistema visual con tokens de diseño y temas claro y oscuro, validado con demo navegable.

**Fase de implementación.** Los cuatro dominios se construyeron con desarrollo guiado por pruebas (rojo → verde → refactorización) sobre 10 servicios de dominio contra el API real, bajo la regla estricta de **cero datos simulados**: toda pantalla visible consume el backend desde el primer día. La fase F1 del enfoque local-first quedó implementada: base de datos SQLite en el dispositivo con cuatro migraciones verificadas por pruebas. Sobre esa base se construyó el **sistema completo de notificaciones**: alarmas de medicación con horarios anclados al «tratamiento iniciado» y tomas reajustables, centro de notificaciones in-app, recordatorios locales (citas, vacunas, desparasitación, pagos, agenda clínica), detección de cambios por sincronización y preferencias por categoría — todo operando sin conexión.

**Fase de pruebas.** La verificación es una propiedad del proceso, no una etapa final: 24 suites con 108 casos de integración se ejecutan contra el backend real en cada compuerta de calidad; el hook pre-push bloquea la publicación de código defectuoso; el diagnóstico react-doctor cerró en cero hallazgos; y cada incremento se validó funcionalmente en emulador Android y con los informantes clave. Como cierre del sprint 4 se ejecutó además una **revisión multi-agente de preparación para producción** (cinco revisores independientes: seguridad, corrección, experiencia de usuario, configuración de release y rendimiento) cuyos hallazgos — bloqueantes e importantes — fueron corregidos en su totalidad: protección contra registros dobles de tomas, transaccionalidad de la base local, barrera de errores global, configuración de builds (EAS), purga de datos al cerrar sesión y traducción de errores del servidor, entre otros.

## Resultados cuantitativos del proyecto

| Indicador | Resultado |
|---|---|
| Pantallas funcionales con datos reales | 74 (4 dominios + 2 comunes) |
| Servicios de dominio contra el API | 10 |
| Endpoints cubiertos por la trazabilidad | 156 de 157 (99,4 %) |
| Requisitos documentados | 26 funcionales + 17 no funcionales |
| Suites / casos de prueba de integración real | 24 / 108 — sin respuestas de API simuladas |
| Sistema de notificaciones y alarmas locales | Completo: centro in-app, 6 familias de recordatorios, alarmas de medicación y preferencias — operan sin conexión |
| Hallazgos de análisis estático y react-doctor al cierre | 0 |
| Sprints ejecutados / velocity | 4 sprints; 108 puntos completados de 108 comprometidos; promedio 27 |
| Pull requests integrados con revisión | 3 (#1, #2 y #3) |
| Repositorio público | github.com/TheDigitalLab-dev/chepicare-mobile |

## Análisis de cumplimiento de objetivos

El rendimiento del equipo se evalúa contrastando lo planificado con lo entregado, objetivo por objetivo:

| Objetivo específico | Evidencia verificable | Estado |
|---|---|---|
| 1. Diagnóstico participativo de la brecha móvil | Matriz de priorización; requisitos móviles derivados de entrevistas y observación en campo. | Cumplido |
| 2. Diseño de la arquitectura local-first y del sistema visual | ADR 0001; plan de sincronización diferida; tokens de diseño con tema claro/oscuro; demo validada. | Cumplido |
| 3. Desarrollo de los dominios sobre el API real con TDD y sin simulaciones | 74 pantallas; 10 servicios de dominio; commits TDD auditables en el repositorio. | Cumplido |
| 4. Implementación de la fase inicial local-first (SQLite + migraciones) | Suite de migraciones en verde; base local operativa (F1 del ADR 0001). | Cumplido (F1); F2–F4 planificadas como continuidad |
| 5. Verificación de calidad con pruebas reales y compuertas automatizadas | 24 suites / 108 pruebas contra el backend; hook pre-push; react-doctor en cero. | Cumplido |

En cuanto al **rendimiento del equipo contra la planificación**: de 108 puntos comprometidos en los cuatro sprints se completaron 108 (100 %), con velocity estable (21, 34, 26 y 27) y una desviación de estimación inferior al 12 %. El sprint 4 cerró su compromiso completo con la entrega del sistema de notificaciones y las alarmas de medicación (PR #3). La única reprogramación relevante — posponer la fase F2 de sincronización para priorizar la calidad del producto — se registró como decisión explícita de alcance en la retrospectiva del sprint 3, no como desviación no controlada. El detalle sprint a sprint consta en los informes parciales 1 y 2.

## Evaluación de resultados e impacto

La evaluación de resultados e impacto combina tres instrumentos:

1. **Formato de Evaluación de PST de la Comunidad**: instrumento provisto por la universidad, que el equipo presenta y aplica a los usuarios finales — la Dra. Conesa, su asistente y dueños de mascotas — para comprobar, requerimiento por requerimiento, si el software cumple las necesidades detectadas al inicio del proyecto.
2. **Indicadores objetivos del producto**: los resultados cuantitativos de la sección anterior, auditables en el repositorio público.
3. **Demostraciones validadas**: cada sprint cerró con una demostración del incremento funcionando con datos reales, con participación de los informantes clave.

El impacto esperado y observado se concentra donde el diagnóstico señaló la necesidad: el equipo clínico dispone de la información en el punto de atención a domicilio sin depender de la red, y los dueños de mascotas — incluidos quienes no usan computadora — acceden a citas, vacunas, historias y pagos desde el teléfono. La aplicación de este instrumento y la sistematización de sus resultados quedan como insumo del acta de cierre con la comunidad.

## Alcance extendido del proyecto

Dado el grado de finalización alcanzado, el equipo realizó una exploración técnica **fuera del alcance del PST** — el agente de inteligencia artificial chepicare-harness (github.com/TheDigitalLab-dev/chepicare-harness) — documentada como spike en el segundo informe parcial y registrada como candidato a evolución futura del producto: un asistente conversacional dentro de la aplicación. No computó puntos en la velocity ni compromete el alcance entregado.

## CONCLUSIONES

1. **El enfoque local-first fue la decisión correcta y la más importante del proyecto**: diseñar la aplicación para funcionar primero con datos locales y sincronizar cuando hay conexión responde exactamente a la realidad de la atención a domicilio en sectores con conectividad intermitente; la fase F1 (base local verificada) deja ese fundamento operativo, y las **alarmas de medicación que suenan sin conexión** son su prueba tangible: el tratamiento de la mascota no depende de la señal.
2. **El teléfono es el canal efectivo de acceso comunitario**: ante una población donde buena parte de los usuarios no utiliza computadora, una aplicación específica instalada en sus teléfonos demostró ser la vía más general y efectiva para acercar los servicios del consultorio, en lugar de esperar que la comunidad se adapte a un portal de escritorio.
3. La combinación de **TDD, pruebas de integración reales y compuertas automatizadas** convirtió la calidad en una propiedad del proceso: 108 pruebas contra el backend real y cero hallazgos de diagnóstico al cierre, verificables por cualquier evaluador en el repositorio público.
4. **Scrum con sprints de dos semanas** dio al proyecto previsibilidad medible (velocity promedio de 27 puntos, desviación de estimación < 12 %) y un mecanismo de mejora continua cuyos acuerdos — commits convencionales, pull requests, hook pre-push — quedaron implantados y auditables.
5. La Investigación Acción Participativa mantuvo el producto alineado con las necesidades reales: cada dominio se validó con los informantes clave, y el Formato de Evaluación de la Comunidad cierra el ciclo devolviendo a los usuarios la comprobación de sus requerimientos.

## RECOMENDACIONES

1. Completar las fases F2–F4 del ADR 0001 — cola de escrituras locales y **sincronización automática al recuperar conexión** — como prioridad de la continuidad del proyecto.
2. Incorporar integración continua remota (GitHub Actions) con el backend contenerizado, para re-ejecutar las compuertas de calidad en cada pull request.
3. Añadir pruebas E2E automatizadas de los flujos críticos (inicio de sesión, agendamiento, registro de pago) y medición de cobertura de código con umbral progresivo.
4. Publicar la aplicación en una tienda de distribución (o mediante APK firmado de distribución directa) y acompañar el despliegue con una jornada de capacitación a los usuarios del consultorio.
5. Aplicar periódicamente el Formato de Evaluación de PST de la Comunidad para realimentar el backlog con la experiencia real de uso.
6. Implementar las **push remotas** (avisos con la app cerrada) conforme al plan 033 documentado en el backend: registro de dispositivos y emisor Expo Push junto a los mailers existentes.
7. Evaluar, como evolución posterior al PST, la integración del asistente conversacional explorado en chepicare-harness.

## BIBLIOGRAFÍA

Asamblea Nacional Constituyente. (1999). Constitución de la República Bolivariana de Venezuela. Gaceta Oficial Extraordinaria N.° 5.453.

Asamblea Nacional. (2005). Ley Orgánica de Ciencia, Tecnología e Innovación. Gaceta Oficial N.° 38.242.

Asamblea Nacional. (2013). Ley de Infogobierno. Gaceta Oficial N.° 40.274.

Beck, K. (2003). Test-driven development: By example. Addison-Wesley.

Congreso de la República. (1968). Ley de Ejercicio de la Medicina Veterinaria. Gaceta Oficial del 19 de septiembre de 1968.

International Organization for Standardization. (2011). ISO/IEC 25010: Systems and software engineering — SQuaRE — System and software quality models. ISO.

Kleppmann, M., Wiggins, A., van Hardenberg, P., y McGranaghan, M. (2019). Local-first software: You own your data, in spite of the cloud. Proceedings of Onward! 2019. ACM.

Schwaber, K., y Sutherland, J. (2020). La Guía de Scrum: la guía definitiva de Scrum. Scrum.org.

