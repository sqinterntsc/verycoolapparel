import {
  getCartCount,
  getCartSubtotal,
  getDetailedCart,
  MAX_CART_QUANTITY,
  removeItem,
  setItemQuantity,
  subscribe,
} from './cart-store.js';
import { formatCurrency } from '../utils/currency.js';
import { createDialogMotion } from '../utils/motion.js';

const catalogUrl = new URL('../../../products/', import.meta.url).href;

function updateCartCounts() {
  const count = getCartCount();
  document.querySelectorAll('[data-cart-count]').forEach((element) => {
    element.textContent = String(count);
    element.setAttribute('aria-live', 'polite');
    const opener = element.matches('[data-cart-open]')
      ? element
      : element.closest('[data-cart-open]');
    const label = `Open bag, ${count} ${count === 1 ? 'item' : 'items'}`;
    (opener ?? element).setAttribute('aria-label', label);
  });
}

function cartItemMarkup(item) {
  const { product, size, quantity } = item;
  const row = document.createElement('li');
  row.className = 'cart-item';
  row.dataset.productId = product.id;
  row.dataset.size = size;
  row.innerHTML = `
    <img class="cart-item__image" src="${product.image}" alt="${product.imageAlt}">
    <div class="cart-item__details">
      <h3 class="cart-item__title"></h3>
      <p class="cart-item__variant"></p>
      <p class="cart-item__price"></p>
      <div class="cart-item__quantity" aria-label="Quantity controls">
        <button type="button" data-cart-action="decrease" aria-label="Decrease quantity">−</button>
        <span class="cart-item__quantity-value" aria-live="polite"></span>
        <button type="button" data-cart-action="increase" aria-label="Increase quantity">+</button>
      </div>
      <button class="cart-item__remove" type="button" data-cart-action="remove">Remove</button>
    </div>`;
  row.querySelector('.cart-item__title').textContent = product.name;
  row.querySelector('.cart-item__variant').textContent = `${product.color} · Size ${size}`;
  row.querySelector('.cart-item__price').textContent = formatCurrency(product.price * quantity);
  row.querySelector('.cart-item__quantity-value').textContent = String(quantity);
  const decrease = row.querySelector('[data-cart-action="decrease"]');
  const increase = row.querySelector('[data-cart-action="increase"]');
  decrease.setAttribute('aria-label', `Decrease ${product.name}, size ${size}, quantity`);
  increase.setAttribute('aria-label', `Increase ${product.name}, size ${size}, quantity`);
  increase.disabled = quantity >= MAX_CART_QUANTITY;
  if (increase.disabled) increase.title = `Maximum quantity is ${MAX_CART_QUANTITY}`;
  row.querySelector('[data-cart-action="remove"]').setAttribute(
    'aria-label',
    `Remove ${product.name}, size ${size}, from bag`,
  );
  return row;
}

export function initCartUI({ root } = {}) {
  updateCartCounts();
  if (!root) {
    const unsubscribe = subscribe(updateCartCounts, { emitImmediately: false });
    return { open: () => {}, close: () => {}, destroy: unsubscribe };
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'cart-drawer';
  dialog.setAttribute('aria-labelledby', 'cart-drawer-title');
  dialog.innerHTML = `
    <div class="cart-drawer__surface">
      <header class="cart-drawer__header">
        <h2 id="cart-drawer-title">Your bag</h2>
        <button class="cart-drawer__close" type="button" aria-label="Close bag">Close</button>
      </header>
      <div class="cart-drawer__body">
        <div class="cart-drawer__empty" hidden>
          <p>Your bag is ready for something good.</p>
          <a class="cart-drawer__continue" href="${catalogUrl}">Continue shopping</a>
        </div>
        <ul class="cart-drawer__items" aria-label="Bag items"></ul>
      </div>
      <footer class="cart-drawer__footer">
        <div class="cart-drawer__subtotal">
          <span>Subtotal</span>
          <strong data-cart-subtotal aria-live="polite" aria-atomic="true"></strong>
        </div>
        <p class="cart-drawer__checkout-note">Demonstration store — checkout does not take payment.</p>
        <button class="cart-drawer__checkout" type="button">Demo checkout — no payment</button>
        <p class="cart-drawer__message" role="status" hidden></p>
      </footer>
      <p class="cart-drawer__announcer" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;
  root.append(dialog);

  const closeButton = dialog.querySelector('.cart-drawer__close');
  const empty = dialog.querySelector('.cart-drawer__empty');
  const list = dialog.querySelector('.cart-drawer__items');
  const footer = dialog.querySelector('.cart-drawer__footer');
  const subtotal = dialog.querySelector('[data-cart-subtotal]');
  const checkout = dialog.querySelector('.cart-drawer__checkout');
  const message = dialog.querySelector('.cart-drawer__message');
  const announcer = dialog.querySelector('.cart-drawer__announcer');
  const motion = createDialogMotion(dialog, closeButton);
  let previousCount = null;

  function captureListFocus() {
    const activeElement = document.activeElement;
    const activeRow = activeElement?.closest?.('.cart-item');
    if (!activeRow || !list.contains(activeRow)) return null;

    const rows = [...list.querySelectorAll('.cart-item')];
    return {
      productId: activeRow.dataset.productId,
      size: activeRow.dataset.size,
      action: activeElement.dataset.cartAction,
      index: rows.indexOf(activeRow),
    };
  }

  function restoreListFocus(focusState) {
    if (!focusState) return;
    const rows = [...list.querySelectorAll('.cart-item')];
    const sameRow = rows.find((row) => (
      row.dataset.productId === focusState.productId && row.dataset.size === focusState.size
    ));
    const sameControl = sameRow?.querySelector(`[data-cart-action="${focusState.action}"]`);
    if (sameControl && !sameControl.disabled) {
      sameControl.focus();
      return;
    }
    if (sameRow) {
      sameRow.querySelector('button:not(:disabled)')?.focus();
      return;
    }

    const nearestRow = rows[Math.min(focusState.index, rows.length - 1)];
    if (nearestRow) {
      nearestRow.querySelector('button:not(:disabled)')?.focus();
    } else {
      dialog.querySelector('.cart-drawer__continue')?.focus();
    }
  }

  function render() {
    const focusState = captureListFocus();
    const detailedCart = getDetailedCart();
    const count = getCartCount();
    const isEmpty = detailedCart.length === 0;
    empty.hidden = !isEmpty;
    list.hidden = isEmpty;
    footer.hidden = isEmpty;
    list.replaceChildren(...detailedCart.map(cartItemMarkup));
    subtotal.textContent = formatCurrency(getCartSubtotal());
    message.hidden = true;
    updateCartCounts();
    restoreListFocus(focusState);

    if (dialog.open && previousCount !== null && count !== previousCount) {
      announcer.textContent = count
        ? `${count} ${count === 1 ? 'item' : 'items'} in your bag. Subtotal ${formatCurrency(getCartSubtotal())}.`
        : 'Your bag is empty.';
    }
    previousCount = count;
  }

  function open(trigger = document.activeElement) {
    render();
    motion.open(trigger);
  }

  function close() {
    motion.close();
  }

  document.querySelectorAll('[data-cart-open]').forEach((button) => {
    button.addEventListener('click', () => open(button));
  });
  closeButton.addEventListener('click', close);
  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-action]');
    const row = button?.closest('.cart-item');
    if (!button || !row) return;

    const item = getDetailedCart().find((candidate) => (
      candidate.productId === row.dataset.productId && candidate.size === row.dataset.size
    ));
    if (!item) return;

    switch (button.dataset.cartAction) {
      case 'increase':
        setItemQuantity(item.productId, item.size, item.quantity + 1);
        break;
      case 'decrease':
        setItemQuantity(item.productId, item.size, item.quantity - 1);
        break;
      case 'remove':
        removeItem(item.productId, item.size);
        break;
      default:
        break;
    }
  });
  checkout.addEventListener('click', () => {
    message.textContent = 'This is a storefront demonstration. No payment or order has been created.';
    message.hidden = false;
    message.focus?.();
  });

  const unsubscribe = subscribe(render);
  return { open, close, dialog, destroy: unsubscribe };
}

