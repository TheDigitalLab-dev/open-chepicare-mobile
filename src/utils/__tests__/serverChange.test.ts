/**
 * Texto que explica el cambio de servidor antes de confirmarlo.
 */
import { serverChangeExplanation } from '@/utils/serverChange';

const base = {
  currentUrl: 'https://clinica-a.example.com',
  targetUrl: 'https://clinica-b.example.com',
  currentClinicName: null,
  hasSession: true,
};

describe('serverChangeExplanation', () => {
  it('muestra ambos servidores y el nombre de la clínica actual si se conoce', () => {
    const text = serverChangeExplanation({
      ...base,
      currentClinicName: 'Clínica Huellitas',
    });
    expect(text.current).toBe('Clínica Huellitas (https://clinica-a.example.com)');
    expect(text.target).toBe('https://clinica-b.example.com');

    const plain = serverChangeExplanation(base);
    expect(plain.current).toBe('https://clinica-a.example.com');
  });

  it('explica qué es un servidor, qué pasa al cambiar y cuándo hacerlo', () => {
    const { about, consequence, advice } = serverChangeExplanation(base);
    const all = [about, consequence, advice].join('\n');
    expect(all).toMatch(/código abierto/);
    expect(all).toMatch(/cada clínica tiene su propio servidor/i);
    expect(all).toMatch(/se cerrará tu sesión/);
    expect(all).toMatch(/dejarás de recibir notificaciones/);
    expect(all).toMatch(/solo si te lo indicó tu clínica/i);
  });

  it('sin sesión abierta no promete cerrar nada', () => {
    const { about, consequence, advice } = serverChangeExplanation({
      ...base,
      hasSession: false,
    });
    const all = [about, consequence, advice].join('\n');
    expect(all).not.toMatch(/se cerrará tu sesión/);
    expect(all).toMatch(/no hay ninguna sesión abierta/i);
    expect(all).toMatch(/solo si te lo indicó tu clínica/i);
  });

  it('restablecer a un build sin servidor por defecto lo dice', () => {
    expect(serverChangeExplanation({ ...base, targetUrl: '' }).target).toBe(
      'Ninguno (tendrás que configurar uno)',
    );
  });
});
