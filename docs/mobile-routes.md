# ChepiCare Mobile — Rutas API

> App: `chepicare-mobile` · Exportado: 2026-05-31T16:29:33.061Z · **157 rutas** seleccionadas para la app movil

## Resumen

| Metrica | Valor |
|---------|-------|
| Controladores totales | 72 |
| Rutas totales (Rails) | 332 |
| Rutas incluidas (mobile) | 157 |
| Rutas excluidas | 175 |

## Dominios

- **Public (Sin autenticacion)** — 19 rutas, 5 controladores
- **Owner (Dueno de mascota)** — 54 rutas, 15 controladores
- **Admin (Panel administrativo)** — 84 rutas, 13 controladores

## Public (Sin autenticacion)

_19 rutas en 5 controladores._

### `pages`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/checkout` | `pages#checkout` |
| GET | `/contact` | `pages#contact` |
| GET | `/privacy` | `pages#privacy` |
| GET | `/products` | `pages#products` |
| GET | `/services` | `pages#services` |
| GET | `/terms` | `pages#terms` |

### `public/products`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/public/products` | `public/products#index` |
| GET | `/public/products/:id` | `public/products#show` |

### `public/product_orders`

| Metodo | Ruta | Action |
|--------|------|--------|
| POST | `/public/product_orders` | `public/product_orders#create` |
| POST | `/public/product_orders/:id/upload_proof` | `public/product_orders#upload_proof` |

### `adoption`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/adoption` | `adoption#index` |
| GET | `/adoption/pets` | `adoption#pets` |
| GET | `/adoption/pets/:id` | `adoption#show` |

### `sponsorships`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/sponsorships` | `sponsorships#index` |
| GET | `/sponsorships/:id` | `sponsorships#show` |
| GET | `/sponsorships/:id/expenses/:expense_id` | `sponsorships#expense` |
| POST | `/sponsorships` | `sponsorships#create` |
| PATCH | `/sponsorships/:id` | `sponsorships#update` |
| PUT | `/sponsorships/:id` | `sponsorships#update` |

## Owner (Dueno de mascota)

_54 rutas en 15 controladores._

### `auth`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/auth` | `auth#index` |
| GET | `/auth/current_user` | `auth#current_user` |
| GET | `/auth/debug` | `auth#debug` |
| GET | `/auth/reset_password/:token` | `auth#edit_password_reset` |
| POST | `/auth/forgot_password` | `auth#forgot_password` |
| POST | `/auth/login` | `auth#login` |
| POST | `/auth/refresh` | `auth#refresh` |
| POST | `/auth/register_owner` | `auth#register_owner` |
| POST | `/auth/reset_password` | `auth#reset_password` |
| DELETE | `/auth/logout` | `auth#logout` |

### `profile`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/profile` | `profile#show` |
| PATCH | `/profile` | `profile#update` |
| PATCH | `/profile/password` | `profile#change_password` |
| DELETE | `/profile` | `profile#destroy` |

### `dashboard`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/dashboard` | `dashboard#index` |
| GET | `/dashboard-summary` | `dashboard#summary` |

### `owner_pages`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/my-appointments` | `owner_pages#appointments` |
| GET | `/my-medical-history` | `owner_pages#medical_history_index` |
| GET | `/my-payments` | `owner_pages#payments` |
| GET | `/my-pets` | `owner_pages#pets` |
| GET | `/my-pets/:pet_id/medical-history` | `owner_pages#medical_history` |
| GET | `/my-sponsorships` | `owner_pages#sponsorships` |

### `owner_appointments`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/owner-appointments-list` | `owner_appointments#index` |
| GET | `/owner-appointments/:id` | `owner_appointments#show` |
| POST | `/owner-appointments` | `owner_appointments#create` |
| POST | `/owner-appointments/:id/cancel` | `owner_appointments#cancel` |
| POST | `/owner-appointments/:id/confirm` | `owner_appointments#confirm` |
| PATCH | `/owner-appointments/:id` | `owner_appointments#update` |

### `owner_availability`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/owner-available-days` | `owner_availability#days` |
| GET | `/owner-available-vets` | `owner_availability#index` |

### `owner_payments`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/owner-payments-list` | `owner_payments#index` |
| POST | `/owner-payments/:id/register` | `owner_payments#register` |

### `owner_medical_summary`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/owner-medical-summary` | `owner_medical_summary#index` |

### `owner_consultations`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/owner/consultations/:id/export_recipe` | `owner_consultations#export_recipe` |
| GET | `/pets/:pet_id/consultations` | `owner_consultations#index` |
| POST | `/owner/consultations/:id/complete_treatment` | `owner_consultations#complete_treatment` |

### `owner_lab_exams`

| Metodo | Ruta | Action |
|--------|------|--------|
| POST | `/owner/lab_exams/:id/files` | `owner_lab_exams#upload_files` |
| PATCH | `/owner/lab_exams/:id/results` | `owner_lab_exams#update_results` |

### `pets`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/pets` | `pets#index` |
| GET | `/pets/:id` | `pets#show` |
| GET | `/pets/:id/edit` | `pets#edit` |
| GET | `/pets/new` | `pets#new` |
| POST | `/pets` | `pets#create` |
| POST | `/pets/:id/photo` | `pets#photo` |
| PATCH | `/pets/:id` | `pets#update` |
| PUT | `/pets/:id` | `pets#update` |
| DELETE | `/pets/:id` | `pets#destroy` |
| DELETE | `/pets/:id/photo` | `pets#delete_photo` |

### `owner_medical_profiles`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/pets/:pet_id/medical_profile` | `owner_medical_profiles#show` |

### `owner_vaccinations`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/pets/:pet_id/vaccinations` | `owner_vaccinations#index` |

### `owner_dewormings`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/pets/:pet_id/dewormings` | `owner_dewormings#index` |

### `owner_medical_reports`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/pets/:pet_id/medical_reports` | `owner_medical_reports#index` |
| GET | `/pets/:pet_id/medical_reports/:id` | `owner_medical_reports#show` |
| GET | `/pets/:pet_id/medical_reports/:id/download_pdf` | `owner_medical_reports#download_pdf` |

## Admin (Panel administrativo)

_84 rutas en 13 controladores._

### `admin/pets`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/admin/pets-list` | `admin/pets#index` |
| GET | `/admin/pets/:id` | `admin/pets#show` |
| POST | `/admin/pets` | `admin/pets#create` |
| POST | `/admin/pets/:id/photo` | `admin/pets#photo` |
| PATCH | `/admin/pets/:id` | `admin/pets#update` |
| PUT | `/admin/pets/:id` | `admin/pets#update` |
| DELETE | `/admin/pets/:id` | `admin/pets#destroy` |
| DELETE | `/admin/pets/:id/photo` | `admin/pets#delete_photo` |

### `admin/adoptions`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/admin/adoptions-list` | `admin/adoptions#index` |
| GET | `/admin/adoptions/:id` | `admin/adoptions#show` |
| POST | `/admin/adoptions` | `admin/adoptions#create` |

### `admin/consultations`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/admin/consultations-list` | `admin/consultations#index` |
| GET | `/admin/consultations/:id` | `admin/consultations#show` |
| GET | `/admin/consultations/:id/export_recipe` | `admin/consultations#export_recipe` |
| POST | `/admin/consultations` | `admin/consultations#create` |
| POST | `/admin/consultations/:id/complete_treatment` | `admin/consultations#complete_treatment` |
| PATCH | `/admin/consultations/:id` | `admin/consultations#update` |
| PUT | `/admin/consultations/:id` | `admin/consultations#update` |
| DELETE | `/admin/consultations/:id` | `admin/consultations#destroy` |

### `admin/vaccinations`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/admin/vaccinations-list` | `admin/vaccinations#index` |
| GET | `/admin/vaccinations/:id` | `admin/vaccinations#show` |
| POST | `/admin/vaccinations` | `admin/vaccinations#create` |
| PATCH | `/admin/vaccinations/:id` | `admin/vaccinations#update` |
| PUT | `/admin/vaccinations/:id` | `admin/vaccinations#update` |
| DELETE | `/admin/vaccinations/:id` | `admin/vaccinations#destroy` |

### `admin/dewormings`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/admin/dewormings-list` | `admin/dewormings#index` |
| GET | `/admin/dewormings/:id` | `admin/dewormings#show` |
| POST | `/admin/dewormings` | `admin/dewormings#create` |
| PATCH | `/admin/dewormings/:id` | `admin/dewormings#update` |
| PUT | `/admin/dewormings/:id` | `admin/dewormings#update` |
| DELETE | `/admin/dewormings/:id` | `admin/dewormings#destroy` |

### `admin/vaccination_schedules`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/admin/vaccination_schedules/:id` | `admin/vaccination_schedules#show` |
| GET | `/admin/vaccination-schedules-list` | `admin/vaccination_schedules#index` |
| POST | `/admin/vaccination_schedules` | `admin/vaccination_schedules#create` |
| POST | `/admin/vaccination_schedules/:id/complete_item` | `admin/vaccination_schedules#complete_item` |
| PATCH | `/admin/vaccination_schedules/:id` | `admin/vaccination_schedules#update` |
| PUT | `/admin/vaccination_schedules/:id` | `admin/vaccination_schedules#update` |
| DELETE | `/admin/vaccination_schedules/:id` | `admin/vaccination_schedules#destroy` |

### `admin/appointments`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/admin/appointments-list` | `admin/appointments#index` |
| GET | `/admin/appointments/:id` | `admin/appointments#show` |
| GET | `/admin/appointments/available-days` | `admin/appointments#available_days` |
| GET | `/admin/appointments/available-vets` | `admin/appointments#available_vets` |
| GET | `/admin/appointments/time-slots` | `admin/appointments#time_slots` |
| POST | `/admin/appointments` | `admin/appointments#create` |
| PATCH | `/admin/appointments/:id` | `admin/appointments#update` |
| PUT | `/admin/appointments/:id` | `admin/appointments#update` |
| DELETE | `/admin/appointments/:id` | `admin/appointments#destroy` |

### `admin/payments`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/admin/payments-list` | `admin/payments#index` |
| GET | `/admin/payments/:id` | `admin/payments#show` |
| POST | `/admin/payments/:id/register` | `admin/payments#register` |
| PATCH | `/admin/payments/:id` | `admin/payments#update` |
| PUT | `/admin/payments/:id` | `admin/payments#update` |

### `admin/owner_pets`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/admin/owners/:owner_id/pets/:id` | `admin/owner_pets#show` |
| POST | `/admin/owners/:owner_id/pets` | `admin/owner_pets#create` |
| POST | `/admin/owners/:owner_id/pets/:id/photo` | `admin/owner_pets#photo` |
| PATCH | `/admin/owners/:owner_id/pets/:id` | `admin/owner_pets#update` |
| PUT | `/admin/owners/:owner_id/pets/:id` | `admin/owner_pets#update` |
| DELETE | `/admin/owners/:owner_id/pets/:id/photo` | `admin/owner_pets#delete_photo` |

### `admin/medical_profiles`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/admin/pets/:pet_id/medical_profile` | `admin/medical_profiles#show` |
| PATCH | `/admin/pets/:pet_id/medical_profile` | `admin/medical_profiles#update` |
| PUT | `/admin/pets/:pet_id/medical_profile` | `admin/medical_profiles#update` |

### `admin/prescriptions`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/admin/consultations/:consultation_id/prescriptions` | `admin/prescriptions#index` |
| GET | `/admin/consultations/:consultation_id/prescriptions/:id` | `admin/prescriptions#show` |
| POST | `/admin/consultations/:consultation_id/prescriptions` | `admin/prescriptions#create` |
| PATCH | `/admin/consultations/:consultation_id/prescriptions/:id` | `admin/prescriptions#update` |
| PUT | `/admin/consultations/:consultation_id/prescriptions/:id` | `admin/prescriptions#update` |
| DELETE | `/admin/consultations/:consultation_id/prescriptions/:id` | `admin/prescriptions#destroy` |

### `admin/lab_exams`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/admin/consultations/:consultation_id/lab_exams` | `admin/lab_exams#index` |
| GET | `/admin/consultations/:consultation_id/lab_exams/:id` | `admin/lab_exams#show` |
| POST | `/admin/consultations/:consultation_id/lab_exams` | `admin/lab_exams#create` |
| POST | `/admin/consultations/:consultation_id/lab_exams/:id/files` | `admin/lab_exams#upload_files` |
| PATCH | `/admin/consultations/:consultation_id/lab_exams/:id` | `admin/lab_exams#update` |
| PUT | `/admin/consultations/:consultation_id/lab_exams/:id` | `admin/lab_exams#update` |
| DELETE | `/admin/consultations/:consultation_id/lab_exams/:id` | `admin/lab_exams#destroy` |
| DELETE | `/admin/consultations/:consultation_id/lab_exams/:id/files/:file_id` | `admin/lab_exams#delete_file` |

### `admin/medical_reports`

| Metodo | Ruta | Action |
|--------|------|--------|
| GET | `/admin/medical_reports` | `admin/medical_reports#index` |
| GET | `/admin/medical_reports/:id` | `admin/medical_reports#show` |
| GET | `/admin/medical_reports/:id/export_csv` | `admin/medical_reports#export_csv` |
| GET | `/admin/medical_reports/:id/export_json` | `admin/medical_reports#export_json` |
| GET | `/admin/medical_reports/:id/export_pdf` | `admin/medical_reports#export_pdf` |
| GET | `/admin/medical_reports/generate_pdf` | `admin/medical_reports#generate_pdf` |
| POST | `/admin/medical_reports` | `admin/medical_reports#create` |
| POST | `/admin/medical_reports/:id/email` | `admin/medical_reports#email` |
| POST | `/admin/medical_reports/import` | `admin/medical_reports#import` |
