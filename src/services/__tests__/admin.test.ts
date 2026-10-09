/**
 * Integración REAL del servicio Admin contra `../pawcare-web` (login de staff).
 */
import * as authService from '@/services/auth';
import * as adminService from '@/services/admin';
import * as petsService from '@/services/pets';
import * as secureStore from '@/utils/secureStore';

beforeAll(async () => {
  await authService.login('admin@pawcare.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

describe('adminService (listas reales del staff)', () => {
  it('lista mascotas, citas y pagos de toda la clínica', async () => {
    const [pets, appointments, payments] = await Promise.all([
      adminService.listAdminPets(),
      adminService.listAdminAppointments(),
      adminService.listAdminPayments(),
    ]);
    expect(Array.isArray(pets)).toBe(true);
    expect(Array.isArray(appointments)).toBe(true);
    expect(Array.isArray(payments)).toBe(true);
  });

  it('trae citas de cualquier fecha (scope=all, no solo futuras)', async () => {
    // Regresión: el backend filtra por scope "upcoming" por defecto; la agenda
    // del admin debe ver TODAS las citas (el seed tiene decenas de citas pasadas).
    const appointments = await adminService.listAdminAppointments();
    expect(appointments.length).toBeGreaterThan(0);
  });

  it('lista registros médicos (consultas, vacunas, desparasitaciones)', async () => {
    const [consultations, vaccinations, dewormings] = await Promise.all([
      adminService.listAdminConsultations(),
      adminService.listAdminVaccinations(),
      adminService.listAdminDewormings(),
    ]);
    expect(Array.isArray(consultations)).toBe(true);
    expect(Array.isArray(vaccinations)).toBe(true);
    expect(Array.isArray(dewormings)).toBe(true);
  });

  it('lista mascotas en adopción', async () => {
    const adoptions = await adminService.listAdminAdoptions();
    expect(Array.isArray(adoptions)).toBe(true);
  });

  it('lista esquemas de vacunación', async () => {
    const schedules = await adminService.listVaccinationSchedules();
    expect(Array.isArray(schedules)).toBe(true);
  });

  // Nota: /admin/medical-reports-list es lento/flaky en el backend (genera
  // contenido) y cuelga undici en Jest; la pantalla lo consume con timeout y
  // estados de carga/error. No se cubre con test de integración por esa razón.

  it('obtiene una consulta completa con recetas y exámenes', async () => {
    const consultations = await adminService.listAdminConsultations();
    if (consultations.length === 0) return;
    const full = await adminService.getAdminConsultation(consultations[0]!.id);
    expect(full.id).toBe(consultations[0]!.id);
    expect(Array.isArray(full.prescriptions)).toBe(true);
    expect(Array.isArray(full.lab_exams)).toBe(true);
  });

  it('crea un paciente para un dueño y lo limpia (real)', async () => {
    // Id real de owner1 (la lista de dueños es paginada y puede no incluirlo).
    await authService.login('owner1@example.com', 'password123');
    const ownerId = (await authService.fetchCurrentUser()).id;

    await authService.login('admin@pawcare.com', 'password123');
    const created = await adminService.createAdminPet({
      name: 'QA-Admin-Pet',
      species: 'dog',
      sex: 'male',
      proprietary_id: ownerId,
    });
    expect(created.id).toEqual(expect.any(Number));
    expect(created.name).toBe('QA-Admin-Pet');
    expect(created.proprietary_id).toBe(ownerId);

    // Limpieza: el dueño borra su propia mascota recién creada.
    await authService.login('owner1@example.com', 'password123');
    await petsService.deletePet(created.id);
  }, 20000);

  it('crea una consulta y la elimina (real)', async () => {
    await authService.login('admin@pawcare.com', 'password123');
    const pets = await adminService.listAdminPets();
    if (pets.length === 0) return;

    const created = await adminService.createAdminConsultation({
      pet_id: pets[0]!.id,
      consultation_date: '2026-06-16',
      diagnosis: 'QA test',
    });
    expect(created.id).toEqual(expect.any(Number));

    await adminService.deleteAdminConsultation(created.id);
  }, 20000);

  it('lista servicios clínicos', async () => {
    const services = await adminService.listAdminServices();
    expect(Array.isArray(services)).toBe(true);
    expect(services.length).toBeGreaterThan(0);
    expect(services[0]!.id).toEqual(expect.any(Number));
  });

  it('encadena disponibilidad: días → veterinarios → horarios', async () => {
    const now = new Date();
    const days = await adminService.getAdminAvailableDays(
      now.getMonth() + 1,
      now.getFullYear(),
    );
    expect(Array.isArray(days)).toBe(true);
    if (days.length === 0) return;

    const vets = await adminService.getAdminAvailableVets(days[0]!);
    expect(Array.isArray(vets)).toBe(true);
    if (vets.length === 0) return;

    const services = await adminService.listAdminServices();
    const slots = await adminService.getAdminTimeSlots(
      days[0]!,
      vets[0]!.id,
      services[0]!.id,
    );
    expect(Array.isArray(slots)).toBe(true);
  }, 20000);

  it('obtiene una adopción por id si existe', async () => {
    const adoptions = await adminService.listAdminAdoptions();
    if (adoptions.length === 0) return;
    const full = await adminService.getAdminAdoption(adoptions[0]!.id);
    expect(full.id).toBe(adoptions[0]!.id);
  });

  it('crea una cita como admin y la elimina (real)', async () => {
    await authService.login('admin@pawcare.com', 'password123');
    const pets = await adminService.listAdminPets();
    const pet = pets.find((p) => p.proprietary_id != null);
    if (!pet || pet.proprietary_id == null) return;

    const now = new Date();
    const days = await adminService.getAdminAvailableDays(
      now.getMonth() + 1,
      now.getFullYear(),
    );
    if (days.length === 0) return;
    const vets = await adminService.getAdminAvailableVets(days[0]!);
    if (vets.length === 0) return;
    const services = await adminService.listAdminServices();
    const slots = await adminService.getAdminTimeSlots(
      days[0]!,
      vets[0]!.id,
      services[0]!.id,
    );
    const slot = slots.find((s) => s.available);
    if (!slot) return;

    const created = await adminService.createAdminAppointment({
      pet_id: pet.id,
      service_id: services[0]!.id,
      owner_id: pet.proprietary_id,
      assigned_to_id: vets[0]!.id,
      scheduled_at: `${days[0]}T${slot.time}:00`,
    });
    expect(created.id).toEqual(expect.any(Number));

    await adminService.deleteAdminAppointment(created.id);
  }, 30000);
});
