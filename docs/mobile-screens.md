# ChepiCare Mobile — Inventario de pantallas

> Basado en [mobile-routes.md](./mobile-routes.md) · 157 rutas API · App movil (React Native / Expo)

Este documento mapea **procesos de negocio → pantallas moviles → rutas API**. Las pantallas marcadas con *(demo)* aparecen en [mobile-demo.html](./mobile-demo.html).

---

## Resumen por dominio

| Dominio | Procesos | Pantallas estimadas |
|---------|----------|---------------------|
| Public | 6 | 18 |
| Owner | 9 | 38 |
| Admin | 11 | 42 |
| **Total** | **26** | **~98** |

Algunas pantallas comparten layout (formulario crear/editar, detalle con acciones). El demo HTML muestra **30 pantallas representativas**.

---

## 1. Public — Descubrimiento y compra

### 1.1 Catalogo y tienda

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Servicios | Info | `GET /services` | Listado de servicios clinicos *(demo)* |
| Productos | Lista | `GET /public/products`, `GET /pages/products` | Grid/lista de productos *(demo)* |
| Detalle producto | Detalle | `GET /public/products/:id` | Precio, stock, CTA comprar *(demo)* |
| Checkout | Formulario | `GET /pages/checkout`, `POST /public/product_orders` | Resumen pedido + datos *(demo)* |
| Subir comprobante | Formulario | `POST /public/product_orders/:id/upload_proof` | Upload foto/PDF *(demo)* |

### 1.2 Adopcion

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Adopcion landing | Hub | `GET /adoption` | Intro + CTA ver mascotas *(demo)* |
| Mascotas en adopcion | Lista | `GET /adoption/pets` | Filtros por especie/edad *(demo)* |
| Detalle adopcion | Detalle | `GET /adoption/pets/:id` | Galeria, requisitos, contacto *(demo)* |

### 1.3 Patrocinios (publico)

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Patrocinios | Lista | `GET /sponsorships` | Campanas activas |
| Detalle patrocinio | Detalle | `GET /sponsorships/:id` | Progreso, meta, historial |
| Detalle gasto | Detalle | `GET /sponsorships/:id/expenses/:expense_id` | Comprobante del gasto |
| Crear/editar patrocinio | Formulario | `POST /sponsorships`, `PATCH /sponsorships/:id` | Flujo donante |

### 1.4 Legal e informacion

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Contacto | Formulario | `GET /pages/contact` | Email, telefono, mapa *(demo)* |
| Terminos | Legal | `GET /pages/terms` | Texto estatico *(demo)* |
| Privacidad | Legal | `GET /pages/privacy` | Texto estatico |

---

## 2. Owner — Autenticacion y cuenta

### 2.1 Auth

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Bienvenida auth | Hub | `GET /auth` | Login / Registro *(demo)* |
| Iniciar sesion | Formulario | `POST /auth/login` | Email + password *(demo)* |
| Registro | Formulario | `POST /auth/register_owner` | Datos dueno *(demo)* |
| Olvide contrasena | Formulario | `POST /auth/forgot_password` | Email recuperacion *(demo)* |
| Restablecer contrasena | Formulario | `GET /auth/reset_password/:token`, `POST /auth/reset_password` | Nueva password |

> `POST /auth/refresh`, `GET /auth/current_user`, `DELETE /auth/logout` — sin pantalla dedicada (capa de servicio / sesion).

### 2.2 Dashboard

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Inicio | Dashboard | `GET /dashboard`, `GET /dashboard-summary` | Resumen citas, pagos, alertas *(demo)* |

### 2.3 Perfil

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Mi perfil | Detalle | `GET /profile` | Avatar, datos, acciones *(demo)* |
| Editar perfil | Formulario | `PATCH /profile` | Nombre, email, telefono |
| Cambiar contrasena | Formulario | `PATCH /profile/password` | Actual + nueva |
| Eliminar cuenta | Confirmacion | `DELETE /profile` | Dialogo destructivo |

---

## 3. Owner — Mascotas

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Mis mascotas (hub) | Lista | `GET /my-pets`, `GET /pets` | Tabs o acceso rapido *(demo)* |
| Detalle mascota | Detalle | `GET /pets/:id` | Info + accesos medicos *(demo)* |
| Nueva mascota | Formulario | `GET /pets/new`, `POST /pets` | Form + foto *(demo)* |
| Editar mascota | Formulario | `GET /pets/:id/edit`, `PATCH /pets/:id` | Mismo layout que nueva |
| Subir/eliminar foto | Modal | `POST /pets/:id/photo`, `DELETE /pets/:id/photo` | Sheet sobre formulario |

---

## 4. Owner — Citas

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Mis citas (hub) | Lista | `GET /my-appointments`, `GET /owner-appointments-list` | Proximas / pasadas *(demo)* |
| Detalle cita | Detalle | `GET /owner-appointments/:id` | Estado, vet, acciones *(demo)* |
| Agendar cita | Wizard | `POST /owner-appointments`, `GET /owner-available-vets`, `GET /owner-available-days` | Pet → vet → dia → hora *(demo)* |
| Editar cita | Formulario | `PATCH /owner-appointments/:id` | Reprogramar |
| Confirmar / Cancelar | Accion | `POST /owner-appointments/:id/confirm`, `.../cancel` | Botones en detalle |

---

## 5. Owner — Pagos

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Mis pagos (hub) | Lista | `GET /my-payments`, `GET /owner-payments-list` | Pendientes / pagados *(demo)* |
| Registrar pago | Formulario | `POST /owner-payments/:id/register` | Monto + comprobante *(demo)* |

---

## 6. Owner — Historial medico

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Historial general | Lista | `GET /my-medical-history`, `GET /owner-medical-summary` | Todas las mascotas *(demo)* |
| Historial por mascota | Hub | `GET /my-pets/:pet_id/medical-history` | Menu medico de la mascota *(demo)* |
| Perfil medico | Detalle | `GET /pets/:pet_id/medical_profile` | Alergias, peso, notas |
| Vacunas | Lista | `GET /pets/:pet_id/vaccinations` | Timeline *(demo)* |
| Desparasitaciones | Lista | `GET /pets/:pet_id/dewormings` | Timeline |
| Consultas | Lista | `GET /pets/:pet_id/consultations` | Historial consultas |
| Detalle consulta | Detalle | export recipe, complete treatment | Receta PDF, marcar tratamiento *(demo)* |
| Examenes lab | Formulario | `POST /owner/lab_exams/:id/files`, `PATCH .../results` | Subir archivos / ver resultados *(demo)* |
| Reportes medicos | Lista | `GET /pets/:pet_id/medical_reports` | PDFs generados |
| Detalle reporte | Detalle | `GET .../medical_reports/:id`, download PDF | Vista previa / compartir *(demo)* |

---

## 7. Owner — Patrocinios

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Mis patrocinios | Lista | `GET /my-sponsorships` | Donaciones activas *(demo)* |

(Reutiliza detalle/crear del flujo publico §1.3)

---

## 8. Admin — Panel principal

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Admin inicio | Dashboard | — | Grid modulos + metricas *(demo)* |

---

## 9. Admin — Mascotas y adopciones

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Mascotas admin | Lista | `GET /admin/pets-list` | Busqueda + filtros *(demo)* |
| Detalle mascota admin | Detalle | `GET /admin/pets/:id` | CRUD + foto *(demo)* |
| Form mascota admin | Formulario | `POST /admin/pets`, `PATCH /admin/pets/:id` | Crear/editar |
| Adopciones admin | Lista | `GET /admin/adoptions-list` | Solicitudes *(demo)* |
| Detalle adopcion admin | Detalle | `GET /admin/adoptions/:id` | Aprobar/rechazar |
| Nueva adopcion | Formulario | `POST /admin/adoptions` | Alta registro |
| Mascota de dueno | Detalle/Form | `GET/POST/PATCH /admin/owners/:owner_id/pets/...` | Desde ficha dueno |

---

## 10. Admin — Consultas clinicas

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Consultas | Lista | `GET /admin/consultations-list` | Filtro por fecha/mascota *(demo)* |
| Detalle consulta | Detalle | `GET /admin/consultations/:id` | Notas, receta, labs *(demo)* |
| Nueva/editar consulta | Formulario | `POST/PATCH /admin/consultations/:id` | Form clinico |
| Recetas | Sub-pantalla | `GET/POST .../prescriptions` | Lista + form items *(demo)* |
| Examenes lab | Sub-pantalla | `GET/POST .../lab_exams`, upload/delete files | Adjuntos *(demo)* |
| Perfil medico admin | Formulario | `GET/PATCH /admin/pets/:pet_id/medical_profile` | Edicion staff |

---

## 11. Admin — Vacunacion y desparasitacion

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Vacunas | Lista/Detalle/Form | `/admin/vaccinations-*` | CRUD completo *(demo)* |
| Desparasitaciones | Lista/Detalle/Form | `/admin/dewormings-*` | CRUD completo |
| Esquemas vacunacion | Lista/Detalle/Form | `/admin/vaccination-schedules-*`, complete_item | Plan por mascota *(demo)* |

---

## 12. Admin — Citas

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Citas admin | Lista | `GET /admin/appointments-list` | Calendario/lista *(demo)* |
| Detalle cita admin | Detalle | `GET /admin/appointments/:id` | Editar estado |
| Agendar cita admin | Wizard | `POST /admin/appointments`, available-days/vets/time-slots | Staff agenda *(demo)* |

---

## 13. Admin — Pagos

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Pagos admin | Lista | `GET /admin/payments-list` | Todos los pagos *(demo)* |
| Detalle pago | Detalle | `GET /admin/payments/:id` | Registrar/actualizar |
| Registrar pago | Formulario | `POST /admin/payments/:id/register` | Validacion staff |

---

## 14. Admin — Reportes medicos

| Pantalla | Tipo | Rutas API | Notas |
|----------|------|-----------|-------|
| Reportes | Lista | `GET /admin/medical_reports` | Busqueda *(demo)* |
| Detalle reporte | Detalle | `GET /admin/medical_reports/:id` | Export CSV/JSON/PDF, email *(demo)* |
| Generar PDF | Accion | `GET /admin/medical_reports/generate_pdf` | Parametros + preview |
| Importar | Formulario | `POST /admin/medical_reports/import` | Upload archivo |

---

## Navegacion movil propuesta

### Owner (autenticado)

Bottom tabs: **Inicio** · **Mascotas** · **Citas** · **Perfil**

Stacks anidados: historial medico, pagos y patrocinios desde Inicio o detalle mascota.

### Admin (rol staff)

Bottom tabs: **Inicio** · **Pacientes** · **Agenda** · **Mas**

Modulos en grid: consultas, vacunas, pagos, reportes.

### Public (sin sesion)

Stack lineal desde landing: Servicios → Tienda → Adopcion → Auth.

---

## Archivos relacionados

| Archivo | Proposito |
|---------|-----------|
| [mobile-demo.html](./mobile-demo.html) | Demo visual de pantallas (solo diseno) |
| [mobile-demo.css](./mobile-demo.css) | Layout demo + componentes movil |
| [mobile-ui-components.md](./mobile-ui-components.md) | Spec de componentes para React Native |
| [mobile-design-tokens.css](./mobile-design-tokens.css) | Tokens y primitivos CSS |
