import { productById } from '../data/products.js';

export const CART_STORAGE_KEY = 'very-cool-apparel:cart:v1';

export const MAX_CART_QUANTITY = 99;
const listeners = new Set();

function getStorage() {
  try {
    const storage = globalThis.localStorage;
    const probe = `${CART_STORAGE_KEY}:probe`;
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

function normalizeQuantity(value) {
  const quantity = Number.parseInt(value, 10);
  if (!Number.isFinite(quantity) || quantity < 1) return null;
  return Math.min(quantity, MAX_CART_QUANTITY);
}

function normalizeItem(value) {
  if (!value || typeof value !== 'object') return null;

  const product = productById.get(value.productId);
  const size = typeof value.size === 'string' ? value.size.toUpperCase() : '';
  const quantity = normalizeQuantity(value.quantity);

  if (!product || !product.sizes.includes(size) || quantity === null) return null;
  return { productId: product.id, size, quantity };
}

export function normalizeCart(value) {
  const source = Array.isArray(value) ? value : value?.items;
  if (!Array.isArray(source)) return [];

  const merged = new Map();
  source.forEach((candidate) => {
    const item = normalizeItem(candidate);
    if (!item) return;

    const key = cartItemKey(item.productId, item.size);
    const prior = merged.get(key)?.quantity ?? 0;
    merged.set(key, {
      ...item,
      quantity: Math.min(prior + item.quantity, MAX_CART_QUANTITY),
    });
  });

  return [...merged.values()];
}

function readCart() {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const serialized = storage.getItem(CART_STORAGE_KEY);
    return serialized ? normalizeCart(JSON.parse(serialized)) : [];
  } catch {
    return [];
  }
}

let items = readCart();

function snapshot() {
  return items.map((item) => ({ ...item }));
}

function persist() {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, items }));
  } catch {
    // The cart remains usable in memory if storage is unavailable or full.
  }
}

function emit() {
  const cart = snapshot();
  listeners.forEach((listener) => listener(cart));
}

function commit(nextItems) {
  items = normalizeCart(nextItems);
  persist();
  emit();
  return snapshot();
}

export function cartItemKey(productId, size) {
  return `${productId}::${size}`;
}

export function getCart() {
  return snapshot();
}

export function getDetailedCart() {
  return items.map((item) => ({ ...item, product: productById.get(item.productId) }));
}

export function getCartCount() {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function getCartSubtotal() {
  return getDetailedCart().reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
}

export function addItem(productId, size, quantity = 1) {
  const item = normalizeItem({ productId, size, quantity });
  if (!item) return snapshot();

  const key = cartItemKey(item.productId, item.size);
  const nextItems = snapshot();
  const existing = nextItems.find((candidate) => (
    cartItemKey(candidate.productId, candidate.size) === key
  ));

  if (existing) {
    existing.quantity = Math.min(existing.quantity + item.quantity, MAX_CART_QUANTITY);
  } else {
    nextItems.push(item);
  }

  return commit(nextItems);
}

export function setItemQuantity(productId, size, quantity) {
  const parsedQuantity = Number.parseInt(quantity, 10);
  if (!Number.isFinite(parsedQuantity)) return snapshot();
  if (parsedQuantity <= 0) {
    return removeItem(productId, size);
  }

  const key = cartItemKey(productId, size);
  const nextItems = snapshot();
  const existing = nextItems.find((candidate) => (
    cartItemKey(candidate.productId, candidate.size) === key
  ));
  if (!existing) return snapshot();

  existing.quantity = Math.min(parsedQuantity, MAX_CART_QUANTITY);
  return commit(nextItems);
}

export function removeItem(productId, size) {
  const key = cartItemKey(productId, size);
  return commit(items.filter((item) => cartItemKey(item.productId, item.size) !== key));
}

export function clearCart() {
  return commit([]);
}

export function subscribe(listener, { emitImmediately = true } = {}) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  if (emitImmediately) listener(snapshot());
  return () => listeners.delete(listener);
}

if (typeof globalThis.addEventListener === 'function') {
  globalThis.addEventListener('storage', (event) => {
    if (event.key !== CART_STORAGE_KEY && event.key !== null) return;

    try {
      items = event.newValue ? normalizeCart(JSON.parse(event.newValue)) : [];
    } catch {
      items = [];
    }
    emit();
  });
}

