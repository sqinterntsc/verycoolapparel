import { spawn } from 'node:child_process';
import { env, projectRoot, writeBrowserConfig } from './config.mjs';
import { generateProductPages } from './product-pages.mjs';

const port = Number(env.PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Set PORT to an integer from 1 to 65535 in .env or the shell environment.');
}
await writeBrowserConfig(projectRoot);
await generateProductPages(projectRoot, { siteUrl: env.SITE_URL });
const server = spawn('python3', ['-m', 'http.server', String(port), '--directory', projectRoot], { stdio: 'inherit' });
server.on('error', error => { console.error(error); process.exitCode = 1; });
server.on('exit', code => { process.exitCode = code ?? 0; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
