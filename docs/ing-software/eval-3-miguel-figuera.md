# Introducción

El presente documento desarrolla la **fase de diseño** del producto Chepicare — aplicación móvil para atención veterinaria a domicilio — en el marco del Proyecto Socio Tecnológico III (PSTIII) de la Universidad Nacional Experimental de las Telecomunicaciones e Informática (UNETI). El propósito es doble: por una parte, formalizar el proceso de software del proyecto mediante un **Plan de la Calidad**, siguiendo la propuesta de Álvarez y López (2005) para proyectos que emplean metodologías ágiles; por otra, documentar el proceso de diseño con el rigor del enfoque basado en procesos de la norma **ISO 9000:2000**, tomando como analogía la experiencia de documentación del proceso de desarrollo de software descrita por Romero Mosquera (2006).

Como sostiene Humphrey, citado por Álvarez y López (2005), la calidad de un producto de software está determinada, en buena medida, por la calidad del proceso usado para desarrollarlo y mantenerlo. Por ello, antes de presentar los artefactos de diseño del producto, se define y documenta la forma de trabajo del equipo: qué actividades se realizan, qué productos consumen y generan, quién es responsable de cada una y contra qué criterios se verifica su calidad.

# El producto y su contexto de desarrollo

**Chepicare** es una plataforma de gestión de relaciones con los clientes (CRM) para el consultorio veterinario Chepicare (La Victoria, estado Aragua), cuyo componente central es una aplicación móvil Android (Expo SDK 56 / React Native / TypeScript) que habilita la atención veterinaria a domicilio. El sistema digitaliza la gestión de citas, historias clínicas, control de vacunación, comunicación con los clientes y registro de pagos, consumiendo un backend API REST (Ruby on Rails) con 157 rutas documentadas para el cliente móvil, distribuidas en los dominios Público (19), Dueño (54) y Administrador (84).

El proyecto es ejecutado por un equipo de tres estudiantes investigadores (Miguel Figuera, Iromy León y Alejandra Herde), bajo la tutoría de la profesora Yuly Delgado, con la Dra. Génesis Conesa (líder del consultorio) como informante clave y validadora principal. La metodología del proyecto combina un **diagnóstico participativo iterativo** para el levantamiento y validación de requerimientos con el marco ágil **Scrum** para la organización del desarrollo en sprints cortos con entregas incrementales.

# Identificación del ambiente y características del proyecto

Álvarez y López (2005) proponen cuatro actividades para elaborar el Plan de la Calidad de un proyecto: (1) identificar el ambiente del proyecto y sus características, (2) seleccionar el proceso y las actividades a realizar, (3) documentar el plan de la calidad y (4) mantenerlo actualizado. Aplicando la primera actividad al proyecto Chepicare se obtiene la siguiente caracterización:

| Factor | Situación en el proyecto Chepicare |
|---|---|
| Número de personas involucradas | Equipo pequeño: 3 estudiantes desarrolladores, 1 tutora académica, 1 clienta principal y su asistente. |
| Forma de comunicación | Directa y frecuente dentro del equipo; contacto regular con la clienta mediante entrevistas, observación y talleres de validación. |
| Volatilidad de los requisitos | Media-alta: los requerimientos se refinan en cada iteración del diagnóstico participativo y en cada revisión de sprint. |
| Tamaño y complejidad | Producto de tamaño medio (26 requisitos funcionales, 17 no funcionales, 157 endpoints), complejidad dominada por la operación offline-first y la sincronización. |
| Criticidad | Media: gestiona datos de salud animal y pagos; no compromete vidas humanas, pero exige integridad de datos y trazabilidad clínica. |
| Riesgos principales | Conectividad intermitente en la atención a domicilio, pérdida de datos locales, desalineación con las necesidades reales del consultorio. |
| Madurez de la organización | Equipo académico sin proceso organizacional previo; el plan de la calidad del proyecto sirve de primera aproximación a un proceso formalizado. |
| Ciclo de vida esperado | Producto de uso continuo por el consultorio, con mantenimiento evolutivo posterior a la entrega académica. |

# Selección del proceso

De acuerdo con Álvarez y López (2005), los procesos ágiles se centran en las personas, en su comunicación directa y sus habilidades, y resultan apropiados para proyectos de menor complejidad o riesgo con equipos que trabajan en un mismo lugar físico; los procesos tradicionales, en cambio, convienen a proyectos de gran dimensión, larga duración o equipos numerosos y distribuidos. Dado el ambiente identificado — equipo pequeño y colocalizado, clienta accesible, requisitos que evolucionan con la retroalimentación — el proyecto Chepicare adopta un **proceso ágil (Scrum)**, formalizado mediante el plan de la calidad para procesos ágiles propuesto por las autoras: declaración de valores del equipo y tabla de prácticas con su desarrollo y fundamento.

No obstante, para la fase de diseño se incorpora adicionalmente el formato tabular de actividades dependientes de la fase (propio de los planes para procesos tradicionales), pues la naturaleza clínica del dominio exige registrar con precisión qué artefactos de diseño se producen, de qué insumos dependen y quién responde por ellos. Esta combinación es coherente con la recomendación de las autoras de adecuar el plan a las características de cada situación.

# Plan de la calidad del proyecto

## Valores del equipo

Siguiendo el formato ágil de Álvarez y López (2005), el equipo declara y comparte los siguientes valores, tomados de la programación extrema:

| Valores |
|---|
| Comunicación: diálogo directo diario dentro del equipo y contacto frecuente con la clienta. |
| Simplicidad: se diseña y construye lo más simple que resuelva el requisito actual. |
| Realimentación: cada sprint termina con una revisión validada contra el backend real y con los informantes clave. |
| Coraje: se refactoriza y se corrige el diseño cuando la evidencia lo exige, aunque implique retrabajo. |

## Prácticas del proceso

La siguiente tabla documenta las prácticas adoptadas, cómo se desarrollan en el proyecto y su objetivo o fundamento, según el formato propuesto para procesos ágiles:

| Prácticas | Desarrollo | Objetivos/Fundamentos |
|---|---|---|
| Planificación por sprints | El trabajo se organiza en sprints cortos con un backlog derivado de los requisitos priorizados (alta, media, baja); cada sprint tiene planificación y revisión. | Detectar desvíos temprano, ajustar los planes a la productividad real y obtener retroalimentación rápida del usuario. |
| Cliente en el sitio | La Dra. Génesis Conesa y su asistente participan en entrevistas, talleres de validación y revisiones de incremento. | Asegurar que el producto responde a las necesidades reales de la atención a domicilio y comunicar cambios oportunamente. |
| Desarrollo guiado por pruebas (TDD) | Para hooks, servicios, repositorios y utilidades de negocio se escribe primero la prueba (rojo → verde → refactor). | Encontrar errores lo más temprano posible, reducir el retrabajo y documentar el comportamiento esperado. |
| Pruebas de integración reales | Las pruebas se ejecutan contra el backend en ejecución, sin respuestas de API simuladas; solo se sustituyen los shims de plataforma nativa inexistentes en Node. | Verificar el sistema en condiciones reales y evitar la falsa confianza que producen los datos ficticios. |
| Nada simulado en producción | Está prohibido el uso de datos de prueba, pantallas falsas o marcadores de posición en código de producción; toda pantalla consume datos reales del API. | Garantizar que todo lo visible funciona de verdad y que las demostraciones reflejan el estado real del producto. |
| Compuertas de calidad | Antes de cada commit deben pasar: pruebas, verificación de tipos, análisis estático (lint), diagnóstico react-doctor sin hallazgos y formateo; el hook pre-push re-ejecuta y bloquea el envío si algo falla. | Impedir que defectos conocidos entren al repositorio y mantener una base de código siempre integrable. |
| Integración continua | Los cambios se integran con frecuencia mediante ramas cortas y revisiones (pull requests) sobre la rama principal. | Disminuir los errores de integración y mantener un producto potencialmente entregable. |
| Estándar de codificación | TypeScript estricto (sin any injustificado), un servicio por dominio, tipos centralizados, commits convencionales, estados de carga, error y vacío en toda pantalla que solicite datos. | Que todo el equipo entienda y mantenga el código con el mismo criterio; trazabilidad del historial de cambios. |
| Refactorización | El código se mejora continuamente al cerrar cada funcionalidad, apoyado en la red de pruebas. | Mantener el diseño simple, reducir defectos y sostener la velocidad de desarrollo. |
| Propiedad colectiva del código | Todo el equipo conoce y puede modificar cualquier módulo; el conocimiento se comparte en las revisiones. | Flexibilidad del proceso y eliminación de cuellos de botella por conocimiento concentrado. |
| Diseño simple con decisiones registradas | Se implementa la solución más simple; las decisiones arquitectónicas relevantes se registran en documentos ADR (Architecture Decision Records). | Comprensión compartida de la estructura del sistema (metáfora) y memoria de las decisiones y sus alternativas. |

# La fase de diseño en el plan de la calidad

Aplicando el formato tabular de actividades dependientes de la fase (Álvarez y López, 2005), la fase de diseño del producto Chepicare queda documentada así. Roles: GEPRO (gestión del proyecto), ARQ (arquitectura), UI (diseño de interfaz), DEV (desarrollo), TUT (tutora), CLI (clienta/informantes clave).

| Cód. Tarea | Actividad | P. Resultado | P. Consumido | Rol Resp. | Roles Part. | Doc. de Referencia |
|---|---|---|---|---|---|---|
| TD3.1 | Especificación de la arquitectura del sistema (tres capas contenerizadas, cliente-servidor, API REST) | Diagramas de arquitectura; ADR 0001 — Arquitectura de datos móvil (offline-first híbrido) | Especificación de requisitos (RF/RNF) | ARQ | DEV, TUT | mobile-requirements.md |
| TD3.2 | Diseño del modelo de datos y de la estrategia offline-first (caché local, cola de escrituras, sincronización bajo consentimiento) | Modelo de datos móvil; política de sincronización | ADR 0001; esquema del API | ARQ | DEV | adr/0001 |
| TD3.3 | Diseño de la navegación y del inventario de pantallas por dominio (público, dueño, administrador) | Mapa de rutas y pantallas (mobile-routes, mobile-screens) | RF por dominio; 157 rutas del API | UI | ARQ, DEV | mobile-routes.md |
| TD3.4 | Diseño del sistema visual: tokens de diseño (color, tipografía, espaciado), tema claro/oscuro, componentes de UI | Catálogo de tokens y componentes; demo de UI | Criterios de diseño mobile-first; Material Design | UI | DEV, CLI | mobile-design-tokens.css |
| TD3.5 | Diseño de los servicios por dominio y del cliente HTTP centralizado | Especificación de servicios (src/services) y tipos (src/types) | Rutas del API; RNF-ARQ-002 | DEV | ARQ | rails-routes.txt |
| TD3.6 | Construcción de la matriz de trazabilidad requisito → ruta → pantalla → componente | Matriz de trazabilidad (cobertura 156/157 endpoints) | RF/RNF; mapa de rutas; inventario de pantallas | GEPRO | ARQ, UI | mobile-requirements.md |
| TD3.7 | Revisión y validación del diseño con los informantes clave y la tutora | Acta de validación; ajustes al diseño | Todos los artefactos de diseño de la fase | GEPRO | CLI, TUT, ARQ, UI | Guía del taller participativo |

Las actividades independientes de la fase — planificación y seguimiento del proyecto, gestión de la configuración con Git (ramas, pull requests, versionado), ejecución de las compuertas de calidad y gestión de riesgos — acompañan a la fase de diseño igual que al resto de las fases del ciclo de vida.

# Documentación del proceso según el enfoque ISO 9000:2000

Romero Mosquera (2006) documenta el proceso de desarrollo de software de la Unidad de Sistemas de Información del CIAT con miras a la certificación ISO 9000:2000, aplicando el principio del enfoque basado en procesos: identificar los procesos del sistema de gestión de la calidad, clasificarlos (dirección, producción, soporte), caracterizarlos y establecer sus interacciones, para luego definir la documentación y los registros que evidencian su cumplimiento. Por analogía, el proyecto Chepicare adopta esa estructura a su escala.

## Mapa de procesos del proyecto

| Área | Procesos |
|---|---|
| Dirección | Dirección del proyecto (tutoría PSTIII, revisiones por la dirección); Atención al cliente (relación con el consultorio, validaciones). |
| Producción | Desarrollo de software: diagnóstico y requisitos → **diseño** → construcción con TDD → pruebas de integración reales → entrega e implantación. |
| Soporte | Gestión de la configuración (Git, ramas, pull requests); Gestión de la calidad (compuertas de calidad, react-doctor, hook pre-push); Formación del equipo. |

## Caracterización del proceso de diseño

Siguiendo el formato de caracterización empleado por Romero Mosquera (2006) — encabezado, descripción del proceso y complemento — el proceso de diseño de Chepicare se caracteriza así:

| Campo | Contenido |
|---|---|
| Título | Diseño del producto de software. |
| Tipo de proceso | Producción. |
| Código / Versión | C-DS-02 / v1.0. |
| Responsable del proceso | Rol ARQ (arquitectura), con supervisión de GEPRO. |
| Alcance | Desde la especificación de requisitos validada hasta el paquete de diseño aprobado que autoriza la construcción. |
| Objetivo | Transformar los requisitos funcionales y no funcionales en una arquitectura, un modelo de datos, una navegación y un sistema visual verificables y trazables. |
| Proveedores | Proceso de diagnóstico y requisitos; clienta e informantes clave; backend API existente. |
| Entradas | Especificación de RF/RNF; catálogo de 157 rutas del API; criterios básicos de diseño; restricciones tecnológicas (Expo SDK 56, Android). |
| Subprocesos | Diseño arquitectónico (TD3.1–TD3.2); diseño de interacción e interfaz (TD3.3–TD3.4); diseño de servicios (TD3.5); trazabilidad y validación (TD3.6–TD3.7). |
| Salidas | ADR 0001; diagramas de arquitectura; mapa de rutas y pantallas; tokens y componentes de UI; especificación de servicios; matriz de trazabilidad. |
| Clientes | Proceso de construcción (equipo DEV); tutora académica; consultorio Chepicare. |
| Documentos | Plan de la calidad del proyecto; instructivos de los artefactos (formatos ADR, matriz de trazabilidad); norma de referencia ISO/IEC 25010. |
| Recursos | Equipo de desarrollo, repositorio Git, backend de referencia en ejecución, emulador Android, herramientas de diagramación. |
| Métricas | Cobertura de trazabilidad endpoint→requisito (meta ≥ 99 %; actual 156/157); porcentaje de pantallas con estados de carga/error/vacío diseñados (meta 100 %); hallazgos de react-doctor en los archivos tocados (meta 0). |
| Registros | Actas de validación con informantes clave; ADR aprobados; historial de versiones en Git; resultados de las compuertas de calidad. |
| Requisitos NTC-ISO 9001 | 7.1 Planificación de la realización del producto; 7.3 Diseño y desarrollo (7.3.1–7.3.7). |

## Procedimiento documentado: elaboración y aprobación de artefactos de diseño

Conforme al formato de procedimientos descrito por Romero Mosquera (2006), se documenta el procedimiento principal de la fase:

1. Propósito: asegurar que todo artefacto de diseño se elabore, revise y apruebe de forma controlada antes de autorizar la construcción.
2. Alcance: aplica a ADR, diagramas, mapas de rutas y pantallas, tokens de diseño, especificaciones de servicios y matrices de trazabilidad.
3. Responsabilidades: ARQ elabora los artefactos arquitectónicos y UI los de interfaz; DEV revisa la viabilidad técnica; GEPRO verifica la trazabilidad; TUT y CLI aprueban en la validación.
4. Descripción de actividades: (a) el responsable elabora el borrador del artefacto en el repositorio con estado En Proceso (P); (b) el equipo lo revisa contra los requisitos y los criterios de diseño; (c) se verifica la trazabilidad hacia los requisitos afectados; (d) se presenta en la sesión de validación con la tutora y la clienta; (e) incorporadas las correcciones, el artefacto pasa a estado Vigente (V) mediante su integración a la rama principal.
5. Registros que se generan: acta de validación, artefacto versionado en Git, entrada en la matriz de trazabilidad.
6. Referencias: plan de la calidad del proyecto; procedimiento de gestión de la configuración; ISO/IEC 25010.

## Control de documentos y registros

Todos los documentos del proyecto son controlados mediante el repositorio Git, que provee identificación única, historial de versiones, autoría, fechas y capacidad de reversión — cumpliendo la intención de los numerales 4.2.3 (control de los documentos) y 4.2.4 (control de los registros) de la norma ISO 9001:2000 descritos por Romero Mosquera (2006). Los documentos se clasifican en internos (requisitos, ADR, matrices, este plan) y externos (documentación de Expo SDK 56, normas ISO, guías de Material Design). El estado de un documento se refleja en su ubicación: borrador en rama de trabajo (En Proceso) y aprobado en la rama principal (Vigente).

# Productos de la fase de diseño

La fase de diseño produce y mantiene los siguientes artefactos verificables, todos bajo control de versiones en el repositorio del proyecto:

- **Especificación de requisitos** (mobile-requirements.md): 26 requisitos funcionales y 17 no funcionales, insumo y criterio de aceptación del diseño.
- **ADR 0001 — Arquitectura de datos móvil (offline-first híbrido)**: decisión arquitectónica central, con contexto, alternativas y consecuencias.
- **Diagramas de arquitectura** (tres capas contenerizadas, cliente-servidor, estrategia de escalamiento vertical y horizontal).
- **Mapa de rutas y pantallas** (mobile-routes.md, mobile-screens.md): navegación por dominios público, dueño y administrador.
- **Sistema visual** (mobile-design-tokens.css, mobile-ui-components.md, demo de UI): tokens de color, tipografía y espaciado con tema claro y oscuro.
- **Matriz de trazabilidad** requisito → ruta → pantalla → componente, con cobertura verificada de 156/157 endpoints.
- **Documento de diseño del proyecto** (diseno-proyecto-chepicare): criterios, estilos arquitectónicos, atributos de calidad ISO/IEC 25010 y marco legal.

# Conclusiones

La fase de diseño de Chepicare no se limita a producir artefactos técnicos: formaliza el proceso mediante el cual esos artefactos se elaboran, revisan, aprueban y mantienen. Del trabajo de Álvarez y López (2005) se adopta el instrumento del plan de la calidad adaptado a la metodología del proyecto — valores y prácticas ágiles, complementados con el registro tabular de las actividades de la fase — confirmando que el plan debe adecuarse a las características de cada situación y evolucionar con el aprendizaje del equipo. De la experiencia de Romero Mosquera (2006) se adopta el enfoque basado en procesos de la ISO 9000:2000: el mapa de procesos, la caracterización del proceso de diseño con sus entradas, salidas, métricas y registros, y el control documental — demostrando que un proyecto académico puede documentarse con un rigor análogo al exigido para una certificación, usando el propio repositorio como sistema de control de documentos.

El beneficio ya es observable: las compuertas de calidad ejecutadas antes de cada commit convierten el aseguramiento de la calidad en una actividad sistemática y no discrecional, y la matriz de trazabilidad permite auditar, en cualquier momento, que cada requisito del consultorio está cubierto por un elemento de diseño y una prueba. Al cierre del proyecto, este plan permitirá además analizar la eficacia del proceso seguido y servirá de primera aproximación a un proceso organizacional reutilizable en futuros proyectos socio tecnológicos.

# Referencias

Álvarez, A. I., y López, M. (2005). Elaboración de planes de la calidad en proyectos de software. Universidad ORT Uruguay, Laboratorio de Ingeniería de Software. SEDICI, Repositorio Institucional de la UNLP. http://sedici.unlp.edu.ar/bitstream/handle/10915/23062/Documento_completo.pdf?sequence=1

Instituto Colombiano de Normas Técnicas y Certificación. (2000). Norma Técnica Colombiana NTC-ISO 9001:2000. Sistemas de gestión de la calidad. Requisitos. ICONTEC.

International Organization for Standardization. (2011). ISO/IEC 25010: Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models. ISO.

Romero Mosquera, K. L. (2006). Documentación del proceso de desarrollo de software para la certificación ISO 9000:2000 [Pasantía de grado, Universidad Autónoma de Occidente]. Repositorio Educativo Digital UAO. https://red.uao.edu.co/handle/10614/7057
