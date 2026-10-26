# Nombre del proyecto

**Chepicare: App móvil para atención veterinaria a domicilio.**

Chepicare es una plataforma de gestión de relaciones con los clientes (CRM) para el consultorio veterinario Chepicare, cuyo componente central es una aplicación móvil que habilita la atención veterinaria a domicilio. El sistema digitaliza y optimiza la gestión de citas (en local o a domicilio), historias clínicas, control de vacunación, comunicación con los clientes y registro de pagos, sustituyendo los procesos manuales actuales por un canal digital accesible desde el teléfono del dueño y del personal de la clínica.

# Alcance de la investigación

La investigación abarca el diseño de un sistema compuesto por un backend (API) y una aplicación móvil que sirve como canal de atención veterinaria a domicilio. La aplicación móvil permite a los dueños descubrir servicios, agendar y gestionar visitas (presenciales o a domicilio), consultar el historial clínico de sus mascotas, registrar pagos y dar seguimiento a vacunas y tratamientos; mientras que el personal autorizado gestiona pacientes, agenda, consultas y reportes desde el mismo dispositivo.

El dominio funcional considerado dentro del alcance incluye:

- Gestión de datos de clientes (dueños) y sus mascotas.
- Gestión integral de la agenda de citas, en local o a domicilio (creación, modificación, cancelación, recordatorios y confirmaciones).
- Gestión de esquemas de vacunación: recordatorios, costos y agenda.
- Gestión de la historia clínica electrónica (consultas, diagnósticos, tratamientos, vacunaciones, desparasitaciones y archivos adjuntos como exámenes).
- Prescripción de tratamientos y generación de récipes.
- Solicitud de exámenes de laboratorio.
- Registro básico de ingresos y egresos por servicios y productos vinculados a la consulta.
- Gestión de recordatorios (citas, vacunas, desparasitaciones).
- Gestión de servicios de atención (hospedaje, cirugía, hospitalización, grooming).
- Gestión de personal, roles y turnos.

Quedan fuera del alcance: la contabilidad financiera avanzada, el marketing y las campañas publicitarias complejas, la gestión avanzada de proveedores y compras, y la integración directa con equipos de laboratorio para la recepción automática de resultados.

En el plano técnico, la aplicación móvil se desarrolla para Android (Expo SDK 56 / React Native) y consume exclusivamente las 157 rutas del API documentadas para el cliente móvil, distribuidas en los dominios Público (19), Dueño/Owner (54) y Administrador/Admin (84).

# Importancia de la investigación

El consultorio Chepicare, liderado por la Dra. Génesis Conesa, ofrece servicios de consulta, hospedaje y peluquería canina a precios accesibles, y constituye un pilar comunitario al participar con regularidad en campañas de vacunación y consultas veterinarias en servicios comunitarios. Atiende a una cantidad considerable de pacientes de la ciudad de La Victoria, abarcando personas de distintos grupos socioeconómicos.

La importancia del proyecto radica en que la atención a domicilio, soportada por una aplicación móvil, acerca el servicio veterinario al hogar del paciente, fomenta la atención constante de las mascotas y favorece la detección temprana de enfermedades, el control de al menos dos consultas al año y los recordatorios de vacunación. Asimismo, resuelve problemas concretos del proceso manual actual:

- Gestión de citas manual, propensa a errores, duplicaciones y dificultades para optimizar la agenda.
- Historias clínicas en papel, con acceso lento, riesgo de extravío y dificultad para el seguimiento de enfermedades crónicas.
- Control de vacunación manual, con riesgo de olvidar fechas y refuerzos.
- Comunicación con clientes poco proactiva (recordatorios, seguimiento).
- Coordinación y registro de resultados de laboratorio de forma manual.
- Falta de diferenciación clara entre servicios (peluquería, hospedaje, consulta) y sus costos.
- Registro de pagos manual, sin visibilidad rápida del flujo de caja.

La participación activa de la Dra. Génesis y su asistente es fundamental para garantizar que la herramienta resultante sea verdaderamente útil y sostenible para la comunidad.

# Informantes claves del diseño

Los informantes clave que alimentaron el diseño mediante el diagnóstico participativo son:

- **Dra. Génesis Conesa** — veterinaria principal y líder del consultorio Chepicare. Principal fuente sobre los procesos clínicos y administrativos, prioridades y expectativas.
- **Asistente del consultorio** — informante sobre la operación diaria, la gestión de citas y el registro de información.
- **Clientes / dueños de mascotas** — usuarios finales del canal móvil; aportan las necesidades de uso de la atención a domicilio.

Su intervención se canalizó a través de entrevistas individuales, observación directa del flujo de trabajo, análisis de los documentos existentes (formatos de historias clínicas y hojas de citas) y un taller participativo de validación de requerimientos.

# Metodología de Ingeniería del software utilizada

El proyecto combina un enfoque de **diagnóstico participativo iterativo** con el marco ágil **Scrum** para el desarrollo del software.

El **diagnóstico participativo iterativo** estructura el levantamiento y la validación de requerimientos en fases que se recorren de forma incremental, con retroalimentación continua de los informantes clave:

1. **Preparación.** Reunión inicial, definición de roles y del alcance del CRM, elaboración de la guía de entrevista y de las plantillas de documentación.
2. **Recopilación de información.** Entrevistas individuales con la Dra. Génesis y su asistente, observación directa del flujo de trabajo y análisis de documentos existentes.
3. **Análisis y documentación de requerimientos.** Taller participativo, creación de casos de uso y priorización (alta, media, baja).
4. **Validación y ajuste.** Presentación de los requerimientos documentados, sesión de retroalimentación y ajuste según los comentarios.
5. **Desarrollo, implementación y evaluación.** Construcción del sistema, pruebas, capacitación, implementación y mejora continua.

Sobre esta base, el desarrollo se organiza con **Scrum**: el trabajo se divide en sprints cortos e iterativos, con un product backlog derivado de los requerimientos priorizados, reuniones de planificación y revisión por sprint, y entregas incrementales que se validan con el consultorio. Esta combinación permite incorporar la retroalimentación de los usuarios de forma temprana y frecuente, reduciendo el riesgo de construir funcionalidades que no respondan a las necesidades reales de la atención a domicilio.

# Criterios básicos del diseño

La filosofía de diseño busca un sistema robusto, mantenible y fácil de instalar y desplegar, capaz de escalar desde una implementación inicial en un único servidor hasta una arquitectura distribuida conforme crezca la demanda. Los criterios básicos que guían el diseño son:

- **Robustez y mantenibilidad.** Diseño modular que facilita actualizaciones y pruebas automatizadas.
- **Facilidad de despliegue.** Empaquetado en contenedores (Docker) para una instalación reproducible.
- **Escalabilidad.** Capacidad de crecer en usuarios y volumen de datos sin re-arquitectura.
- **Mobile-first.** La interfaz se concibe primero para el teléfono (uso a una mano, orientación vertical, áreas táctiles ≥ 48 dp, tipografía ≥ 16 px y respeto de las áreas seguras).
- **Operación offline / offline-first.** La app permite consultar la última copia local y encolar acciones de escritura cuando no hay conexión, con sincronización bajo consentimiento del usuario.
- **Seguridad por roles.** Control de acceso diferenciado para los dominios público, dueño y administrador, con almacenamiento seguro de tokens y comunicación cifrada.
- **Consistencia visual.** Uso de un sistema de tokens de diseño (colores, espaciado, tipografía, sombras) con modo claro y oscuro.

# Estilos arquitectónicos a utilizar

El sistema adopta una **arquitectura de tres capas contenerizada con Docker**, bajo un estilo **cliente-servidor**:

- **Capa de backend (servidor).** Implementada en Ruby on Rails en modo API (`api_only`), expone una **API RESTful** que entrega y recibe JSON. Internamente sigue el patrón **MVC** con la lógica de negocio encapsulada en clases de acción que devuelven un resultado explícito (**Action Pattern / Result**: `Result.success(...)` o `Result.failure(error:)`), manteniendo los controladores delgados. La autenticación es **JWT stateless**. Emplea ActiveRecord como ORM y ActiveStorage para archivos multimedia, además de borrado lógico (soft delete) y relaciones polimórficas.
- **Capa de cliente móvil.** Aplicación React Native (Expo SDK 56, TypeScript) organizada **por capas**: navegación → pantallas (orquestación) → componentes de UI → servicios (cliente HTTP) → hooks (lógica reutilizable) → tipos y tema. Es un cliente que consume la API por HTTPS y mantiene una cola local para la operación offline.
- **Capa de persistencia.** Base de datos relacional **MySQL** normalizada, con respaldos automáticos y volúmenes persistentes para multimedia.

La estrategia de escalamiento contempla una primera fase de escalamiento vertical (incremento de recursos del servidor e introducción de caché) y una segunda fase de escalamiento horizontal (CDN, balanceador de carga, flotas de servidores de frontend y backend, y base de datos en modo primario-réplica).

# Trazabilidad del diseño

La trazabilidad asegura que cada necesidad quede cubierta por un artefacto de diseño y prueba, evitando requisitos huérfanos. Se mantienen los siguientes instrumentos:

- **Cadena requisito → ruta → pantalla → componente.** Cada requisito funcional se vincula con las rutas del API que lo implementan, las pantallas que lo presentan y los componentes de UI que lo construyen (criterio de mantenibilidad RNF-MAINT-001).
- **Apéndice de cobertura endpoint → requisito.** Las 157 rutas móviles se mapean a su requisito funcional; la cobertura es de **156 de 157** endpoints, con un único endpoint sin requisito (`GET /auth/debug`, de diagnóstico).
- **Matriz Requisito ↔ Caso de Uso ↔ Prueba.** Garantiza que todos los RF/RNF estén cubiertos por casos de uso y pruebas de aceptación.
- **Matrices de negocio.** Matriz Objetos vs. Procesos (CRUD) y matriz Actores/Unidades vs. Procesos (RACI) para ubicar responsabilidades.

Los documentos de requisitos y matrices se mantienen bajo control de versiones, lo que permite auditoría completa y reversión.

# Atributos del diseño

Los atributos de calidad que orientan el diseño se alinean con el modelo **ISO/IEC 25010**:

- **Usabilidad.** Facilidad de aprendizaje (menos de 2 horas de formación), eficiencia (tareas comunes en 3–5 interacciones), satisfacción del usuario y prevención y recuperación de errores.
- **Rendimiento.** Transiciones entre pantallas en menos de 1 segundo en conexión normal; tiempos de respuesta acotados para cargar historiales, guardar entradas y buscar pacientes.
- **Escalabilidad.** Soporte de crecimiento de usuarios y datos sin re-arquitectura.
- **Disponibilidad y fiabilidad.** Alta disponibilidad en horario operativo, integridad de datos con transacciones atómicas, objetivos de respaldo y recuperación (RPO/RTO) y tolerancia a fallos con preservación de los datos del usuario.
- **Seguridad.** Control de acceso por roles, cifrado en tránsito y en reposo, pistas de auditoría y validación de entradas (prevención de inyección SQL y XSS).
- **Mantenibilidad y compatibilidad.** Modularidad, testeabilidad, compatibilidad con las versiones de Android soportadas por Expo SDK 56 y exportación de datos.

# Requisitos funcionales

Los requisitos funcionales se documentan en `docs/mobile-requirements.md` y suman **26 requisitos** organizados por dominio.

## Dominio Público (sin autenticación)

- **RF-PUB-01** — Información de servicios clínicos (Media).
- **RF-PUB-02** — Tienda de productos y checkout (Media).
- **RF-PUB-03** — Adopción de mascotas (Media).
- **RF-PUB-04** — Patrocinios, acceso público (Baja).
- **RF-PUB-05** — Contacto y contenido legal (Alta).

## Dominio Dueño (Owner)

- **RF-OWN-01** — Autenticación y gestión de sesión (Alta).
- **RF-OWN-02** — Registro de dueño y recuperación de contraseña (Alta).
- **RF-OWN-03** — Perfil del dueño (Alta).
- **RF-OWN-04** — Dashboard del dueño (Alta).
- **RF-OWN-05** — Gestión de mascotas (Alta).
- **RF-OWN-06** — Citas veterinarias (Alta).
- **RF-OWN-07** — Pagos del dueño (Alta).
- **RF-OWN-08** — Historial médico, consultas y resumen (Alta).
- **RF-OWN-09** — Perfil médico, vacunas y desparasitaciones (Media).
- **RF-OWN-10** — Reportes médicos y exámenes de laboratorio (Media).
- **RF-OWN-11** — Patrocinios del dueño (Baja).

## Dominio Administrador (Admin)

- **RF-ADM-01** — Gestión de mascotas (Alta).
- **RF-ADM-02** — Gestión de adopciones (Media).
- **RF-ADM-03** — Consultas clínicas (Alta).
- **RF-ADM-04** — Recetas y exámenes de laboratorio (Alta).
- **RF-ADM-05** — Vacunas, desparasitaciones y esquemas (Alta).
- **RF-ADM-06** — Agenda y citas (Alta).
- **RF-ADM-07** — Pagos (Alta).
- **RF-ADM-08** — Perfil médico de mascotas (Media).
- **RF-ADM-09** — Mascotas de dueños (Media).
- **RF-ADM-10** — Reportes médicos (Media).

# Requisitos no funcionales

Los 17 requisitos no funcionales, también documentados en `docs/mobile-requirements.md`, se agrupan por categoría:

- **RNF-ARQ-001** — Plataforma móvil Android (Expo SDK 56, React Native, TypeScript).
- **RNF-ARQ-002** — Integración con API mediante un cliente HTTP centralizado (157 rutas).
- **RNF-MOB-001** — Mobile First desde 320 px de ancho lógico.
- **RNF-MOB-002** — Auto-sincronización bajo consentimiento del usuario (WiFi o datos).
- **RNF-SEC-001** — Seguridad de sesión y almacenamiento seguro de tokens (HTTPS).
- **RNF-SEC-002** — Control de acceso por rol y dominio (público, dueño, admin).
- **RNF-UX-001** — Experiencia de usuario móvil (táctil 48 dp, fuente ≥ 16 px, estados de carga/vacío/error).
- **RNF-UX-002** — Design system y tema claro/oscuro.
- **RNF-REL-001** — Tolerancia a fallos con preservación de datos.
- **RNF-REL-002** — Copia de seguridad local y recuperación (RPO/RTO).
- **RNF-REL-003** — Operación offline controlada.
- **RNF-PERF-001** — Rendimiento en red móvil (transiciones < 1 s, paginación).
- **RNF-ARC-001** — Manejo de archivos y multimedia (cámara, galería, PDF).
- **RNF-PRI-001** — Privacidad y datos de salud animal (mínima exposición).
- **RNF-OBS-001** — Observabilidad y registro de errores.
- **RNF-CMP-001** — Compatibilidad de dispositivos Android.
- **RNF-MAINT-001** — Mantenibilidad y trazabilidad documental.

# Estándares de calidad empleados

El proyecto no persigue una certificación formal, pero se alinea con estándares y buenas prácticas reconocidas:

- **ISO/IEC 25010** — modelo de calidad del producto de software, marco de los atributos de calidad descritos.
- **IEEE 830** — estilo de especificación de requisitos de software (organización de RF y RNF).
- **Material Design** — guías de interacción y áreas táctiles (48 dp) para la interfaz Android.
- **HTTPS / TLS 1.2–1.3** — cifrado del transporte, con Perfect Forward Secrecy y certificados Let's Encrypt.
- **Política de contraseñas** — longitud mínima, combinación de mayúsculas, minúsculas y números, y bloqueo tras intentos fallidos.
- **Normas APA (7.ª edición)** — formato de la documentación del proyecto.
- **Convenciones de Rails y ActiveRecord** — integridad de datos, validaciones a nivel de modelo y auditoría de cambios.

# Marco legal

El marco legal que sustenta el proyecto se compone de las siguientes normativas venezolanas:

- **Constitución de la República Bolivariana de Venezuela (1999),** Gaceta Oficial Extraordinaria N.° 5.453 del 24 de marzo de 2000. Artículo 110 (interés público de la ciencia, la tecnología y la innovación), Artículo 108 (incorporación de nuevas tecnologías en los centros educativos) y Artículo 98 (libertad de creación y divulgación científica, que respalda la publicación como software de código abierto).
- **Ley Orgánica de Ciencia, Tecnología e Innovación (LOCTI),** Gaceta Oficial N.° 38.242 del 3 de agosto de 2005 (reformas de 2010 y 2014). Artículos 1 y 2: generación de ciencia y tecnología al servicio de la soberanía nacional y declaratoria de interés público de estas actividades.
- **Ley de Infogobierno,** Gaceta Oficial N.° 40.274 del 17 de octubre de 2013. Artículos 1 y 34: promoción de las tecnologías de información libres y del conocimiento abierto, principios que inspiran la filosofía de código abierto del proyecto.
- **Ley de Ejercicio de la Medicina Veterinaria,** Gaceta Oficial del 19 de septiembre de 1968. Artículos 1 y 2: el ejercicio de la profesión se rige por la ley y las normas de ética del Colegio de Médicos Veterinarios, lo que orienta los procesos de registro clínico del sistema.
- **Código Deontológico de la Medicina Veterinaria,** emitido por la Federación de Colegios de Médicos Veterinarios de Venezuela (FCMVV).
- **Plan de la Patria 2025–2031** (Ley Orgánica, Gaceta Oficial N.° 6.907 Extraordinario del 24 de mayo de 2025) y **Plan de la Patria 2019–2025** (Gaceta Oficial Extraordinaria N.° 6.442 del 3 de abril de 2019), con los que el proyecto se vincula en materia de desarrollo tecnológico al servicio de la sociedad.

En materia de protección de datos, el diseño adopta de forma voluntaria principios alineados con normativas internacionales (LGPD/GDPR), como la minimización de la exposición de datos, el cifrado en tránsito y en reposo, y las pistas de auditoría.

# Participantes investigadores y Organizaciones

**Equipo investigador (autores):**

- Miguel Figuera — C.I: 23.558.789.
- Iromy León — C.I: V-30.243.131.
- Alejandra Herde — C.I: V-23.711.974.

**Tutor:** Yuly Delgado.

**Organizaciones:**

- **Universidad Nacional Experimental de las Telecomunicaciones e Informática (UNETI)** — institución académica que enmarca el Proyecto Socio Tecnológico.
- **Consultorio Veterinario Chepicare** — institución beneficiaria, dirigida por la Dra. Génesis Conesa (La Mora I, La Victoria, estado Aragua).
- **Colegio de Médicos Veterinarios del estado Aragua** — ente gremial de referencia normativa.
- **Comunidad de software libre de Ruby on Rails** — ecosistema técnico de soporte.

# Comentarios

El presente documento se centra en el diseño del **backend (API)** y de la **aplicación móvil Android** que habilita la atención veterinaria a domicilio; se excluye expresamente el cliente web. Los requisitos funcionales y no funcionales provienen de la especificación móvil (`docs/mobile-requirements.md`), que cubre 157 rutas del API con una trazabilidad verificada de 156/157 endpoints hacia algún requisito. El diseño prioriza la operación offline y la sincronización bajo consentimiento, por ser determinantes para un servicio que ocurre fuera de la clínica.

# Observaciones

- La validación final de requerimientos con el consultorio (Fase 4 del diagnóstico participativo) debe mantenerse viva en cada sprint para incorporar ajustes.
- Existe una diferencia de versiones del backend entre fuentes (Rails 7 en modo API y Rails 8); debe unificarse al iniciar la implementación.
- El escalamiento horizontal (CDN, balanceador, réplica de base de datos) se plantea como trabajo futuro, una vez superada la capacidad de la fase de escalamiento vertical.
- La marca del proyecto es **Chepicare**; cualquier referencia heredada a nombres anteriores debe normalizarse.

# Referencias

Constitución de la República Bolivariana de Venezuela. (2000). Gaceta Oficial Extraordinaria N.° 5.453 del 24 de marzo de 2000.

Federación de Colegios de Médicos Veterinarios de Venezuela. (s. f.). Código Deontológico de la Medicina Veterinaria.

Ley de Ejercicio de la Medicina Veterinaria. (1968). Gaceta Oficial del 19 de septiembre de 1968.

Ley de Infogobierno. (2013). Gaceta Oficial N.° 40.274 del 17 de octubre de 2013.

Ley Orgánica de Ciencia, Tecnología e Innovación (LOCTI). (2005). Gaceta Oficial N.° 38.242 del 3 de agosto de 2005, con reformas de 2010 y 2014.

Plan de la Patria 2019–2025. Tercer Plan Socialista de Desarrollo Económico y Social de la Nación. (2019). Gaceta Oficial Extraordinaria N.° 6.442 del 3 de abril de 2019.

Plan de la Patria de las 7 Grandes Transformaciones 2025–2031. (2025). Ley Orgánica publicada en Gaceta Oficial N.° 6.907 Extraordinario del 24 de mayo de 2025.
