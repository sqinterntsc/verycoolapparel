import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { projectRoot, writeBrowserConfig } from './config.mjs';

const output = resolve(projectRoot, '_site');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of ['index.html', 'products', 'assets']) {
  await cp(resolve(projectRoot, entry), resolve(output, entry), { recursive: true });
}
await writeBrowserConfig(output);
console.log('Site built in _site/');
