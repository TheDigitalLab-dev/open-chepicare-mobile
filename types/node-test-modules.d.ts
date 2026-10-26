/**
 * Declaraciones mínimas de módulos de Node usados SOLO por los tests de
 * integración y su soporte (`src/testing`): ids aleatorios y el candado en
 * disco que serializa los archivos que cambian la configuración de IA, y `git`
 * para revisar los archivos versionados (`repoIdentity.test.ts`).
 */
declare module 'node:child_process' {
  export function execFileSync(
    file: string,
    args: string[],
    options: { cwd?: string; encoding: 'utf8' },
  ): string;
}

declare module 'node:crypto' {
  export function randomUUID(): string;
}

declare module 'node:fs/promises' {
  export function mkdir(
    path: string,
    options?: { recursive?: boolean },
  ): Promise<unknown>;
  export function rm(
    path: string,
    options?: { recursive?: boolean; force?: boolean },
  ): Promise<void>;
  export function stat(path: string): Promise<{ mtimeMs: number }>;
  export function readFile(path: string, encoding: 'utf8'): Promise<string>;
}

declare module 'node:path' {
  const path: {
    join(...parts: string[]): string;
    dirname(p: string): string;
  };
  export default path;
}
