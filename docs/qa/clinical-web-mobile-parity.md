# Consulta clínica: contrato web y móvil

Referencia revisada: `../open-chepicare-web/app/frontend/hooks/useConsultationWizard.ts`,
`app/frontend/types/MedicalRecords.ts`, `config/routes.rb` y los controladores
`Admin::{Consultations,Prescriptions,LabExams,Vaccinations,Dewormings}Controller`.

| Bloque | Endpoint real | Datos principales |
| --- | --- | --- |
| Consulta | POST `/admin/consultations` | paciente, fecha, anamnesis, peso, temperatura, frecuencia cardíaca, frecuencia respiratoria, presión, notas, tratamiento, diagnóstico |
| Receta | POST `/admin/consultations/:id/prescriptions` | medicamentos, dosis, frecuencia, duración, instrucciones |
| Orden de examen | POST `/admin/consultations/:id/lab_exams` | tipo, nombre, antecedentes, signos clínicos, ayuno, sedación, instrucciones; estado pendiente |
| Vacuna | POST `/admin/vaccinations` | paciente y consulta, tipo, nombre, fabricante, lote, dosis, vía, fecha de aplicación, próxima dosis, observaciones |
| Desparasitación | POST `/admin/dewormings` | paciente y consulta, producto, dosis, vía, tipo de parásito, fecha de aplicación, peso, próxima dosis, observaciones |
| Archivos del examen (personal) | POST `/admin/consultations/:consultation_id/lab_exams/:id/files` | archivo real y descripción |
| Archivos del examen (propietario) | POST `/owner/lab_exams/:id/files` | archivo real y descripción, limitado a sus mascotas |

El móvil omitía los cuatro bloques relacionados y varios datos clínicos. La web
crea primero la consulta y después los registros vinculados. Si una operación
relacionada falla, el móvil debe conservar la consulta e identificar lo pendiente;
reintentar debe ejecutar únicamente las operaciones fallidas.

Requisitos aceptados durante la revisión:

- Diagnóstico al final de los datos clínicos.
- Añadir receta, órdenes de exámenes, vacunas y desparasitaciones desde la consulta.
- Fotos/resultados accesibles para propietario y personal autorizado, conservados
  al salir y volver al examen.
- Tutor y contacto visibles tanto en ficha como en historia médica.
- Paciente primero en las listas clínicas, con tutor debajo.
- Agenda: solo Calendario (predeterminado) y Semana en curso.
