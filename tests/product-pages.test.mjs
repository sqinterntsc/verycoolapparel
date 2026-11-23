import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { products } from '../assets/js/data/products.js';
import { generateProductPages } from '../scripts/product-pages.mjs';
import { trackViewContent } from '../assets/js/utils/meta-events.js';

test('static pages contain all product content and working metadata under a repository prefix', async () => {
  const output = await mkdtemp(join(tmpdir(), 'verycoolapparel-products-'));
  try {
    assert.equal(await generateProductPages(output, { siteUrl: 'https://example.com/verycoolapparel' }), 4);
    assert.deepEqual((await readdir(join(output, 'products'))).sort(), [
      'altitude-fleece', 'contour-merino', 'strata-shell', 'traverse-short',
    ]);
    for (const product of products) {
      const html = await readFile(join(output, 'products', product.id, 'index.html'), 'utf8');
      assert.ok(html.includes(`<h1 class="product-dialog__title" id="product-title">${product.name}</h1>`));
      assert.ok(html.includes(product.description));
      assert.ok(html.includes(`data-product-page="${product.id}"`));
      assert.ok(html.includes(`href="https://example.com/verycoolapparel/products/${product.id}/"`));
      assert.ok(html.includes(`content="https://example.com/verycoolapparel/assets/images/photorealistic/products/${product.id}/base-v3.webp"`));
      assert.equal((html.match(/fbq\('track', 'PageView'\)/g) || []).length, 1);
      assert.equal((html.match(/data-product-size=/g) || []).length, product.sizes.length);
      assert.ok(!html.includes('{{'));
      assert.ok(!html.includes('file:'));
      for (const image of product.images) await access(new URL(image.src));
    }
    // Running the generator again must preserve unrelated product work.
    const { mkdir, writeFile } = await import('node:fs/promises');
    await mkdir(join(output, 'products', 'isotherm-gaiter'));
    await writeFile(join(output, 'products', 'isotherm-gaiter', 'keep.txt'), 'untouched');
    await generateProductPages(output);
    assert.equal(await readFile(join(output, 'products', 'isotherm-gaiter', 'keep.txt'), 'utf8'), 'untouched');
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test('ViewContent identifies every implemented product and tolerates an unavailable Pixel', () => {
  const prior = globalThis.fbq;
  const calls = [];
  try {
    globalThis.fbq = (...args) => calls.push(args);
    for (const product of products) trackViewContent({ product });
    assert.equal(calls.length, 4);
    calls.forEach(([method, event, payload], index) => {
      assert.equal(method, 'track');
      assert.equal(event, 'ViewContent');
      assert.deepEqual(payload.content_ids, [products[index].id]);
      assert.equal(payload.content_name, products[index].name);
      assert.equal(payload.value, products[index].price);
      assert.equal(payload.currency, 'USD');
      assert.equal(payload.content_type, 'product');
    });
    delete globalThis.fbq;
    assert.equal(trackViewContent({ product: products[0] }), null);
  } finally {
    if (prior === undefined) delete globalThis.fbq;
    else globalThis.fbq = prior;
  }
});
