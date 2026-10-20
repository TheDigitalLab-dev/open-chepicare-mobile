/**
 * El repo usa pnpm (antes Yarn 4). Este test fija lo que la migración debe
 * conservar:
 * - un único gestor y lockfile (pnpm-lock.yaml), fijado con corepack;
 * - `node-linker=hoisted` (node_modules plano, lo que Expo/Metro esperan);
 * - typescript-eslint sigue con su copia de TypeScript 6 y `tsc` con el 7;
 * - CI, hook pre-push y docs operativos llaman a pnpm, no a yarn/npx.
 */
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

// Jest corre desde la raíz del repo (igual que src/testing/aiServer.ts).
const root = process.cwd();
const read = (file: string) => readFile(path.join(root, file), 'utf8');
const exists = (file: string) =>
  stat(path.join(root, file)).then(
    () => true,
    () => false,
  );

async function packageJson() {
  return JSON.parse(await read('package.json'));
}

/**
 * Versión de `typescript` que carga `require('typescript')` desde el paquete
 * instalado `from`: con node_modules plano, Node mira primero la copia anidada
 * del paquete y si no existe, la de la raíz.
 */
async function typescriptVersionFrom(from: string): Promise<string> {
  const nested = `node_modules/${from}/node_modules/typescript/package.json`;
  const file = (await exists(nested)) ? nested : 'node_modules/typescript/package.json';
  return JSON.parse(await read(file)).version;
}

describe('gestor de paquetes pnpm', () => {
  it('fija pnpm con corepack y deja un solo lockfile', async () => {
    expect((await packageJson()).packageManager).toMatch(/^pnpm@10\.\d+\.\d+\+sha/);
    expect(await exists('pnpm-lock.yaml')).toBe(true);
    for (const legacy of ['yarn.lock', '.yarnrc.yml', 'package-lock.json']) {
      expect(await exists(legacy)).toBe(false);
    }
  });

  it('instala node_modules plano (node-linker=hoisted) para Expo/Metro', async () => {
    const npmrc = await read('.npmrc');
    expect(npmrc).toMatch(/^node-linker=hoisted$/m);
    // El store compartido entre proyectos/worktrees no se redefine por repo.
    expect(npmrc).not.toMatch(/store-dir|shamefully-hoist/);
  });

  it('declara qué paquetes con scripts de instalación no necesitan build', async () => {
    const { pnpm } = await packageJson();
    expect(pnpm.ignoredBuiltDependencies).toEqual(['msgpackr-extract', 'unrs-resolver']);
  });

  it('declara babel-preset-expo, que babel.config.js referencia', async () => {
    const pkg = await packageJson();
    expect(await read('babel.config.js')).toContain("'babel-preset-expo'");
    expect(pkg.devDependencies['babel-preset-expo']).toBeDefined();
  });

  it('typescript-eslint usa TypeScript 6 y tsc usa TypeScript 7', async () => {
    const { pnpm, devDependencies } = await packageJson();
    expect(pnpm.packageExtensions['eslint-config-expo'].dependencies.typescript).toBe(
      '~6.0.3',
    );
    expect(devDependencies.typescript).toMatch(/^7\./);

    expect(
      JSON.parse(await read('node_modules/typescript/package.json')).version,
    ).toMatch(/^7\./);
    for (const lintPackage of [
      '@typescript-eslint/parser',
      '@typescript-eslint/typescript-estree',
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/type-utils',
      'ts-api-utils',
    ]) {
      expect(await typescriptVersionFrom(lintPackage)).toMatch(/^6\.0\./);
    }
  });
});

describe('herramientas del repo llaman a pnpm', () => {
  const YARN_OR_NPX = /\b(yarn|npx)\b/;

  it('los scripts de package.json no usan yarn ni npx', async () => {
    const { scripts } = await packageJson();
    for (const command of Object.values<string>(scripts)) {
      expect(command).not.toMatch(YARN_OR_NPX);
    }
    expect(scripts.doctor).toBe('pnpm dlx react-doctor@latest --no-score');
  });

  it('el hook pre-push corre las compuertas con pnpm', async () => {
    const hook = await read('.husky/pre-push');
    expect(hook).not.toMatch(YARN_OR_NPX);
    for (const gate of ['lint:fix', 'format', 'lint', 'typecheck']) {
      expect(hook).toContain(`pnpm ${gate}`);
    }
  });

  it('el workflow de release instala con pnpm y lockfile congelado', async () => {
    const workflow = await read('.github/workflows/release-android.yml');
    const code = workflow
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .join('\n');
    expect(code).not.toMatch(YARN_OR_NPX);
    expect(code.match(/uses: pnpm\/action-setup@/g)).toHaveLength(2);
    expect(code.match(/cache: pnpm/g)).toHaveLength(2);
    expect(code.match(/run: pnpm install --frozen-lockfile/g)).toHaveLength(2);
    expect(code).toContain('pnpm exec expo prebuild --platform android --no-install');
    // pnpm/action-setup debe ir antes de setup-node para que la caché lo encuentre.
    expect(code.indexOf('pnpm/action-setup')).toBeLessThan(
      code.indexOf('actions/setup-node'),
    );
  });

  it('AGENTS.md y README documentan los comandos con pnpm', async () => {
    for (const doc of ['AGENTS.md', 'README.md']) {
      const text = await read(doc);
      expect(text).not.toMatch(/`(yarn|npx) /);
      expect(text).toContain('pnpm test');
    }
  });
});
