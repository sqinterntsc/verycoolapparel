import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const envPath = resolve(projectRoot, '.env');
// Shell and GitHub Actions variables override the local .env file.
export const env = {
  ...(existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {}),
  ...process.env,
};

export async function writeBrowserConfig(root) {
  if (!env.BACKEND_URL?.trim()) throw new Error('Set BACKEND_URL in .env or the build environment.');
  const url = new URL(env.BACKEND_URL.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('BACKEND_URL must be an HTTP(S) base URL without credentials, query parameters or a fragment.');
  }
  // Only explicitly public settings are included in the browser bundle.
  const config = { BACKEND_URL: url.href.replace(/\/+$/, '') };
  const output = resolve(root, 'assets/js/env.js');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `// Generated from environment variables.\nglobalThis.APP_ENV = Object.freeze(${JSON.stringify(config)});\n`);
}
