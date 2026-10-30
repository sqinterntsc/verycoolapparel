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
  return track({
    productId: product.id,
    productName: product.name,
    category: product.categoryLabel,
    size,
    price: product.price,
    quantity: Math.abs(quantityChange),
    currency: 'USD',
    onTracked: logTrackedMetaEvent,
  });
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
