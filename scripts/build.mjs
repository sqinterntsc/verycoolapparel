import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { env, projectRoot, writeBrowserConfig } from './config.mjs';
import { generateProductPages } from './product-pages.mjs';

const output = resolve(projectRoot, '_site');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of ['index.html', 'products', 'assets']) {
  await cp(resolve(projectRoot, entry), resolve(output, entry), { recursive: true });
}
await writeBrowserConfig(output);
await generateProductPages(output, { siteUrl: env.SITE_URL });
console.log('Site built in _site/');
