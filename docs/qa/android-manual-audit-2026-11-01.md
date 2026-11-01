# Revisión manual de ChepiCare en Android

Ramas de correcciones: `fix/android-manual-audit`, en móvil y en
`../open-chepicare-web`. Revisión y validación final terminadas. Las dos ramas deben usarse juntas.

Contrato de backend guardado en el commit `72c5948`.

Se abrieron e inspeccionaron las **81 pantallas** del repositorio en Android,
con cuentas reales de owner, administrador y veterinario. El
[inventario completo](android-screen-coverage.csv) relaciona cada archivo de
pantalla con su captura y alcance. Las [evidencias](evidence/android-2026-11-01)
incluyen capturas originales y árboles de accesibilidad en texto. Algunas
capturas muestran el defecto inicial; las posteriores documentan su corrección.

## Entorno

- Emulador local, Android 15, 1080 × 2400; `com.chepicare.mobile`.
- MCP `@mobilenext/mobile-mcp@1.0.15`, con ADB para tocar, escribir y desplazar.
- Rails real en 3000, Metro en 8081 y web/Vite en 3036.
- Comparación con `useConsultationWizard.ts`, tipos, rutas, controladores,
  acciones y respuestas JSON de la web.
- Los accesos secundarios se inspeccionaron mediante enlaces en una copia
  temporal de QA en `/tmp`, con los mismos servicios y pantallas del repositorio.
  Esos enlaces no forman parte del código de producción.
- No se simulan respuestas del servidor. Las escrituras de integración y las
  fotos de prueba usan registros y archivos reales identificados como QA.

## Errores y correcciones

Los 17 hallazgos siguientes tienen corrección implementada en estas ramas.

### A01 — P2 — Aviso de sonido sobre la navegación

El canal interpretaba «default» como un archivo de sonido. Se omite esa configuración personalizada; prueba de alarmas y arranque owner sin aviso.

Evidencias: [001-owner-dashboard](evidence/android-2026-11-01/001-owner-dashboard.png), [155-owner-authenticated](evidence/android-2026-11-01/155-owner-authenticated.png).

### A02 — P2 — Próximas vacunas vencidas sin aviso

Se distingue el vencimiento con texto e indicador. Se considera la última aplicación de cada vacuna para evitar avisos incorrectos. Integración real y comprobación nativa.

Evidencias: [006-owner-vaccinations](evidence/android-2026-11-01/006-owner-vaccinations.png), [161-owner-vaccines-overdue-fixed](evidence/android-2026-11-01/161-owner-vaccines-overdue-fixed.png).

### A03 — P1 — Filtros de citas y pagos ocupaban media pantalla

La lista horizontal crecía verticalmente. Se limita su crecimiento y se mantiene visible la opción seleccionada. Comprobado en pagos, agenda y asistentes.

Evidencias: [020-owner-appointments](evidence/android-2026-11-01/020-owner-appointments.png), [036-owner-payments](evidence/android-2026-11-01/036-owner-payments.png), [104-admin-payments-list](evidence/android-2026-11-01/104-admin-payments-list.png), [147-staff-register-real-payment](evidence/android-2026-11-01/147-staff-register-real-payment.png).

### A04 — P0 — Calendario se caía con eventos de clínica

Faltaban tipo y etiqueta, causando toLowerCase sobre undefined. Tipos, leyenda y detalle completos; se admiten eventos sin mascota. Verificado en ambos perfiles.

Evidencias: [044-owner-calendar](evidence/android-2026-11-01/044-owner-calendar.png), [076-week-after-restart](evidence/android-2026-11-01/076-week-after-restart.png), [162-owner-calendar-default](evidence/android-2026-11-01/162-owner-calendar-default.png), [163-owner-week-current](evidence/android-2026-11-01/163-owner-week-current.png).

### A05 — P2 — Enlace inválido presentado como sesión expirada

El rechazo aparecía además bajo la confirmación de contraseña. Ahora se explica que el enlace no es válido o venció en un aviso independiente. E2E real del rechazo, además de comprobación manual del mensaje corregido.

Evidencias: [052-reset-password-rejection](evidence/android-2026-11-01/052-reset-password-rejection.png).

### A06 — P1 — Perfil médico del personal devolvía HTTP 500

El móvil pedía una ruta web como JSON. Se usa el contrato existente /admin/pets/:id/medical_profile. Perfil real e historial verificados.

Evidencias: [061-admin-medical-profile](evidence/android-2026-11-01/061-admin-medical-profile.png), [064-admin-medical-profile-retry](evidence/android-2026-11-01/064-admin-medical-profile-retry.png), [085-max-profile-corrected](evidence/android-2026-11-01/085-max-profile-corrected.png).

### A07 — P1 — Consultas y registros sin paciente o tutor

Consultas de personal y owner muestran «Paciente — Motivo» y tutor debajo. También se corrigieron calendario, informes y detalle de cita; la cita incluye teléfono y correo. Contratos reales, E2E e inspección nativa.

Evidencias: [065-admin-consultations](evidence/android-2026-11-01/065-admin-consultations.png), [066-admin-consultation-detail](evidence/android-2026-11-01/066-admin-consultation-detail.png), [094-qa-staff-consultation](evidence/android-2026-11-01/094-qa-staff-consultation.png), [127-appointment-tutor-fixed](evidence/android-2026-11-01/127-appointment-tutor-fixed.png), [189-consultations-patient-tutor](evidence/android-2026-11-01/189-consultations-patient-tutor.png), [198-vet-report-list-identity](evidence/android-2026-11-01/198-vet-report-list-identity.png), [199-vet-report-detail-identity](evidence/android-2026-11-01/199-vet-report-detail-identity.png).

### A08 — P0 — Salir de una consulta accedía al grabador liberado

El cleanup redundante tocaba un objeto nativo que Expo ya había liberado. Se respeta el ciclo de vida de Expo. Regresión con liberación nativa y retorno sin error en Android.

Evidencias: [067-admin-consultation-detail-bottom](evidence/android-2026-11-01/067-admin-consultation-detail-bottom.png), [096-consultation-return-audio-fixed](evidence/android-2026-11-01/096-consultation-return-audio-fixed.png).

### A09 — P1 — Paciente sin tutor, contacto ni historia completa

Ficha e historia muestran nombre, documento, teléfono y correo. Se añade la historia real del paciente con consultas, vacunas, desparasitaciones, informes y acceso al perfil médico.

Evidencias: [059-admin-patient-detail](evidence/android-2026-11-01/059-admin-patient-detail.png), [082-max-contact-corrected](evidence/android-2026-11-01/082-max-contact-corrected.png), [084-max-medical-history](evidence/android-2026-11-01/084-max-medical-history.png), [085-max-profile-corrected](evidence/android-2026-11-01/085-max-profile-corrected.png), [086-history-vaccines-deworming](evidence/android-2026-11-01/086-history-vaccines-deworming.png), [188-vet-patient-history-contact](evidence/android-2026-11-01/188-vet-patient-history-contact.png).

### A10 — P1 — Consulta incompleta frente a la web

Faltaban anamnesis, signos vitales, receta, órdenes de exámenes, vacunas y desparasitaciones. Cinco secciones reales; diagnóstico al final de los datos clínicos. Guardado con endpoints existentes y reintentos sin duplicar lo ya guardado. Integración y E2E del flujo completo.

Evidencias: [098-admin-consultation-form](evidence/android-2026-11-01/098-admin-consultation-form.png), [108-consultation-five-sections](evidence/android-2026-11-01/108-consultation-five-sections.png), [109-prescription-section](evidence/android-2026-11-01/109-prescription-section.png), [110-prescription-fields](evidence/android-2026-11-01/110-prescription-fields.png), [111-exam-order-section](evidence/android-2026-11-01/111-exam-order-section.png), [112-exam-order-fields](evidence/android-2026-11-01/112-exam-order-fields.png), [113-exam-order-instructions](evidence/android-2026-11-01/113-exam-order-instructions.png), [190-clinical-five-sections](evidence/android-2026-11-01/190-clinical-five-sections.png), [192-clinical-vaccine-fields](evidence/android-2026-11-01/192-clinical-vaccine-fields.png), [193-clinical-vaccine-fields-bottom](evidence/android-2026-11-01/193-clinical-vaccine-fields-bottom.png), [196-clinical-deworm-fields](evidence/android-2026-11-01/196-clinical-deworm-fields.png), [197-clinical-deworm-fields-bottom](evidence/android-2026-11-01/197-clinical-deworm-fields-bottom.png).

### A11 — P1 — Adjuntos de exámenes desaparecían al reabrir

Se leen los archivos persistidos y se añade ficha compartida para personal y owner, con vista previa y subida. El owner ajeno recibe 404. Comprobado personal → owner → veterinario en Android, además de descarga byte a byte en integración.

Evidencias: [131-vet-lab-detail](evidence/android-2026-11-01/131-vet-lab-detail.png), [143-vet-native-upload-result](evidence/android-2026-11-01/143-vet-native-upload-result.png), [156-owner-sees-staff-photo](evidence/android-2026-11-01/156-owner-sees-staff-photo.png), [159-owner-photo-uploaded](evidence/android-2026-11-01/159-owner-photo-uploaded.png), [184-vet-sees-owner-photo](evidence/android-2026-11-01/184-vet-sees-owner-photo.png), [185-vet-two-shared-photos](evidence/android-2026-11-01/185-vet-two-shared-photos.png).

### A12 — P1 — Vacunas y desparasitaciones sin paciente ni tutor

Serializadores con tutor y listas «Paciente — Vacuna/producto». Pruebas reales Rails/móvil e inspección con permisos de veterinario.

Evidencias: [099-admin-vaccinations](evidence/android-2026-11-01/099-admin-vaccinations.png), [100-admin-dewormings](evidence/android-2026-11-01/100-admin-dewormings.png), [186-vet-vaccinations-identity](evidence/android-2026-11-01/186-vet-vaccinations-identity.png), [187-vet-dewormings-identity](evidence/android-2026-11-01/187-vet-dewormings-identity.png).

### A13 — P1 — Tipo de parásito admitido pero descartado

El controlador permitía parasite_type y CreateDeworming no lo asignaba: «Ambos» terminaba como «Internos». La acción conserva el valor solicitado; request spec y flujo móvil real.

### A14 — P1 — Informes usaban una ruta inexistente

Se cambia /admin/medical-reports-list por GET /admin/medical_reports. Lista, historia y apertura de informes reales comprobadas.

Evidencias: [087-admin-report-from-history](evidence/android-2026-11-01/087-admin-report-from-history.png), [198-vet-report-list-identity](evidence/android-2026-11-01/198-vet-report-list-identity.png), [199-vet-report-detail-identity](evidence/android-2026-11-01/199-vet-report-detail-identity.png).

### A15 — P1 — Vacuna independiente sin tipo obligatorio

El formulario fallaba al guardar porque no enviaba vaccine_type. Formulario completo con tipo, nombre, fabricante, lote, dosis, vía, próxima dosis y observaciones. Registro real en E2E.

Evidencias: [102-admin-vaccination-form](evidence/android-2026-11-01/102-admin-vaccination-form.png), [128-vaccine-full-form](evidence/android-2026-11-01/128-vaccine-full-form.png).

### A16 — P1 — Carga de archivos nativos fallaba antes de llegar a Rails

La subida Blob de Node pasaba, pero la foto seleccionada en Android fallaba. Archivo nativo de Expo y expo/fetch para multipart, también en comprobantes y audio. RED/GREEN con archivos locales reales y confirmación nativa con vista previa.

Evidencias: [132-vet-gallery-picker](evidence/android-2026-11-01/132-vet-gallery-picker.png), [134-vet-photo-persisted](evidence/android-2026-11-01/134-vet-photo-persisted.png), [143-vet-native-upload-result](evidence/android-2026-11-01/143-vet-native-upload-result.png), [156-owner-sees-staff-photo](evidence/android-2026-11-01/156-owner-sees-staff-photo.png), [159-owner-photo-uploaded](evidence/android-2026-11-01/159-owner-photo-uploaded.png), [185-vet-two-shared-photos](evidence/android-2026-11-01/185-vet-two-shared-photos.png).

### A17 — P1 — Transferencias de tienda sin referencia exigida

Transferencia y pago móvil no enviaban transaction_id. Campo obligatorio y envío de referencia según el contrato Rails. Prueba real de pedido por transferencia y subida de comprobante.

Evidencias: [170-public-checkout](evidence/android-2026-11-01/170-public-checkout.png).

## Agenda y paridad clínica solicitadas

Ambos perfiles abren **Calendario** por defecto. Solo se ofrecen **Calendario**
y **Semana en curso**, de lunes a domingo según la zona de la clínica. La semana
no permite ir a otras semanas. Las rutas del listado anterior quedan para
compatibilidad, sin una tercera opción visible en el selector.

La [paridad web/móvil](clinical-web-mobile-parity.md) detalla campos y endpoints.
El transporte de archivos sigue la [documentación de Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/sdk/filesystem/#uploading-files-using-expofetch).

## Validación

- Móvil: `pnpm test --runInBand`, **100 suites y 542 pruebas en verde**, salida 0.
- Rails: **124 ejemplos en verde** de contratos clínicos, calendario y consultas owner. Se usa `NO_COVERAGE=1`, modo documentado del repositorio para
  subconjuntos; esto no acredita la cobertura global del backend.
- `pnpm typecheck`, `pnpm lint` y `pnpm format`: completos sin errores.
- React Doctor sin problemas en archivos modificados. Dos avisos anteriores:
  `AdminMedicalProfileScreen` y `TreatmentStartScreen`.
- La suite mantiene HTTP real: un worker, separación de archivos para respetar
  el límite de logins y primitivas de streams/tareas de Node para respuestas
  grandes. No se desactiva el límite de Rails ni se sustituyen sus respuestas.

## Alcance de la revisión manual

Abrir una pantalla no equivale a ejecutar todas sus operaciones. Se inspeccionaron
formularios, listas, detalles, navegación y estados vacíos/error. Los flujos
clínicos, agenda, tratamiento y archivos tienen además integración real y E2E.

- **IA:** pantalla revisada en el estado real «Sin inteligencia artificial».
  Una conversación manual no está disponible con la configuración del servidor;
  sus contratos y estados de degradación sí tienen pruebas reales.
- **Servicios públicos:** `/landing` devuelve `services: []`. Se verificó el
  estado vacío sin inventar servicios publicados.
- **Transacciones:** no se borraron cuentas ni se cambiaron contraseñas del
  usuario, ni se confirmaron pagos o adopciones existentes. Las escrituras de
  integración corresponden a registros identificados como QA.
- **Recuperación y QR:** formularios, rechazo de token inválido, permisos y cámara
  real revisados. No se envió correo de recuperación ni se usó un QR privado
  de otro servidor durante la inspección manual.
- **Teclados:** el emulador utiliza ADB y Gboard con teclado físico. Se conservan
  evidencias de enfoque/tipos; no se acredita cada campo en un teléfono físico.
- **Plataformas:** revisión de Android de desarrollo; no acredita iOS o release.

Las evidencias contienen los datos sembrados y de QA del backend local.

Se retiraron las consultas de QA de fotos compartidas y sus registros preventivos.
Metro se restauró al repositorio normal, sin enlaces de QA. Rails y Vite quedan levantados.

Comprobaciones finales: [consultas owner](evidence/android-2026-11-01/220-owner-consultations-identity.png), [detalle owner](evidence/android-2026-11-01/221-owner-consultation-detail-identity.png), [referencia de transferencia](evidence/android-2026-11-01/216-transfer-reference-visible.png).
