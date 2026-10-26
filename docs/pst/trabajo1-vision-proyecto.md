# Documento Visión del Proyecto

El presente documento constituye el entregable del **Trabajo 1** del Proyecto Sociotecnológico y corresponde a la **identificación del proyecto**, desarrollada de acuerdo con las actividades prácticas de la sesión didáctica: la **elicitación** de necesidades y requisitos, la **identificación del proyecto** y su **planificación y ejecución ágil**. El proyecto identificado es **Chepicare: App móvil para atención veterinaria a domicilio**, desarrollado por participantes de la Universidad Nacional Experimental de las Telecomunicaciones e Informática (UNETI) en beneficio del Consultorio Veterinario Chepicare, ubicado en La Mora I, La Victoria, estado Aragua.

**Equipo investigador:** Miguel Figuera (C.I. 23.558.789), Iromy León (C.I. V-30.243.131) y Alejandra Herde (C.I. V-23.711.974). **Docente guía (tutora):** Yuly Delgado.

# Parte I. Identificación del Proyecto

## 1.1 Nombre del proyecto

**Chepicare: App móvil para atención veterinaria a domicilio.** Chepicare es una plataforma de gestión de relaciones con los clientes (CRM) para el consultorio veterinario Chepicare, cuyo componente central es una aplicación móvil que habilita la atención veterinaria a domicilio. El sistema digitaliza la gestión de citas (en local o a domicilio), historias clínicas, control de vacunación, comunicación con los clientes y registro de pagos, sustituyendo los procesos manuales actuales por un canal digital accesible desde el teléfono del dueño y del personal de la clínica.

## 1.2 Comunidad e institución beneficiaria

- **Institución beneficiaria:** Consultorio Veterinario Chepicare, dirigido por la Dra. Génesis Conesa.
- **Localización:** La Mora I, La Victoria, estado Aragua, Venezuela.
- **Comunidad atendida:** dueños de mascotas de la ciudad de La Victoria y zonas aledañas, de distintos grupos socioeconómicos. El consultorio participa con regularidad en campañas comunitarias de vacunación y consultas veterinarias, por lo que su alcance social trasciende a sus clientes directos.

## 1.3 Planteamiento del problema (diagnóstico situacional)

El diagnóstico participativo realizado con el consultorio evidenció que la operación se sostiene sobre procesos completamente manuales, lo que genera los siguientes problemas concretos:

- Gestión de citas manual, propensa a errores, duplicaciones y dificultades para optimizar la agenda.
- Historias clínicas en papel, con acceso lento, riesgo de extravío y dificultad para el seguimiento de enfermedades crónicas.
- Control de vacunación manual, con riesgo de olvidar fechas y refuerzos.
- Comunicación con los clientes poco proactiva (recordatorios, seguimiento).
- Coordinación y registro de resultados de laboratorio de forma manual.
- Falta de diferenciación clara entre servicios (peluquería, hospedaje, consulta) y sus costos.
- Registro de pagos manual, sin visibilidad rápida del flujo de caja.

A ello se suma que buena parte de los pacientes se beneficiaría de la **atención a domicilio**, modalidad que hoy es difícil de coordinar sin un canal digital que conecte al dueño con la agenda del consultorio.

## 1.4 Objetivo general

Desarrollar una aplicación móvil, integrada a un backend con API RESTful, que habilite la atención veterinaria a domicilio y digitalice la gestión de citas, historias clínicas, vacunación, pagos y comunicación del Consultorio Veterinario Chepicare.

## 1.5 Objetivos específicos

1. Elicitar y documentar los requisitos funcionales y no funcionales del sistema mediante un diagnóstico participativo con los informantes clave del consultorio.
2. Diseñar una arquitectura cliente-servidor de tres capas (API Rails, aplicación móvil React Native/Expo y base de datos MySQL) con seguridad por roles y operación offline-first.
3. Implementar el módulo de autenticación y gestión de sesión móvil (registro, inicio de sesión, recuperación de contraseña) para los dominios dueño y administrador.
4. Implementar la gestión de mascotas, citas (en local o a domicilio), historial médico, vacunación, pagos y recordatorios desde el dispositivo móvil.
5. Aplicar un marco de trabajo ágil (Scrum) con desarrollo guiado por pruebas (TDD) y compuertas de calidad automatizadas en cada incremento.
6. Validar cada incremento del producto con la institución beneficiaria y ajustar el backlog según su retroalimentación.

## 1.6 Justificación e importancia

La atención a domicilio, soportada por una aplicación móvil, acerca el servicio veterinario al hogar del paciente, fomenta la atención constante de las mascotas y favorece la detección temprana de enfermedades, el control de al menos dos consultas al año y los recordatorios de vacunación. El consultorio Chepicare constituye un pilar comunitario en La Victoria por sus precios accesibles y su participación en jornadas comunitarias; dotarlo de una herramienta digital sostenible multiplica su capacidad de servicio. La participación activa de la Dra. Génesis Conesa y su asistente garantiza que la herramienta resultante sea verdaderamente útil y apropiada por la institución.

## 1.7 Vinculación con los planes nacionales y el marco legal

El proyecto se vincula con el **Plan de la Patria 2025–2031** (Gaceta Oficial N.° 6.907 Extraordinario del 24 de mayo de 2025) en materia de desarrollo tecnológico al servicio de la sociedad, y se sustenta en la Constitución de la República Bolivariana de Venezuela (artículos 98, 108 y 110), la Ley Orgánica de Ciencia, Tecnología e Innovación (LOCTI), la Ley de Infogobierno (promoción de tecnologías de información libres) y la Ley de Ejercicio de la Medicina Veterinaria junto con el Código Deontológico de la Federación de Colegios de Médicos Veterinarios de Venezuela, que orientan los procesos de registro clínico del sistema. En materia de protección de datos se adoptan voluntariamente principios alineados con normativas internacionales (minimización de datos, cifrado en tránsito y en reposo, pistas de auditoría).

## 1.8 Alcance del proyecto

El dominio funcional dentro del alcance comprende: gestión de clientes (dueños) y sus mascotas; agenda integral de citas en local o a domicilio (creación, modificación, cancelación, recordatorios y confirmaciones); esquemas de vacunación; historia clínica electrónica (consultas, diagnósticos, tratamientos, vacunaciones, desparasitaciones y adjuntos); prescripción de tratamientos y récipes; solicitud de exámenes de laboratorio; registro básico de ingresos y egresos; recordatorios; servicios de atención (hospedaje, cirugía, hospitalización, grooming); y gestión de personal, roles y turnos.

**Quedan fuera del alcance:** la contabilidad financiera avanzada, el marketing y las campañas publicitarias complejas, la gestión avanzada de proveedores y compras, y la integración directa con equipos de laboratorio.

En el plano técnico, la aplicación móvil se desarrolla para Android (Expo SDK 56 / React Native, TypeScript) y consume las **157 rutas** del API documentadas para el cliente móvil, distribuidas en los dominios Público (19), Dueño (54) y Administrador (84).

## 1.9 Beneficiarios

- **Directos:** el Consultorio Veterinario Chepicare (veterinaria principal, asistente y personal) y los dueños de mascotas registrados como clientes.
- **Indirectos:** la comunidad de La Victoria beneficiada por las jornadas comunitarias y por una mayor cobertura sanitaria animal, y la comunidad académica de la UNETI, que dispone de un caso de estudio real documentado.

# Parte II. Elicitación

## 2.1 Enfoque de elicitación

La elicitación de requisitos es el proceso de descubrir, capturar y consolidar las necesidades de los interesados para transformarlas en requisitos verificables. En este proyecto se estructuró como un **diagnóstico participativo iterativo** en cinco fases: (1) preparación, con la reunión inicial, la definición de roles y la elaboración de la guía de entrevista; (2) recopilación de información; (3) análisis y documentación de requerimientos; (4) validación y ajuste con los informantes; y (5) desarrollo, implementación y evaluación continua.

## 2.2 Informantes clave

- **Dra. Génesis Conesa** — veterinaria principal y líder del consultorio. Principal fuente sobre los procesos clínicos y administrativos, prioridades y expectativas.
- **Asistente del consultorio** — informante sobre la operación diaria, la gestión de citas y el registro de información.
- **Clientes / dueños de mascotas** — usuarios finales del canal móvil; aportan las necesidades de uso de la atención a domicilio.

## 2.3 Técnicas de elicitación aplicadas

| Técnica | Aplicación en el proyecto | Producto obtenido |
|---------|---------------------------|-------------------|
| Entrevistas individuales | Sesiones con la Dra. Génesis y su asistente siguiendo la guía de entrevista. | Descripción de procesos clínicos y administrativos, prioridades. |
| Observación directa | Acompañamiento del flujo de trabajo real del consultorio. | Mapa del proceso de atención, cuellos de botella. |
| Análisis documental | Revisión de los formatos existentes de historias clínicas y hojas de citas. | Modelo de datos preliminar (mascota, consulta, vacuna, cita, pago). |
| Taller participativo | Sesión conjunta de creación de casos de uso y priorización (alta, media, baja). | Requisitos priorizados y validados por los informantes. |

## 2.4 Necesidades detectadas

Del diagnóstico se derivaron las siguientes necesidades centrales: agendar y gestionar visitas presenciales o a domicilio desde el teléfono; consultar el historial clínico de cada mascota sin depender del papel; recibir recordatorios de citas, vacunas y desparasitaciones; registrar pagos con visibilidad del flujo de caja; diferenciar servicios y costos (consulta, peluquería, hospedaje, cirugía); y permitir que el personal gestione pacientes, agenda, consultas y reportes desde el mismo dispositivo.

## 2.5 Requisitos funcionales

La especificación móvil documenta **26 requisitos funcionales** organizados por dominio, con su prioridad entre paréntesis:

- **Dominio Público (sin autenticación):** RF-PUB-01 Información de servicios clínicos (Media); RF-PUB-02 Tienda de productos y checkout (Media); RF-PUB-03 Adopción de mascotas (Media); RF-PUB-04 Patrocinios (Baja); RF-PUB-05 Contacto y contenido legal (Alta).
- **Dominio Dueño (Owner):** RF-OWN-01 Autenticación y gestión de sesión (Alta); RF-OWN-02 Registro y recuperación de contraseña (Alta); RF-OWN-03 Perfil del dueño (Alta); RF-OWN-04 Dashboard (Alta); RF-OWN-05 Gestión de mascotas (Alta); RF-OWN-06 Citas veterinarias (Alta); RF-OWN-07 Pagos (Alta); RF-OWN-08 Historial médico y consultas (Alta); RF-OWN-09 Perfil médico, vacunas y desparasitaciones (Media); RF-OWN-10 Reportes médicos y exámenes de laboratorio (Media); RF-OWN-11 Patrocinios (Baja).
- **Dominio Administrador (Admin):** RF-ADM-01 Gestión de mascotas (Alta); RF-ADM-02 Gestión de adopciones (Media); RF-ADM-03 Consultas clínicas (Alta); RF-ADM-04 Recetas y exámenes de laboratorio (Alta); RF-ADM-05 Vacunas, desparasitaciones y esquemas (Alta); RF-ADM-06 Agenda y citas (Alta); RF-ADM-07 Pagos (Alta); RF-ADM-08 Perfil médico de mascotas (Media); RF-ADM-09 Mascotas de dueños (Media); RF-ADM-10 Reportes médicos (Media).

## 2.6 Requisitos no funcionales

Los **17 requisitos no funcionales** se agrupan por categoría: arquitectura (RNF-ARQ-001 plataforma Android con Expo SDK 56; RNF-ARQ-002 cliente HTTP centralizado contra las 157 rutas), movilidad (RNF-MOB-001 mobile-first desde 320 px; RNF-MOB-002 auto-sincronización bajo consentimiento), seguridad (RNF-SEC-001 sesión y almacenamiento seguro de tokens sobre HTTPS; RNF-SEC-002 control de acceso por rol y dominio), experiencia de usuario (RNF-UX-001 táctil ≥ 48 dp, fuente ≥ 16 px, estados de carga/vacío/error; RNF-UX-002 design system con tema claro/oscuro), fiabilidad (RNF-REL-001 tolerancia a fallos; RNF-REL-002 respaldo local y recuperación; RNF-REL-003 operación offline controlada), rendimiento (RNF-PERF-001 transiciones < 1 s y paginación), archivos (RNF-ARC-001 cámara, galería y PDF), privacidad (RNF-PRI-001 mínima exposición de datos de salud animal), observabilidad (RNF-OBS-001), compatibilidad (RNF-CMP-001) y mantenibilidad (RNF-MAINT-001 trazabilidad documental).

## 2.7 Priorización, validación y trazabilidad

Los requisitos se priorizaron en el taller participativo (alta, media, baja) y se validaron en la fase 4 del diagnóstico mediante una sesión de retroalimentación con los informantes, que se mantiene viva en cada sprint. La trazabilidad se asegura con la cadena **requisito → ruta del API → pantalla → componente** y con el apéndice de cobertura endpoint→requisito: **156 de las 157 rutas** móviles están mapeadas a un requisito funcional (la única excepción es un endpoint de diagnóstico). Se mantienen además la matriz Requisito ↔ Caso de Uso ↔ Prueba y las matrices de negocio (Objetos vs. Procesos y Actores vs. Procesos).

## 2.8 Declaración de visión del producto

**Para** los dueños de mascotas de La Victoria y el personal del Consultorio Veterinario Chepicare, **que** necesitan coordinar atención veterinaria —incluida la atención a domicilio— sin depender de papel ni llamadas, **Chepicare** es una **aplicación móvil con backend en la nube** **que** permite agendar citas, consultar historias clínicas, controlar vacunas, registrar pagos y recibir recordatorios desde el teléfono, incluso sin conexión estable. **A diferencia de** la gestión manual actual y de los sistemas veterinarios genéricos de escritorio, **nuestro producto** es mobile-first, opera offline con sincronización bajo consentimiento y está construido participativamente con la institución beneficiaria.

# Parte III. Planificación y Ejecución ágil

## 3.1 Metodología

El proyecto combina el **diagnóstico participativo iterativo** (para el levantamiento y la validación continua de requisitos) con el marco ágil **Scrum** para el desarrollo del software: el trabajo se divide en sprints cortos e iterativos, con un product backlog derivado de los requisitos priorizados, reuniones de planificación y revisión por sprint, y entregas incrementales que se validan con el consultorio. El desarrollo aplica **TDD** (Test-Driven Development): se escribe primero la prueba (rojo), luego la implementación mínima (verde) y finalmente se refactoriza manteniendo las pruebas en verde.

## 3.2 Roles del equipo

| Rol Scrum | Responsable | Responsabilidades |
|-----------|-------------|-------------------|
| Product Owner | Dra. Génesis Conesa (con apoyo del equipo) | Priorización del backlog, validación de incrementos. |
| Scrum Master / tutora académica | Yuly Delgado | Acompañamiento metodológico, remoción de impedimentos. |
| Equipo de desarrollo | Miguel Figuera, Iromy León, Alejandra Herde | Análisis, diseño, implementación, pruebas y documentación. |

## 3.3 Product backlog

El product backlog se deriva directamente de los requisitos priorizados en la elicitación. Los elementos de prioridad **alta** (autenticación, gestión de mascotas, citas, historial médico, pagos y agenda administrativa) encabezan el backlog; los de prioridad **media** (adopciones, tienda, perfiles médicos, reportes) ocupan el tramo intermedio; y los de prioridad **baja** (patrocinios) cierran la lista. Cada elemento se expresa como historia de usuario (por ejemplo: "Como dueño quiero agendar una cita a domicilio para que atiendan a mi mascota sin trasladarme") con sus criterios de aceptación.

## 3.4 Ejecución por iteraciones — backend (API)

El backend se ejecutó en siete iteraciones de una a dos semanas, todas completadas y validadas:

| Iteración | Objetivo | Estado |
|-----------|----------|--------|
| 1 | Design system con modo claro/oscuro | Completada |
| 2 | Landing y páginas informativas | Completada |
| 3 | Sistema de autenticación (login, registro, recuperación) | Completada |
| 4 | Gestión de mascotas (CRUD, fotos, soft delete) | Completada |
| 5 | Panel de administración (layout, navegación) | Completada |
| 6 | Adopciones y apadrinamientos | Completada |
| 7 | Historiales médicos (consultas, vacunas, recetas, exámenes, reportes) | Completada |

## 3.5 Ejecución por sprints — aplicación móvil

Sobre el API existente, la aplicación móvil se planifica en sprints por dominio funcional, cada uno cerrado con la validación del consultorio:

| Sprint | Alcance | Requisitos cubiertos |
|--------|---------|----------------------|
| S1 | Fundaciones: cliente HTTP centralizado, selector de servidor, arquitectura local-first (caché y cola offline) | RNF-ARQ-002, RNF-REL-003, RNF-MOB-002 |
| S2 | Autenticación móvil por tokens Bearer (login, registro, recuperación, sesión segura) | RF-OWN-01, RF-OWN-02, RNF-SEC-001/002 |
| S3 | Dominio público: servicios, contacto, adopciones, tienda | RF-PUB-01…05 |
| S4 | Dueño: dashboard, mascotas, citas (local y a domicilio) | RF-OWN-04, RF-OWN-05, RF-OWN-06 |
| S5 | Dueño: historial médico, vacunas, pagos, reportes | RF-OWN-07…10 |
| S6 | Administrador: agenda, consultas, recetas, vacunación, pagos y reportes | RF-ADM-01…10 |

A la fecha de este documento están completados los sprints S1 (integración real del backend, selector de servidor y comportamiento local-first) y S2 (autenticación móvil por Bearer en rutas dedicadas, separada de la sesión web), con las listas virtualizadas y la depuración de hallazgos de calidad incorporadas como mejora transversal.

## 3.6 Definición de terminado (Definition of Done)

Un incremento se considera terminado solo cuando supera todas las compuertas de calidad automatizadas:

1. Pruebas en verde (`yarn test`), incluidas las pruebas de integración **reales** contra el backend en ejecución (sin respuestas simuladas).
2. Verificación de tipos sin errores (`yarn typecheck`, TypeScript estricto).
3. Análisis estático sin errores (`yarn lint`).
4. Auditoría de salud de React sin hallazgos en los archivos tocados (`react-doctor`).
5. Formato normalizado (`yarn format`).

Un gancho de pre-push re-ejecuta estas verificaciones y bloquea la publicación si alguna falla, garantizando que la rama principal permanezca siempre estable. Adicionalmente, ninguna pantalla visible usa datos ficticios: todo lo que se muestra proviene del API real a través de su servicio de dominio.

## 3.7 Gestión de riesgos

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|----|--------|--------------|---------|------------|
| R-001 | Vulnerabilidades en autenticación | Media | Alto | Tokens JWT de vida corta con refresco y rotación, almacenamiento seguro en el dispositivo, HTTPS. |
| R-002 | Pérdida de datos por eliminación accidental | Media | Alto | Borrado lógico (soft delete) y respaldos automáticos de base de datos. |
| R-003 | Consultas ineficientes (N+1) | Alta | Medio | Detección automática y carga anticipada de asociaciones; paginación en listas. |
| R-004 | Fallas en correos transaccionales | Media | Medio | Credenciales SMTP configurables, reintentos y registro de envíos. |
| R-005 | Conectividad intermitente en atención a domicilio | Alta | Alto | Operación offline-first: lectura de la última copia local y cola de escrituras con sincronización bajo consentimiento. |
| R-006 | Acceso no autorizado a datos médicos | Media | Alto | Verificación de propiedad en cada solicitud y control de acceso por rol y dominio. |

## 3.8 Seguimiento y criterios de éxito

El seguimiento se realiza por sprint con revisiones junto a la institución beneficiaria y control de versiones de todo el código y la documentación. Los criterios de éxito definidos son: cobertura de pruebas mayor al 80 % en el backend y pruebas de integración reales en el cliente móvil; autenticación segura verificada; interfaz utilizable con menos de dos horas de formación y tareas comunes resueltas en tres a cinco interacciones; transiciones de pantalla en menos de un segundo en red móvil; y adopción efectiva de la herramienta por el consultorio en su operación diaria.

# Referencias

Constitución de la República Bolivariana de Venezuela. (2000). Gaceta Oficial Extraordinaria N.° 5.453 del 24 de marzo de 2000.

Federación de Colegios de Médicos Veterinarios de Venezuela. (s. f.). Código Deontológico de la Medicina Veterinaria.

Ley de Ejercicio de la Medicina Veterinaria. (1968). Gaceta Oficial del 19 de septiembre de 1968.

Ley de Infogobierno. (2013). Gaceta Oficial N.° 40.274 del 17 de octubre de 2013.

Ley Orgánica de Ciencia, Tecnología e Innovación (LOCTI). (2005). Gaceta Oficial N.° 38.242 del 3 de agosto de 2005, con reformas de 2010 y 2014.

Plan de la Patria de las 7 Grandes Transformaciones 2025–2031. (2025). Ley Orgánica publicada en Gaceta Oficial N.° 6.907 Extraordinario del 24 de mayo de 2025.

Schwaber, K., y Sutherland, J. (2020). La Guía de Scrum: La guía definitiva de Scrum: las reglas del juego. Scrum.org.

Sommerville, I. (2011). Ingeniería de software (9.ª ed.). Pearson Educación.
