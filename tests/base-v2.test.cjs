/* Run with node tests/base-v2.test.cjs. Tests real catalog bindings and preserved originals. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ROOT = path.resolve(__dirname, '..');
const dataPath = path.join(ROOT, 'assets/js/data/products.js');
const source = fs.readFileSync(dataPath, 'utf8')
  .replace(/import\.meta\.url/g, "'file://' + dataPath")
  .replace(/\bexport /g, '');
const context = vm.createContext({ URL, dataPath });
vm.runInContext(source, context, {filename: dataPath});
const products = vm.runInContext('products', context);
const version = process.env.IMAGE_VERSION || 'v3';
const label = version === 'v3' ? 'Elements render' : 'Field render';
assert.equal(products.length, 4);
for (const product of products) {
  assert.ok(product.image.endsWith(`/${product.id}/base-${version}.webp`));
  assert.equal(product.images[0].src, product.image);
  assert.equal(product.images[0].label, label);
  assert.equal(product.images[0].fit, 'cover');
  assert.ok(product.images[0].alt.includes('floating'));
  const directory = path.join(ROOT, 'assets/images/photorealistic/products', product.id);
  const filenames = ['base.webp', 'base-v2.webp', 'lifestyle-01.webp', 'lifestyle-02.webp'];
  if (version === 'v3') filenames.push('base-v3.webp');
  for (const filename of filenames) {
    const bytes = fs.readFileSync(path.join(directory, filename));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
  assert.equal(product.images.length, 3);
  assert.ok(product.images[1].src.endsWith('/lifestyle-01.webp'));
  assert.ok(product.images[2].src.endsWith('/lifestyle-02.webp'));
  console.log(`PASS ${product.id}: ${version} primary, accurate label/alt/cover, previous and on-body assets retained`);
}
const css = fs.readFileSync(path.join(ROOT, 'assets/css/components.css'), 'utf8');
assert.match(css, /\.product-card__image\s*\{[^}]*object-fit:\s*cover/);
console.log('PASS product cards fill their media frames');
