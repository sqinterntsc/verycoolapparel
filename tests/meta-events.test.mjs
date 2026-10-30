import {
  trackAddToCart,
  trackRemoveFromCart,
} from '../assets/js/utils/meta-events.js';

const log = globalThis.console?.log?.bind(globalThis.console) || globalThis.print || (() => {});

const equal = (actual, expected) => {
  if (actual !== expected) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const products = [
  { id: 'traverse-short', name: 'Traverse Short', category: 'Bottoms', price: 98 },
  { id: 'contour-merino', name: 'Contour Merino LS', category: 'Base layers', price: 128 },
  { id: 'altitude-fleece', name: 'Altitude Grid Fleece', category: 'Mid layers', price: 188 },
  { id: 'strata-shell', name: 'Strata 3L Shell', category: 'Shells', price: 348 },
];
const calls = [];
const callbackCalls = [];
globalThis.fbq = (...args) => calls.push(args);

products.forEach((product, index) => {
  const trackedEvent = trackAddToCart({
    productId: product.id,
    productName: product.name,
    category: product.category,
    size: 'M',
    price: product.price,
    quantity: 1,
    currency: 'USD',
    onTracked: (event) => callbackCalls.push(event),
  });
  const call = calls[index];

  equal(call[0], 'track');
  equal(call[1], 'AddToCart');
  equal(call[2].content_ids[0], product.id);
  equal(call[2].contents[0].item_price, product.price);
  equal(call[2].value, product.price);
  equal(call[2].currency, 'USD');
  equal(call[2].product_size, 'M');
  equal(call[3].eventID, trackedEvent.eventID);
  equal(callbackCalls[index].eventPayload, trackedEvent.eventPayload);
});

equal(calls.length, products.length);
log('PASS AddToCart payloads for all products');

products.forEach((product, index) => {
  const trackedEvent = trackRemoveFromCart({
    productId: product.id,
    productName: product.name,
    category: product.category,
    size: 'M',
    price: product.price,
    quantity: 2,
    currency: 'USD',
    onTracked: (event) => callbackCalls.push(event),
  });
  const call = calls[products.length + index];

  equal(call[0], 'trackCustom');
  equal(call[1], 'RemoveFromCart');
  equal(call[2].content_ids[0], product.id);
  equal(call[2].contents[0].quantity, 2);
  equal(call[2].value, product.price * 2);
  equal(call[3].eventID, trackedEvent.eventID);
  equal(callbackCalls[products.length + index].eventPayload, trackedEvent.eventPayload);
});

equal(calls.length, products.length * 2);
log('PASS RemoveFromCart payloads for all products');
