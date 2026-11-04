import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../assets/js/data/products.js';
import { addProductToCart, setProductQuantity, removeProductFromCart } from '../assets/js/features/cart-actions.js';
import { clearCart, getCart } from '../assets/js/features/cart-store.js';

const settle = () => new Promise(resolve => setImmediate(resolve));

test('cart additions submit real deltas, share Pixel IDs, and survive API errors', async t => {
  for (const [name, value] of Object.entries({
    APP_ENV: { BACKEND_URL: 'http://localhost:4100' },
    location: { hostname: 'localhost', href: 'http://localhost:8000/products/' },
    document: { cookie: '_fbp=fb.1.browser-id; _fbc=fb.1.click-id' },
    navigator: { userAgent: 'storefront-test-browser' },
  })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, configurable: true });
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    });
  }
  const pixelCalls = [];
  const previousPixel = globalThis.fbq;
  globalThis.fbq = (...args) => pixelCalls.push(args);
  t.after(() => { globalThis.fbq = previousPixel; clearCart(); });
  const logs = [];
  const errors = [];
  t.mock.method(console, 'log', (...args) => logs.push(args));
  t.mock.method(console, 'error', (...args) => errors.push(args));
  const requests = [];
  let status = 200;
  let responseBody = '{"events_received":1,"messages":[]}';
  let offline = false;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, options, body: JSON.parse(options.body) });
    if (offline) throw new TypeError('Failed to fetch');
    return new Response(responseBody, { status });
  });
  clearCart();
  const product = products[0];
  const size = product.sizes[0];
  const before = Math.floor(Date.now() / 1000);
  const added = addProductToCart({ product, size, quantity: 3 });
  assert.equal(added.quantityChanged, 3);
  assert.equal(getCart()[0].quantity, 3);
  assert.equal(requests.length, 1);
  const request = requests[0];
  assert.equal(request.url, 'http://localhost:4100/api/prod/AddToCart');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers['Content-Type'], 'application/json');
  assert.equal(request.options.keepalive, true);
  const event = request.body.data[0];
  assert.equal(event.event_id, pixelCalls[0][3].eventID);
  assert.match(event.event_id, /^addcart\.1111051611838188\.[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.ok(event.event_time >= before && event.event_time <= Math.floor(Date.now() / 1000));
  assert.equal(event.event_source_url, 'http://localhost:8000/products/');
  assert.deepEqual(event.user_data, { client_user_agent: 'storefront-test-browser', fbp: 'fb.1.browser-id', fbc: 'fb.1.click-id' });
  assert.deepEqual(event.custom_data, pixelCalls[0][2]);
  assert.equal(event.custom_data.value, product.price * 3);
  assert.equal(event.custom_data.contents[0].quantity, 3);
  await settle();
  assert.ok(logs.some(([label, body]) => label === '[Meta CAPI] AddToCart 200' && body.events_received === 1));

  setProductQuantity({ product, size, quantity: 4 });
  assert.equal(requests.length, 2);
  assert.notEqual(requests[1].body.data[0].event_id, event.event_id);
  assert.equal(requests[1].body.data[0].event_id, pixelCalls[1][3].eventID);
  assert.equal(requests[1].body.data[0].custom_data.contents[0].quantity, 1);
  setProductQuantity({ product, size, quantity: 2 });
  removeProductFromCart({ product, size });
  assert.equal(requests.length, 2);
  addProductToCart({ product, size, quantity: 100 });
  assert.equal(requests[2].body.data[0].custom_data.contents[0].quantity, 99);
  addProductToCart({ product, size, quantity: 1 });
  addProductToCart({ product, size: 'invalid-size' });
  assert.equal(requests.length, 3);

  // Server reporting still works when Pixel is unavailable; missing cookies are omitted.
  clearCart();
  globalThis.fbq = undefined;
  globalThis.document.cookie = '';
  globalThis.location.hostname = 'sqinterntsc.github.io';
  globalThis.location.href = 'https://sqinterntsc.github.io/verycoolapparel/products/';
  globalThis.APP_ENV.BACKEND_URL = 'https://api.storefront.example';
  addProductToCart({ product, size });
  assert.equal(requests[3].url, 'https://api.storefront.example/api/prod/AddToCart');
  assert.ok(requests[3].body.data[0].event_id);
  assert.deepEqual(requests[3].body.data[0].user_data, { client_user_agent: 'storefront-test-browser' });
  await settle();

  status = 400;
  responseBody = '{"error":{"message":"Invalid parameter","code":100}}';
  assert.equal(addProductToCart({ product, size }).quantityChanged, 1);
  await settle();
  assert.ok(errors.some(([label, body]) => label === '[Meta CAPI] AddToCart 400' && body.error.code === 100));
  offline = true;
  assert.equal(addProductToCart({ product, size }).quantityChanged, 1);
  assert.equal(getCart()[0].quantity, 3);
  await settle();
  assert.ok(errors.some(([label, error]) => label === '[Meta CAPI] AddToCart request failed' && error.message === 'Failed to fetch'));

  // A missing build config leaves the cart usable without sending to an unknown API.
  delete globalThis.APP_ENV;
  assert.equal(addProductToCart({ product, size }).quantityChanged, 1);
  assert.equal(requests.length, 6);
  assert.ok(errors.some(([label]) => label.includes('BACKEND_URL is missing')));
});
