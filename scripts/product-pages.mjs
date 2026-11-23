import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { products } from '../assets/js/data/products.js';
import { formatCurrency } from '../assets/js/utils/currency.js';

const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const assetPath = (fileUrl) => relative(sourceRoot, fileURLToPath(fileUrl)).split('\\').join('/');

export async function generateProductPages(outputRoot, { siteUrl = '' } = {}) {
  const template = await readFile(new URL('./templates/product.html', import.meta.url), 'utf8');
  let baseUrl = null;
  if (siteUrl.trim()) {
    baseUrl = new URL(`${siteUrl.trim().replace(/\/+$/, '')}/`);
    if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) {
      throw new Error('SITE_URL must be an HTTP(S) storefront base URL without credentials, query parameters or a fragment.');
    }
  }

  // Only the implemented collection data is used; unrelated image directories are untouched.
  for (const product of products) {
    const imagePath = assetPath(product.image);
    const values = Object.fromEntries(Object.entries({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      formattedPrice: formatCurrency(product.price),
      categoryLabel: product.categoryLabel,
      color: product.color,
      image: `../../${imagePath}`,
      imageAlt: product.imageAlt,
      canonical: baseUrl ? new URL(`products/${product.id}/`, baseUrl).href : './',
      socialImage: baseUrl ? new URL(imagePath, baseUrl).href : `../../${imagePath}`,
    }).map(([key, value]) => [key, escapeHtml(value)]));
    values.specs = product.specs.map(({ label, value }) => `
          <div class="product-dialog__spec"><dt class="product-dialog__spec-label">${escapeHtml(label)}</dt><dd class="product-dialog__spec-value">${escapeHtml(value)}</dd></div>`).join('');
    values.sizes = product.sizes.map((size) => `
            <button class="product-dialog__size" type="button" data-product-size="${escapeHtml(size)}" aria-pressed="false" disabled>${escapeHtml(size)}</button>`).join('');
    const html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (!(key in values)) throw new Error(`Unknown product template field: ${key}`);
      return values[key];
    });
    const directory = resolve(outputRoot, 'products', product.id);
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, 'index.html'), html);
  }
  return products.length;
}
