/**
 * El repo se renombró a `open-chepicare-mobile` (antes `pawcare-mobile`). Este
 * test fija qué cambia y qué NO: el paquete y el APK publicado llevan el nombre
 * nuevo, pero el slug/name de Expo se mantienen (cambiarlos rompería el proyecto
 * Expo y las actualizaciones de la app ya instalada).
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Jest corre desde la raíz del repo (igual que src/testing/aiServer.ts).
const read = (file: string) => readFile(path.join(process.cwd(), file), 'utf8');

describe('identidad del repo open-chepicare-mobile', () => {
  it('usa el nombre nuevo en package.json y en el workspace de yarn.lock', async () => {
    expect(JSON.parse(await read('package.json')).name).toBe('open-chepicare-mobile');
    expect(await read('yarn.lock')).toContain('"open-chepicare-mobile@workspace:."');
  });

  it('mantiene el slug y el nombre del proyecto Expo', async () => {
    const { expo } = JSON.parse(await read('app.json'));
    expect(expo.slug).toBe('pawcare-mobile');
    expect(expo.name).toBe('pawcare-mobile');
  });

  it('el workflow de release compila, firma y publica el mismo APK con el nombre nuevo', async () => {
    const workflow = await read('.github/workflows/release-android.yml');
    expect(workflow).not.toMatch(/(?<!open-chepicare-)pawcare-mobile\.apk/);
    expect(workflow).toContain('app-release.apk open-chepicare-mobile.apk');
    expect(workflow).toContain('path: open-chepicare-mobile.apk');
    expect(
      workflow.match(/gh release create .* open-chepicare-mobile\.apk/g),
    ).toHaveLength(2);
  });
});
