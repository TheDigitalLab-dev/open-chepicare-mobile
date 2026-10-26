# ChepiCare Mobile — Requisitos funcionales y no funcionales

> Basado en [mobile-routes.md](./mobile-routes.md) · 157 rutas API · App movil **Android** (Expo / React Native)

**Alcance de plataforma:** solo **Android**. Sin soporte para iOS.

**Convenciones**

| Tipo | Formato |
|------|---------|
| **RF-** (funcionales) | Descripcion · Prioridad · Justificacion · Criterios de aceptacion |
| **RNF-** (no funcionales) | `RNF-{Categoria}-{NNN}: Titulo` + enunciado directo (ver Parte 2) |

Prioridades RF: **Alta** (MVP / legal) · **Media** (operacion completa) · **Baja** (mejora o alcance secundario)

---

## Parte 1 — Requisitos funcionales

### RF-PUB-01 — Informacion de servicios clinicos

**Descripcion**  
La app debe mostrar el catalogo de servicios veterinarios ofrecidos por la clinica, consumiendo la informacion publica del backend, sin requerir autenticacion.

**Prioridad**  
Media

**Justificacion**  
Permite al usuario descubrir la oferta antes de registrarse o agendar una cita. Rutas: `GET /services`, `GET /pages/services`.

**Criterios de aceptacion**

- El usuario puede abrir la pantalla de servicios sin iniciar sesion.
- Se listan los servicios retornados por `GET /services` con nombre, descripcion y precio cuando el API los provea.
- Ante error de red o respuesta vacia se muestra un estado vacio o mensaje de error comprensible.
- Existe un acceso claro hacia registro, login o agendamiento de cita desde servicios.

---

### RF-PUB-02 — Tienda de productos y checkout

**Descripcion**  
La app debe permitir consultar productos, ver detalle, crear un pedido y subir comprobante de pago, como flujo publico de compra.

**Prioridad**  
Media

**Justificacion**  
Habilita venta de insumos desde el movil. Rutas: `GET /pages/products`, `GET /public/products`, `GET /public/products/:id`, `GET /pages/checkout`, `POST /public/product_orders`, `POST /public/product_orders/:id/upload_proof`.

**Criterios de aceptacion**

- El usuario puede listar productos via `GET /public/products`.
- El usuario puede ver detalle de un producto via `GET /public/products/:id`.
- El checkout muestra resumen del pedido antes de confirmar.
- Al confirmar, la app envia `POST /public/product_orders` con los datos requeridos por el API.
- Tras crear el pedido, el usuario puede adjuntar comprobante con `POST /public/product_orders/:id/upload_proof` (imagen o archivo segun soporte del backend).
- Se muestran mensajes de exito o error segun la respuesta del servidor.
- El stock o indisponibilidad del producto se refleja en UI cuando el API lo indique.

---

### RF-PUB-03 — Adopcion de mascotas

**Descripcion**  
La app debe exponer el programa de adopcion: landing informativo, listado de mascotas disponibles y ficha de detalle.

**Prioridad**  
Media

**Justificacion**  
Canal publico para promover adopciones responsables. Rutas: `GET /adoption`, `GET /adoption/pets`, `GET /adoption/pets/:id`.

**Criterios de aceptacion**

- La landing de adopcion (`GET /adoption`) muestra informacion general y enlace al listado.
- El listado (`GET /adoption/pets`) muestra mascotas disponibles con datos basicos (nombre, especie, edad, estado).
- El detalle (`GET /adoption/pets/:id`) muestra ficha completa, requisitos y accion de contacto o solicitud segun defina el API.
- Solo se muestran mascotas retornadas por el backend; no hay datos hardcodeados de produccion.

---

### RF-PUB-04 — Patrocinios (acceso publico)

**Descripcion**  
La app debe permitir consultar campanas de patrocinio, ver detalle, gastos asociados y crear o actualizar un patrocinio desde el dominio publico.

**Prioridad**  
Baja

**Justificacion**  
Canal de donaciones y transparencia de gastos. Rutas: `GET /sponsorships`, `GET /sponsorships/:id`, `GET /sponsorships/:id/expenses/:expense_id`, `POST /sponsorships`, `PATCH /sponsorships/:id`, `PUT /sponsorships/:id`.

**Criterios de aceptacion**

- El usuario puede listar patrocinios activos via `GET /sponsorships`.
- El detalle muestra meta, progreso e historial cuando el API lo incluya.
- El usuario puede abrir un gasto especifico via `GET /sponsorships/:id/expenses/:expense_id`.
- El formulario de alta envia `POST /sponsorships` con validacion de campos obligatorios.
- La edicion envia `PATCH` o `PUT` a `/sponsorships/:id` y refleja cambios en pantalla.

---

### RF-PUB-05 — Contacto y contenido legal

**Descripcion**  
La app debe mostrar paginas de contacto, terminos de uso y politica de privacidad como contenido informativo publico.

**Prioridad**  
Alta

**Justificacion**  
Requisito legal y de confianza para usuarios de la app. Rutas: `GET /pages/contact`, `GET /pages/terms`, `GET /pages/privacy`.

**Criterios de aceptacion**

- Las tres pantallas son accesibles sin autenticacion.
- El contenido se obtiene del backend o se renderiza segun respuesta de las rutas `pages#*`.
- Contacto muestra medios oficiales de la clinica (telefono, email, direccion) cuando el API los provea.
- Terminos y privacidad son legibles en movil (scroll, tipografia adecuada).
- Enlaces a terminos y privacidad estan disponibles desde registro y checkout.

---

### RF-OWN-01 — Autenticacion y gestion de sesion

**Descripcion**  
La app debe permitir login, logout, consulta del usuario autenticado y renovacion silenciosa de sesion mediante tokens.

**Prioridad**  
Alta

**Justificacion**  
Base de todo el dominio Owner y Admin. Rutas: `GET /auth`, `POST /auth/login`, `DELETE /auth/logout`, `GET /auth/current_user`, `POST /auth/refresh`.

**Criterios de aceptacion**

- La pantalla de bienvenida (`GET /auth`) ofrece acceso a login y registro.
- Login envia credenciales a `POST /auth/login` y persiste el token de forma segura en el dispositivo.
- Tras login exitoso, la app navega al dashboard o pantalla principal del rol correspondiente.
- `GET /auth/current_user` se usa al iniciar la app para restaurar sesion valida.
- `POST /auth/refresh` se invoca antes de expiracion o ante 401 recuperable, sin interrumpir al usuario innecesariamente.
- Logout (`DELETE /auth/logout`) invalida sesion local y remota, y redirige a pantalla publica o auth.
- Credenciales invalidas muestran error claro sin revelar si el email existe.

---

### RF-OWN-02 — Registro de dueno y recuperacion de contrasena

**Descripcion**  
La app debe permitir registrar un dueno de mascota y completar el flujo de olvido y restablecimiento de contrasena.

**Prioridad**  
Alta

**Justificacion**  
Onboarding de nuevos usuarios y recuperacion de acceso. Rutas: `POST /auth/register_owner`, `POST /auth/forgot_password`, `GET /auth/reset_password/:token`, `POST /auth/reset_password`.

**Criterios de aceptacion**

- El formulario de registro envia `POST /auth/register_owner` con validacion client-side de email, password y campos obligatorios.
- Tras registro exitoso, el usuario puede iniciar sesion o queda autenticado segun respuesta del API.
- "Olvide mi contrasena" envia email via `POST /auth/forgot_password` y confirma la accion en UI.
- El deep link o ruta con token abre pantalla de nueva contrasena (`GET /auth/reset_password/:token`).
- Restablecer contrasena envia `POST /auth/reset_password` y maneja token invalido o expirado.
- Passwords cumplen reglas minimas indicadas por el backend.

---

### RF-OWN-03 — Perfil del dueno

**Descripcion**  
El dueno autenticado debe poder ver, editar su perfil, cambiar contrasena y eliminar su cuenta.

**Prioridad**  
Alta

**Justificacion**  
Autogestion de datos personales y cumplimiento de derechos del usuario. Rutas: `GET /profile`, `PATCH /profile`, `PATCH /profile/password`, `DELETE /profile`.

**Criterios de aceptacion**

- `GET /profile` muestra datos actuales del usuario autenticado.
- Edicion envia `PATCH /profile` y actualiza la UI con la respuesta del servidor.
- Cambio de contrasena usa `PATCH /profile/password` pidiendo contrasena actual y nueva.
- Eliminar cuenta requiere confirmacion explicita antes de `DELETE /profile`.
- Tras eliminar cuenta, la sesion se cierra y no quedan tokens locales.

---

### RF-OWN-04 — Dashboard del dueno

**Descripcion**  
La app debe presentar un resumen del estado del dueno: citas proximas, pagos, alertas medicas y accesos rapidos.

**Prioridad**  
Alta

**Justificacion**  
Punto de entrada principal post-login. Rutas: `GET /dashboard`, `GET /dashboard-summary`.

**Criterios de aceptacion**

- El dashboard consume `GET /dashboard` y/o `GET /dashboard-summary`.
- Muestra al menos: proxima cita, cantidad de mascotas y pagos pendientes cuando el API los incluya.
- Los accesos rapidos navegan a mascotas, citas, historial medico y pagos.
- El dashboard solo es accesible con sesion de dueno valida.
- Ante fallo del API se muestra estado de error con opcion de reintentar.

---

### RF-OWN-05 — Gestion de mascotas (dueno)

**Descripcion**  
El dueno debe poder listar, crear, editar, eliminar sus mascotas y gestionar la foto de perfil de cada una.

**Prioridad**  
Alta

**Justificacion**  
Entidad central del ecosistema ChepiCare. Rutas: `GET /my-pets`, `GET /pets`, `GET /pets/:id`, `GET /pets/new`, `GET /pets/:id/edit`, `POST /pets`, `PATCH /pets/:id`, `PUT /pets/:id`, `DELETE /pets/:id`, `POST /pets/:id/photo`, `DELETE /pets/:id/photo`.

**Criterios de aceptacion**

- Listado disponible via `GET /my-pets` o `GET /pets` con datos consistentes.
- Creacion usa `POST /pets` con campos obligatorios validados.
- Edicion usa `PATCH` o `PUT` en `/pets/:id`.
- Eliminacion usa `DELETE /pets/:id` con dialogo de confirmacion.
- Subida de foto usa `POST /pets/:id/photo` desde camara o galeria.
- Eliminar foto usa `DELETE /pets/:id/photo`.
- El dueno solo ve y modifica sus propias mascotas (errores 403/404 manejados en UI).
- Desde el detalle se accede a historial medico y agendamiento de citas.

---

### RF-OWN-06 — Citas veterinarias (dueno)

**Descripcion**  
El dueno debe poder listar citas, ver detalle, agendar, editar, confirmar y cancelar citas usando disponibilidad de veterinarios y dias.

**Prioridad**  
Alta

**Justificacion**  
Funcionalidad core de la clinica movil. Rutas: `GET /my-appointments`, `GET /owner-appointments-list`, `GET /owner-appointments/:id`, `POST /owner-appointments`, `PATCH /owner-appointments/:id`, `POST /owner-appointments/:id/confirm`, `POST /owner-appointments/:id/cancel`, `GET /owner-available-vets`, `GET /owner-available-days`.

**Criterios de aceptacion**

- Listado de citas via `GET /owner-appointments-list` o hub `GET /my-appointments`.
- Detalle via `GET /owner-appointments/:id` con estado, mascota, veterinario y fecha/hora.
- Agendar envia `POST /owner-appointments` tras seleccionar mascota, vet (`GET /owner-available-vets`) y dia/hora (`GET /owner-available-days`).
- Edicion envia `PATCH /owner-appointments/:id` respetando reglas del backend.
- Confirmar asistencia usa `POST /owner-appointments/:id/confirm`.
- Cancelar usa `POST /owner-appointments/:id/cancel` con confirmacion previa.
- Las citas pasadas y proximas son distinguibles en la UI.
- No se permiten slots no disponibles retornados por el API.

---

### RF-OWN-07 — Pagos del dueno

**Descripcion**  
El dueno debe consultar sus pagos pendientes o realizados y registrar comprobante de pago.

**Prioridad**  
Alta

**Justificacion**  
Cierra el ciclo de servicios facturables. Rutas: `GET /my-payments`, `GET /owner-payments-list`, `POST /owner-payments/:id/register`.

**Criterios de aceptacion**

- Listado via `GET /owner-payments-list` o hub `GET /my-payments`.
- Cada pago muestra monto, concepto, estado y fecha de vencimiento si aplica.
- Registrar pago envia `POST /owner-payments/:id/register` con datos y comprobante requeridos.
- Tras registro exitoso, el estado del pago se actualiza en listado y detalle.
- Pagos ajenos al usuario autenticado no son accesibles.

---

### RF-OWN-08 — Historial medico, consultas y resumen

**Descripcion**  
El dueno debe consultar el historial medico global y por mascota, ver consultas, exportar recetas y marcar tratamientos completados.

**Prioridad**  
Alta

**Justificacion**  
Transparencia clinica y continuidad del cuidado. Rutas: `GET /my-medical-history`, `GET /my-pets/:pet_id/medical-history`, `GET /owner-medical-summary`, `GET /pets/:pet_id/consultations`, `GET /owner/consultations/:id/export_recipe`, `POST /owner/consultations/:id/complete_treatment`.

**Criterios de aceptacion**

- Hub de historial via `GET /my-medical-history` y resumen via `GET /owner-medical-summary`.
- Historial por mascota via `GET /my-pets/:pet_id/medical-history`.
- Listado de consultas via `GET /pets/:pet_id/consultations`.
- Exportar receta dispara `GET /owner/consultations/:id/export_recipe` y permite abrir o compartir el archivo resultante.
- Completar tratamiento envia `POST /owner/consultations/:id/complete_treatment` con confirmacion en UI.
- Solo se muestran registros de mascotas del dueno autenticado.

---

### RF-OWN-09 — Perfil medico, vacunas y desparasitaciones

**Descripcion**  
El dueno debe consultar el perfil medico base de su mascota, el historial de vacunas y desparasitaciones.

**Prioridad**  
Media

**Justificacion**  
Informacion preventiva de salud animal. Rutas: `GET /pets/:pet_id/medical_profile`, `GET /pets/:pet_id/vaccinations`, `GET /pets/:pet_id/dewormings`.

**Criterios de aceptacion**

- Perfil medico visible via `GET /pets/:pet_id/medical_profile` (alergias, peso, notas segun API).
- Vacunas listadas via `GET /pets/:pet_id/vaccinations` con fechas y tipo.
- Desparasitaciones listadas via `GET /pets/:pet_id/dewormings`.
- La UI indica proximas dosis o vencimientos cuando el backend los calcule.

---

### RF-OWN-10 — Reportes medicos y examenes de laboratorio (dueno)

**Descripcion**  
El dueno debe consultar reportes medicos en PDF, subir archivos de laboratorio y consultar resultados cuando el flujo lo permita.

**Prioridad**  
Media

**Justificacion**  
Acceso documental y participacion en estudios clinicos. Rutas: `GET /pets/:pet_id/medical_reports`, `GET /pets/:pet_id/medical_reports/:id`, `GET /pets/:pet_id/medical_reports/:id/download_pdf`, `POST /owner/lab_exams/:id/files`, `PATCH /owner/lab_exams/:id/results`.

**Criterios de aceptacion**

- Listado de reportes via `GET /pets/:pet_id/medical_reports`.
- Detalle via `GET /pets/:pet_id/medical_reports/:id`.
- Descarga PDF via `GET /pets/:pet_id/medical_reports/:id/download_pdf` con apertura en visor o app externa.
- Subida de archivos de lab via `POST /owner/lab_exams/:id/files`.
- Actualizacion de resultados via `PATCH /owner/lab_exams/:id/results` cuando corresponda al rol dueno.
- Archivos adjuntos muestran progreso de carga y errores de tamano o formato.

---

### RF-OWN-11 — Patrocinios del dueno

**Descripcion**  
El dueno autenticado debe ver el listado de sus patrocinios activos desde su area personal.

**Prioridad**  
Baja

**Justificacion**  
Continuidad del flujo de donaciones en sesion autenticada. Ruta: `GET /my-sponsorships`.

**Criterios de aceptacion**

- Pantalla accesible desde dashboard o menu del dueno.
- Consume `GET /my-sponsorships` y lista solo patrocinios del usuario.
- Desde cada item se navega al detalle reutilizando RF-PUB-04.

---

### RF-ADM-01 — Gestion de mascotas (administrador)

**Descripcion**  
El staff autorizado debe listar, crear, editar, eliminar mascotas clinicas y gestionar sus fotos desde el panel admin movil.

**Prioridad**  
Alta

**Justificacion**  
Operacion diaria de la clinica. Rutas: `GET /admin/pets-list`, `GET /admin/pets/:id`, `POST /admin/pets`, `PATCH /admin/pets/:id`, `PUT /admin/pets/:id`, `DELETE /admin/pets/:id`, `POST /admin/pets/:id/photo`, `DELETE /admin/pets/:id/photo`.

**Criterios de aceptacion**

- Listado con busqueda via `GET /admin/pets-list`.
- CRUD completo sobre `/admin/pets` segun permisos del rol.
- Gestion de foto via POST/DELETE en `/admin/pets/:id/photo`.
- Solo usuarios admin autenticados acceden a estas pantallas.
- Acciones destructivas requieren confirmacion.

---

### RF-ADM-02 — Gestion de adopciones (administrador)

**Descripcion**  
El staff debe listar solicitudes o registros de adopcion, ver detalle y crear nuevos registros de adopcion.

**Prioridad**  
Media

**Justificacion**  
Gestion interna del programa de adopcion. Rutas: `GET /admin/adoptions-list`, `GET /admin/adoptions/:id`, `POST /admin/adoptions`.

**Criterios de aceptacion**

- Listado via `GET /admin/adoptions-list`.
- Detalle via `GET /admin/adoptions/:id`.
- Alta via `POST /admin/adoptions` con validacion de campos.
- Estados de adopcion se muestran segun respuesta del API.

---

### RF-ADM-03 — Consultas clinicas (administrador)

**Descripcion**  
El staff debe gestionar consultas: listar, crear, editar, eliminar, exportar receta y completar tratamientos.

**Prioridad**  
Alta

**Justificacion**  
Nucleo del trabajo veterinario en la app. Rutas: `GET /admin/consultations-list`, `GET /admin/consultations/:id`, `POST /admin/consultations`, `PATCH /admin/consultations/:id`, `PUT /admin/consultations/:id`, `DELETE /admin/consultations/:id`, `GET /admin/consultations/:id/export_recipe`, `POST /admin/consultations/:id/complete_treatment`.

**Criterios de aceptacion**

- Listado filtrable via `GET /admin/consultations-list`.
- Formulario de consulta envia POST o PATCH segun creacion o edicion.
- Detalle muestra notas clinicas, mascota, veterinario y estado.
- Exportar receta via `GET /admin/consultations/:id/export_recipe`.
- Completar tratamiento via `POST /admin/consultations/:id/complete_treatment`.
- Eliminar consulta via DELETE con confirmacion.

---

### RF-ADM-04 — Recetas y examenes de laboratorio (administrador)

**Descripcion**  
Dentro de una consulta, el staff debe gestionar prescripciones y examenes de laboratorio, incluyendo archivos adjuntos.

**Prioridad**  
Alta

**Justificacion**  
Documentacion clinica completa en consulta. Rutas prescriptions y lab_exams bajo `/admin/consultations/:consultation_id/`.

**Criterios de aceptacion**

- Listar, crear, editar y eliminar prescripciones via endpoints `/admin/consultations/:consultation_id/prescriptions`.
- Listar, crear, editar y eliminar examenes via `/admin/consultations/:consultation_id/lab_exams`.
- Subir archivos via `POST .../lab_exams/:id/files`.
- Eliminar archivo via `DELETE .../lab_exams/:id/files/:file_id`.
- Cambios en receta/lab se reflejan al volver al detalle de consulta.

---

### RF-ADM-05 — Vacunas, desparasitaciones y esquemas

**Descripcion**  
El staff debe administrar registros de vacunacion, desparasitacion y esquemas programados, incluyendo marcar items completados.

**Prioridad**  
Alta

**Justificacion**  
Control preventivo de salud animal. Rutas: `/admin/vaccinations-*`, `/admin/dewormings-*`, `/admin/vaccination-schedules-*`, `POST /admin/vaccination_schedules/:id/complete_item`.

**Criterios de aceptacion**

- CRUD de vacunas via endpoints `/admin/vaccinations` y listado `-list`.
- CRUD de desparasitaciones via endpoints `/admin/dewormings`.
- CRUD de esquemas via `/admin/vaccination_schedules`.
- Completar item de esquema via `POST /admin/vaccination_schedules/:id/complete_item`.
- Listados muestran mascota asociada y fechas relevantes.

---

### RF-ADM-06 — Agenda y citas (administrador)

**Descripcion**  
El staff debe gestionar la agenda: listar citas, crear y editar citas usando disponibilidad de veterinarios, dias y franjas horarias.

**Prioridad**  
Alta

**Justificacion**  
Coordinacion operativa de la clinica. Rutas: `GET /admin/appointments-list`, `GET /admin/appointments/:id`, `GET /admin/appointments/available-days`, `GET /admin/appointments/available-vets`, `GET /admin/appointments/time-slots`, `POST /admin/appointments`, `PATCH /admin/appointments/:id`, `PUT /admin/appointments/:id`, `DELETE /admin/appointments/:id`.

**Criterios de aceptacion**

- Listado/calendario via `GET /admin/appointments-list`.
- Creacion usa vets, dias y slots de los endpoints de disponibilidad antes de `POST /admin/appointments`.
- Edicion y cancelacion via PATCH/PUT/DELETE en `/admin/appointments/:id`.
- Detalle muestra dueno, mascota, servicio y sala si aplica.
- Conflictos de horario retornados por el API se muestran al usuario.

---

### RF-ADM-07 — Pagos (administrador)

**Descripcion**  
El staff debe listar pagos, ver detalle, registrar pagos recibidos y actualizar su estado.

**Prioridad**  
Alta

**Justificacion**  
Control financiero de servicios. Rutas: `GET /admin/payments-list`, `GET /admin/payments/:id`, `POST /admin/payments/:id/register`, `PATCH /admin/payments/:id`, `PUT /admin/payments/:id`.

**Criterios de aceptacion**

- Listado via `GET /admin/payments-list` con filtros por estado si el API los soporta.
- Detalle via `GET /admin/payments/:id`.
- Registro de pago via `POST /admin/payments/:id/register`.
- Actualizacion de estado o datos via PATCH/PUT.
- Comprobantes adjuntos son visibles cuando el backend los incluya.

---

### RF-ADM-08 — Perfil medico de mascotas (administrador)

**Descripcion**  
El staff debe consultar y editar el perfil medico base de una mascota bajo administracion.

**Prioridad**  
Media

**Justificacion**  
Datos clinicos de referencia para consultas. Rutas: `GET /admin/pets/:pet_id/medical_profile`, `PATCH /admin/pets/:pet_id/medical_profile`, `PUT /admin/pets/:pet_id/medical_profile`.

**Criterios de aceptacion**

- Visualizacion via GET del perfil medico.
- Edicion via PATCH o PUT con validacion de campos clinicos.
- Cambios persisten y se reflejan en consultas posteriores.

---

### RF-ADM-09 — Mascotas de duenos (administrador)

**Descripcion**  
El staff debe poder crear y editar mascotas asociadas a un dueno especifico, incluyendo foto.

**Prioridad**  
Media

**Justificacion**  
Alta asistida en recepcion o consulta. Rutas: `GET /admin/owners/:owner_id/pets/:id`, `POST /admin/owners/:owner_id/pets`, `PATCH /admin/owners/:owner_id/pets/:id`, `PUT /admin/owners/:owner_id/pets/:id`, `POST/DELETE .../photo`.

**Criterios de aceptacion**

- Creacion de mascota para dueno via `POST /admin/owners/:owner_id/pets`.
- Edicion via PATCH/PUT en ruta anidada con owner_id.
- Gestion de foto via endpoints de photo del recurso.
- Detalle accesible via GET con datos del dueno y la mascota.

---

### RF-ADM-10 — Reportes medicos (administrador)

**Descripcion**  
El staff debe listar reportes medicos, generarlos, importarlos, exportarlos en multiples formatos y enviarlos por email.

**Prioridad**  
Media

**Justificacion**  
Documentacion formal y comunicacion con duenos. Rutas: `/admin/medical_reports` (index, show, create, generate_pdf, import, export_csv/json/pdf, email).

**Criterios de aceptacion**

- Listado via `GET /admin/medical_reports`.
- Detalle via `GET /admin/medical_reports/:id`.
- Generar PDF via `GET /admin/medical_reports/generate_pdf` con parametros requeridos.
- Importar via `POST /admin/medical_reports/import`.
- Exportar CSV, JSON y PDF via endpoints `export_*`.
- Enviar por email via `POST /admin/medical_reports/:id/email`.
- Archivos generados se pueden abrir o compartir desde el dispositivo.

---

## Parte 2 — Requisitos no funcionales

Los RNF siguen el formato `RNF-{Categoria}-{NNN}: {Titulo}` con enunciado directo. Categorias: **ARQ** (arquitectura), **MOB** (movil), **SEC** (seguridad), **UX** (experiencia), **REL** (confiabilidad), **PERF** (rendimiento), **ARC** (archivos), **PRI** (privacidad), **OBS** (observabilidad), **CMP** (compatibilidad), **MAINT** (mantenibilidad).

---

### RNF-ARQ-001: Plataforma movil Android

La aplicacion debe desarrollarse con **Expo SDK 56**, **React Native** y **TypeScript**, como cliente nativo **solo para Android**. El codigo de pantallas y servicios debe estar tipado de forma estricta. Los flujos principales no deben depender de contenedores web embebidos. La version de Expo debe mantenerse alineada con la documentacion oficial v56 (`AGENTS.md`, `docs/arq.md`). No se incluyen targets, builds ni dependencias especificas de iOS.

---

### RNF-ARQ-002: Integracion con API Rails

La app debe consumir exclusivamente las **157 rutas** documentadas en `mobile-routes.md`, sin reimplementar logica de negocio en el cliente. Debe existir un cliente HTTP centralizado con base URL configurable por entorno (desarrollo, staging, produccion). Los payloads y respuestas deben estar tipados segun los contratos del API Rails existente.

---

### RNF-MOB-001: Mobile First

La aplicacion debe disenarse y construirse con enfoque **mobile first**: layouts, navegacion, tipografia y patrones de interaccion pensados primero para pantallas de telefono (una mano, orientacion vertical, safe areas). Las adaptaciones a tablet o web, si existen en el futuro, deben ser extensiones del diseno movil base y no condicionar la arquitectura de la app. Toda pantalla documentada en `mobile-screens.md` debe priorizar legibilidad y acciones principales en viewports desde **320 px** de ancho logico.

---

### RNF-MOB-002: Auto-sincronizacion bajo consentimiento del usuario

La aplicacion debe ser capaz de **auto-sincronizarse** con el backend cuando detecte conexion activa por **WiFi o datos moviles**, **si y solo si el usuario lo ha autorizado** previamente en ajustes (opt-in explicito, revocable en cualquier momento).

Comportamiento esperado:

- Sin autorizacion del usuario, **ninguna** sincronizacion automatica en segundo plano debe ejecutarse; solo sincronizacion manual iniciada por el usuario.
- Con autorizacion activa, al detectar conectividad WiFi o datos, la app debe procesar la cola local de operaciones pendientes (formularios guardados, uploads, acciones diferidas) y refrescar datos stale segun prioridad definida por negocio.
- El usuario debe poder elegir, como minimo, si permite sincronizar solo con **WiFi** o tambien con **datos moviles**.
- Toda sincronizacion automatica debe ser visible mediante indicador discreto de estado (sincronizando / al dia / pendiente / error) sin interrumpir el flujo actual salvo conflicto que requiera decision.

---

### RNF-SEC-001: Seguridad de sesion y almacenamiento de tokens

Los tokens de autenticacion y demas secretos deben almacenarse en el almacenamiento seguro del sistema operativo cuando este disponible, **nunca** en almacenamiento plano sin cifrar. Toda comunicacion con el backend debe realizarse por **HTTPS**. El refresh de sesion debe gestionarse via `POST /auth/refresh` sin exponer tokens en logs de produccion. Al cerrar sesion (`DELETE /auth/logout`) deben eliminarse todos los secretos y datos de sesion locales.

---

### RNF-SEC-002: Control de acceso por rol y dominio

La navegacion y las llamadas API deben restringirse segun rol: **publico**, **dueno (owner)** o **administrador (admin)**. Un dueno autenticado no debe acceder a pantallas ni endpoints `/admin/*`. El staff admin solo accede al dominio Admin segun permisos retornados por `GET /auth/current_user`. Los intentos no autorizados deben redirigir a login o informar error **403** de forma clara.

---

### RNF-UX-001: Experiencia de usuario movil

La interfaz debe cumplir patrones moviles de produccion en Android: areas tactiles minimas de **48×48 dp** (Material), inputs con **font-size ≥ 16 px**, estados de carga / vacio / error en todo listado o formulario, navegacion por tabs y stacks segun `mobile-screens.md`, y respeto de **safe areas** y barras del sistema (status bar, navigation bar, recortes de pantalla). Los mensajes al usuario deben estar en espanol claro, sin stack traces ni jerga tecnica.

---

### RNF-UX-002: Design system y tema claro/oscuro

La UI debe implementar los tokens centralizados de `mobile-design-tokens.css` y `src/theme/tokens.ts`, incluyendo **modo claro y modo oscuro** coherentes con `mobile-ui-components.md`. El tema puede seguir la preferencia del sistema o una seleccion manual del usuario.

---

### RNF-REL-001: Tolerancia a fallos

El sistema debe manejar los errores comunes con elegancia — interrupciones de red durante el envio de datos, timeouts, respuestas **5xx** o token expirado — e informar al usuario adecuadamente, intentando **preservar los datos ingresados** siempre que sea posible (borrador local, cola de reintentos, no descartar formularios completados). Los errores **422** de validacion deben senalar el campo afectado. Los **401** deben disparar refresh de sesion o re-autenticacion segun corresponda.

---

### RNF-REL-002: Copia de seguridad local y recuperacion

**Objetivo de Punto de Recuperacion (RPO):** En caso de cierre inesperado de la app o fallo del dispositivo, la perdida de datos no sincronizados encolados localmente no debe exceder el **ultimo guardado automatico de borrador** (intervalo maximo recomendado: **5 minutos** mientras el usuario edita, o al perder foco del formulario).

**Objetivo de Tiempo de Recuperacion (RTO):** Tras reiniciar la app, el usuario debe poder retomar operaciones pendientes o borradores recuperables en un plazo maximo de **30 segundos** desde el arranque, sin reingresar datos ya capturados localmente.

Los datos clinicos descargados no deben depender de cache permanente sin cifrar; la recuperacion aplica a **cola de sincronizacion**, **borradores** y **estado de sesion** autorizado.

---

### RNF-REL-003: Operacion offline controlada

Sin conexion, la app debe permitir consultar la **ultima copia local** de datos ya sincronizados (cuando exista) y encolar acciones de escritura para envio posterior. Las acciones encoladas deben mostrarse al usuario como **pendientes de sincronizacion**. No debe simular exito de operaciones que no hayan sido confirmadas por el servidor.

---

### RNF-PERF-001: Rendimiento en red movil

Las transiciones entre pantallas principales deben percibirse en **menos de 1 segundo** con conexion normal. Las operaciones largas (upload/download) no deben bloquear la UI; deben mostrar progreso y permitir cancelacion cuando el SO lo permita. Los listados deben soportar paginacion si el API la ofrece.

---

### RNF-ARC-001: Manejo de archivos y multimedia

La app debe soportar captura y subida de imagenes (fotos de mascota, comprobantes de pago) y descarga o visualizacion de **PDFs medicos** y archivos de laboratorio, conforme a las rutas de upload/download del API. Debe respetar limites de tamano y tipo MIME del backend. Los permisos de camara, galeria y almacenamiento deben solicitarse en runtime con mensaje contextual.

---

### RNF-PRI-001: Privacidad y datos de salud animal

Los datos medicos y personales deben tratarse con minima exposicion: sin cache innecesaria en disco, sin logs con informacion identificable en builds de produccion, y con acceso a la politica de privacidad (`GET /pages/privacy`) desde registro y perfil. La eliminacion de cuenta debe purgar datos locales del usuario. La auto-sincronizacion (RNF-MOB-002) nunca debe activarse sin consentimiento explicito del usuario.

---

### RNF-OBS-001: Observabilidad y registro de errores

Los errores no controlados deben registrarse con contexto tecnico en entorno de **desarrollo** unicamente. En produccion, el usuario recibe mensajes accionables; el equipo tecnico puede correlacionar fallos mediante identificadores de error anonimos, sin incluir tokens, contrasenas ni diagnosticos veterinarios completos.

---

### RNF-CMP-001: Compatibilidad de dispositivos Android

La app debe ser compatible con las versiones de **Android** soportadas por Expo SDK 56 segun `app.json` (API level minimo definido en el proyecto). Debe funcionar en telefonos pequenos (320 px de ancho logico) y grandes, con interaccion tactil completa (sin depender de teclado fisico). Debe validarse manualmente en al menos un dispositivo Android fisico y un emulador durante QA.

---

### RNF-MAINT-001: Mantenibilidad y trazabilidad documental

El codigo debe mantener trazabilidad entre requisitos (**RF-***, **RNF-***), rutas API (`mobile-routes.md`), pantallas (`mobile-screens.md`) y componentes (`mobile-ui-components.md`). Los servicios API deben agruparse por dominio en `src/services/`. Cambios en rutas incluidas deben actualizar la documentacion en `docs/`. El demo HTML es referencia visual, no codigo de produccion.

---

## Matriz de trazabilidad resumida

| Dominio | Requisitos funcionales | Rutas API (aprox.) |
|---------|------------------------|-------------------|
| Public | RF-PUB-01 a RF-PUB-05 | 19 |
| Owner | RF-OWN-01 a RF-OWN-11 | 54 |
| Admin | RF-ADM-01 a RF-ADM-10 | 84 |
| No funcionales | RNF-ARQ, MOB, SEC, UX, REL, PERF, ARC, PRI, OBS, CMP, MAINT | — |

---

## Documentos relacionados

| Documento | Contenido |
|-----------|-----------|
| [mobile-routes.md](./mobile-routes.md) | Catalogo de endpoints |
| [mobile-screens.md](./mobile-screens.md) | Pantallas por proceso |
| [mobile-ui-components.md](./mobile-ui-components.md) | Componentes UI |
| [mobile-demo.html](./mobile-demo.html) | Prototipo visual |
| [arq.md](./arq.md) | Arquitectura tecnica |
