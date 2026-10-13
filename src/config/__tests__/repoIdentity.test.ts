/**
 * El repo se renombró a `open-chepicare-mobile` (antes `pawcare-mobile`) y la
 * marca pasó de PawCare a ChepiCare. Este test fija qué cambia y qué NO:
 * - cambia lo visible: nombre mostrado de la app, textos de permisos, APK
 *   publicado y el esquema principal de deep link (`chepicare://`);
 * - se conserva la identidad de la app instalada: `expo.slug` y
 *   `android.package` (cambiarlos crea OTRA app y rompe las actualizaciones), y
 *   el esquema `pawcare://` sigue registrado para los QR ya emitidos, y el
 *   archivo SQLite local conserva su nombre (ahí están los datos sin sincronizar).
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { DEEP_LINK_PREFIXES, DEEP_LINK_SCHEMES } from '@/config/deepLinks';
import { DATABASE_NAME } from '@/db/database';

// Jest corre desde la raíz del repo (igual que src/testing/aiServer.ts).
const read = (file: string) => readFile(path.join(process.cwd(), file), 'utf8');

async function expoConfig() {
  return JSON.parse(await read('app.json')).expo;
}

describe('identidad del repo open-chepicare-mobile', () => {
  it('usa el nombre nuevo en package.json y en el workspace de yarn.lock', async () => {
    expect(JSON.parse(await read('package.json')).name).toBe('open-chepicare-mobile');
    expect(await read('yarn.lock')).toContain('"open-chepicare-mobile@workspace:."');
  });

  it('muestra la marca ChepiCare como nombre de la app', async () => {
    expect((await expoConfig()).name).toBe('ChepiCare');
  });

  it('conserva los identificadores técnicos de la app instalada', async () => {
    const expo = await expoConfig();
    expect(expo.slug).toBe('pawcare-mobile');
    expect(expo.android.package).toBe('com.pawcare.mobile');
    expect(expo.ios?.bundleIdentifier).toBeUndefined();
    expect(expo.owner).toBeUndefined();
    expect(expo.extra?.eas?.projectId).toBeUndefined();
  });

  it('conserva el archivo SQLite con los datos locales (pawcare.db)', () => {
    expect(DATABASE_NAME).toBe('pawcare.db');
  });

  it('registra chepicare:// (principal) y pawcare:// (QR ya emitidos)', async () => {
    expect(DEEP_LINK_SCHEMES).toEqual(['chepicare', 'pawcare']);
    expect(DEEP_LINK_PREFIXES).toEqual(['chepicare://', 'pawcare://']);
    expect((await expoConfig()).scheme).toEqual(DEEP_LINK_SCHEMES);
  });

  it('los textos de permisos hablan de ChepiCare', async () => {
    const plugins: unknown[] = (await expoConfig()).plugins;
    const texts = plugins
      .filter((p): p is [string, Record<string, unknown>] => Array.isArray(p))
      .flatMap(([, options]) =>
        Object.entries(options)
          .filter(([key]) => key.endsWith('Permission'))
          .map(([, value]) => String(value)),
      );
    expect(texts.length).toBe(3);
    for (const text of texts) {
      expect(text).toMatch(/^ChepiCare /);
      expect(text).not.toMatch(/pawcare/i);
    }
  });
});

describe('workflow de release Android', () => {
  it('compila y firma chepicare.apk y publica también el nombre anterior', async () => {
    const workflow = await read('.github/workflows/release-android.yml');
    expect(workflow).toContain('app-release.apk chepicare.apk');
    expect(workflow).toContain('path: chepicare.apk');
    // Firma ANTES de copiar: ambos archivos llevan la misma firma.
    const sign = workflow.indexOf('apksigner" sign');
    const copy = workflow.indexOf('cp chepicare.apk open-chepicare-mobile.apk');
    expect(sign).toBeGreaterThan(0);
    expect(copy).toBeGreaterThan(sign);
    // Los enlaces a /releases/latest/download/open-chepicare-mobile.apk siguen
    // funcionando: cada release adjunta ambos nombres.
    expect(
      workflow.match(/gh release create .* chepicare\.apk open-chepicare-mobile\.apk/g),
    ).toHaveLength(2);
    expect(workflow).not.toMatch(/(?<!open-chepicare-)pawcare-mobile\.apk/);
    expect(workflow).not.toMatch(/--title "Pawcare/);
    expect(workflow.match(/--title "ChepiCare móvil/g)).toHaveLength(2);
  });

  it('los secrets de firma solo llegan a los pasos de firma, nunca al install ni al build', async () => {
    const workflow = await read('.github/workflows/release-android.yml');
    const code = workflow
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .join('\n');
    const firstSecret = code.indexOf('secrets.');
    expect(firstSecret).toBeGreaterThan(code.indexOf('./gradlew assembleRelease'));
    expect(firstSecret).toBeGreaterThan(code.lastIndexOf('yarn install'));
    expect(code).not.toMatch(/if: env\.KEYSTORE_BASE64/);
  });
});
