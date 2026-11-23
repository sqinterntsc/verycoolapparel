import { env, projectRoot } from './config.mjs';
import { generateProductPages } from './product-pages.mjs';

const count = await generateProductPages(projectRoot, { siteUrl: env.SITE_URL });
console.log(`Generated ${count} static product pages.`);
