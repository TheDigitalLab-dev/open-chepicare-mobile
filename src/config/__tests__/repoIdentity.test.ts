/**
 * Identidad del repo `open-chepicare-mobile` y de la app ChepiCare: nombre
 * visible, identificadores técnicos (slug de Expo, package de Android, archivo
 * SQLite), esquema de deep link `chepicare://` y textos de permisos. El nombre
 * anterior de la marca no aparece en ningún archivo ni ruta versionados.
 */
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { DEEP_LINK_PREFIXES, DEEP_LINK_SCHEMES } from '@/config/deepLinks';
import { DATABASE_NAME } from '@/db/database';

// Jest corre desde la raíz del repo (igual que src/testing/aiServer.ts).
const read = (file: string) => readFile(path.join(process.cwd(), file), 'utf8');

async function expoConfig() {
  return JSON.parse(await read('app.json')).expo;
}

// Nombre anterior de la marca, armado por partes para que este archivo no lo contenga.
const OLD_BRAND = ['paw', 'care'].join('');

describe('identidad del repo open-chepicare-mobile', () => {
  it('usa el nombre nuevo en package.json', async () => {
    expect(JSON.parse(await read('package.json')).name).toBe('open-chepicare-mobile');
  });

  it('muestra la marca ChepiCare como nombre de la app', async () => {
    expect((await expoConfig()).name).toBe('ChepiCare');
  });

  it('usa los identificadores técnicos de ChepiCare', async () => {
    const expo = await expoConfig();
    expect(expo.slug).toBe('chepicare-mobile');
    expect(expo.android.package).toBe('com.chepicare.mobile');
    expect(expo.ios?.bundleIdentifier).toBeUndefined();
    expect(expo.owner).toBeUndefined();
    expect(expo.extra?.eas?.projectId).toBeUndefined();
  });

  it('guarda los datos locales en chepicare.db', () => {
    expect(DATABASE_NAME).toBe('chepicare.db');
  });

  it('registra solo el esquema chepicare://', async () => {
    expect(DEEP_LINK_SCHEMES).toEqual(['chepicare']);
    expect(DEEP_LINK_PREFIXES).toEqual(['chepicare://']);
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
      expect(text.toLowerCase()).not.toContain(OLD_BRAND);
    }
  });
  it('ningún archivo versionado menciona el nombre anterior (ni en su ruta)', () => {
    const git = (args: string[]) =>
      execFileSync('git', args, { cwd: process.cwd(), encoding: 'utf8' });
    const paths = git(['ls-files']).split('\n');
    expect(paths.filter((file) => file.toLowerCase().includes(OLD_BRAND))).toEqual([]);
    // `git grep` sale con 1 cuando no hay coincidencias (lo esperado).
    let matches = '';
    try {
      matches = git(['grep', '-I', '-i', '-l', OLD_BRAND]);
    } catch (error) {
      if ((error as { status?: number }).status !== 1) throw error;
    }
    expect(matches.split('\n').filter(Boolean)).toEqual([]);
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
    expect(workflow.toLowerCase()).not.toContain(OLD_BRAND);
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
    expect(firstSecret).toBeGreaterThan(code.lastIndexOf('pnpm install'));
    expect(code).not.toMatch(/if: env\.KEYSTORE_BASE64/);
  });
});
