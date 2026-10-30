import { products } from '../assets/js/data/products.js';
import {
  addProductToCart,
  getRemainingProductQuantity,
  removeProductFromCart,
  setProductQuantity,
} from '../assets/js/features/cart-actions.js';
import { clearCart, getCart } from '../assets/js/features/cart-store.js';

const log = typeof globalThis.print === 'function'
  ? globalThis.print
  : globalThis.console?.log?.bind(globalThis.console) ?? (() => {});
if (!globalThis.console) globalThis.console = { log: () => {} };

const equal = (actual, expected) => {
  if (actual !== expected) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const product = products[0];
const size = product.sizes[0];
const calls = [];
globalThis.fbq = (...args) => calls.push(args);
clearCart();

let result = addProductToCart({ product, size, quantity: 3 });
equal(result.quantityChanged, 3);
equal(getCart()[0].quantity, 3);
equal(getRemainingProductQuantity({ product, size }), 96);
equal(calls[0][1], 'AddToCart');
equal(calls[0][2].contents[0].quantity, 3);

result = setProductQuantity({ product, size, quantity: 4 });
equal(result.quantityChanged, 1);
equal(calls[1][1], 'AddToCart');
equal(calls[1][2].contents[0].quantity, 1);

result = setProductQuantity({ product, size, quantity: 2 });
equal(result.quantityChanged, -2);
equal(calls[2][1], 'RemoveFromCart');
equal(calls[2][2].contents[0].quantity, 2);

result = removeProductFromCart({ product, size });
equal(result.quantityChanged, -2);
equal(getCart().length, 0);
equal(calls[3][1], 'RemoveFromCart');
equal(calls[3][2].contents[0].quantity, 2);

result = addProductToCart({ product, size, quantity: 100 });
equal(result.quantityChanged, 99);
const callCountAtMaximum = calls.length;
result = addProductToCart({ product, size, quantity: 1 });
equal(result.quantityChanged, 0);
equal(calls.length, callCountAtMaximum);

clearCart();
log('PASS shared cart actions mutate quantities and track their actual deltas');
