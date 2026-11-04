import {
  addItem,
  getCart,
  MAX_CART_QUANTITY,
  setItemQuantity,
} from './cart-store.js';
import { trackAddToCart, trackRemoveFromCart } from '../utils/meta-events.js';

const logTrackedMetaEvent = ({ eventName, eventID, eventPayload }) => {
  console.log(`[Meta Pixel] ${eventName} queued`, {
    eventID,
    eventPayload,
  });
};

function getQuantity(productId, size, cart = getCart()) {
  return cart.find((item) => item.productId === productId && item.size === size)?.quantity ?? 0;
}

export function getRemainingProductQuantity({ product, size }) {
  if (!product || !size) return MAX_CART_QUANTITY;
  return MAX_CART_QUANTITY - getQuantity(product.id, size);
}

function trackQuantityChange({ product, size, quantityChange }) {
  if (!quantityChange) return null;

  const track = quantityChange > 0 ? trackAddToCart : trackRemoveFromCart;
  const event = track({
    productId: product.id,
    productName: product.name,
    category: product.categoryLabel,
    size,
    price: product.price,
    quantity: Math.abs(quantityChange),
    currency: 'USD',
    onTracked: logTrackedMetaEvent,
  });

  if (quantityChange > 0) {
    const backend = globalThis.APP_ENV?.BACKEND_URL;
    if (!backend) {
      console.error('[Meta CAPI] BACKEND_URL is missing. Generate the environment config before serving the site.');
      return event;
    }
    const userData = { client_user_agent: globalThis.navigator?.userAgent };
    const cookies = globalThis.document?.cookie || '';
    for (const [cookieName, field] of [['_fbp', 'fbp'], ['_fbc', 'fbc']]) {
      const value = cookies.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]*)`))?.[1];
      if (value) userData[field] = value;
    }

    // Reporting runs asynchronously so a failed API call does not interrupt the cart.
    fetch(`${backend}/api/prod/AddToCart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ data: [{
        event_id: event.eventID,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: globalThis.location?.href,
        user_data: userData,
        custom_data: event.eventPayload,
      }] }),
    }).then(async response => {
      const text = await response.text();
      let body = text;
      try { body = JSON.parse(text); } catch { /* Preserve non-JSON error responses. */ }
      const log = response.ok ? console.log : console.error;
      log(`[Meta CAPI] AddToCart ${response.status}`, body);
    }).catch(error => console.error('[Meta CAPI] AddToCart request failed', error));
  }
  return event;
}

export function addProductToCart({ product, size, quantity = 1 }) {
  if (!product || !size) return { cart: getCart(), quantityChanged: 0 };

  const previousQuantity = getQuantity(product.id, size);
  const cart = addItem(product.id, size, quantity);
  const quantityChanged = getQuantity(product.id, size, cart) - previousQuantity;
  trackQuantityChange({ product, size, quantityChange: quantityChanged });

  return { cart, quantityChanged };
}

export function setProductQuantity({ product, size, quantity }) {
  if (!product || !size) return { cart: getCart(), quantityChanged: 0 };

  const previousQuantity = getQuantity(product.id, size);
  const cart = setItemQuantity(product.id, size, quantity);
  const quantityChanged = getQuantity(product.id, size, cart) - previousQuantity;
  trackQuantityChange({ product, size, quantityChange: quantityChanged });

  return { cart, quantityChanged };
}

export function removeProductFromCart({ product, size }) {
  return setProductQuantity({ product, size, quantity: 0 });
}
