import { MAX_CART_QUANTITY } from './cart-store.js';
import { addProductToCart, getRemainingProductQuantity } from './cart-actions.js';
import { createDialogMotion } from '../utils/motion.js';
import { formatCurrency } from '../utils/currency.js';
import { initProductGallery } from './product-gallery.js';

function element(tag, className, text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function initProductDialog({ root, onAdded = () => {} } = {}) {
  if (!root) return { open: () => {}, close: () => {} };

  const dialog = element('dialog', 'product-dialog');
  dialog.setAttribute('aria-labelledby', 'product-dialog-title');
  dialog.innerHTML = `
    <div class="product-dialog__surface">
      <button class="product-dialog__close" type="button" aria-label="Close quick shop">Close</button>
      <div class="product-dialog__layout">
        <div class="product-dialog__media"></div>
        <div class="product-dialog__details">
          <p class="product-dialog__eyebrow"></p>
          <h2 class="product-dialog__title" id="product-dialog-title"></h2>
          <p class="product-dialog__price"></p>
          <p class="product-dialog__description"></p>
          <dl class="product-dialog__specs"></dl>
          <fieldset class="product-dialog__size-fieldset">
            <legend>Choose a size</legend>
            <div class="product-dialog__sizes"></div>
          </fieldset>
          <p class="product-dialog__validation" role="alert" hidden>Please choose a size.</p>
          <div class="product-dialog__purchase">
            <div class="product-dialog__quantity">
              <span class="product-dialog__quantity-label" id="product-dialog-quantity-label">Quantity</span>
              <div class="product-dialog__quantity-control" role="group" aria-labelledby="product-dialog-quantity-label">
                <button class="product-dialog__quantity-decrease" type="button" aria-label="Decrease quantity">−</button>
                <output class="product-dialog__quantity-value" aria-live="polite">1</output>
                <button class="product-dialog__quantity-increase" type="button" aria-label="Increase quantity">+</button>
              </div>
            </div>
            <button class="product-dialog__add" type="button" disabled>Add to bag</button>
          </div>
        </div>
      </div>
    </div>`;
  root.append(dialog);

  const closeButton = dialog.querySelector('.product-dialog__close');
  const gallery = initProductGallery(dialog.querySelector('.product-dialog__media'));
  const eyebrow = dialog.querySelector('.product-dialog__eyebrow');
  const title = dialog.querySelector('.product-dialog__title');
  const price = dialog.querySelector('.product-dialog__price');
  const description = dialog.querySelector('.product-dialog__description');
  const specs = dialog.querySelector('.product-dialog__specs');
  const sizes = dialog.querySelector('.product-dialog__sizes');
  const validation = dialog.querySelector('.product-dialog__validation');
  const quantityValue = dialog.querySelector('.product-dialog__quantity-value');
  const decreaseQuantity = dialog.querySelector('.product-dialog__quantity-decrease');
  const increaseQuantity = dialog.querySelector('.product-dialog__quantity-increase');
  const addButton = dialog.querySelector('.product-dialog__add');

  let activeProduct = null;
  let selectedSize = null;
  let quantity = 1;
  let availableQuantity = MAX_CART_QUANTITY;
  const motion = createDialogMotion(dialog, closeButton);

  function setQuantity(nextQuantity) {
    const quantityLimit = Math.max(1, availableQuantity);
    quantity = Math.max(1, Math.min(nextQuantity, quantityLimit));
    quantityValue.textContent = String(quantity);
    decreaseQuantity.disabled = quantity === 1 || availableQuantity === 0;
    increaseQuantity.disabled = quantity === quantityLimit || availableQuantity === 0;
    increaseQuantity.title = increaseQuantity.disabled
      ? `Maximum quantity is ${MAX_CART_QUANTITY}`
      : '';
    addButton.textContent = quantity === 1 ? 'Add to bag' : `Add ${quantity} to bag`;
  }

  function selectSize(size, selectedButton) {
    selectedSize = size;
    availableQuantity = getRemainingProductQuantity({ product: activeProduct, size });
    setQuantity(quantity);
    sizes.querySelectorAll('button').forEach((button) => {
      const selected = button === selectedButton;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    addButton.disabled = availableQuantity === 0;
    validation.textContent = availableQuantity === 0
      ? `Maximum quantity is ${MAX_CART_QUANTITY}.`
      : 'Please choose a size.';
    validation.hidden = availableQuantity !== 0;
  }

  function populate(product) {
    activeProduct = product;
    selectedSize = null;
    availableQuantity = MAX_CART_QUANTITY;
    setQuantity(1);
    gallery.setProduct(product);
    eyebrow.textContent = `${product.categoryLabel} · ${product.color}`;
    title.textContent = product.name;
    price.textContent = formatCurrency(product.price);
    description.textContent = product.description;
    addButton.disabled = true;
    validation.textContent = 'Please choose a size.';
    validation.hidden = true;

    const specFragment = document.createDocumentFragment();
    product.specs.forEach((spec) => {
      const group = element('div', 'product-dialog__spec');
      group.append(
        element('dt', 'product-dialog__spec-label', spec.label),
        element('dd', 'product-dialog__spec-value', spec.value),
      );
      specFragment.append(group);
    });
    specs.replaceChildren(specFragment);

    const sizeFragment = document.createDocumentFragment();
    product.sizes.forEach((size) => {
      const button = element('button', 'product-dialog__size', size);
      button.type = 'button';
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => selectSize(size, button));
      sizeFragment.append(button);
    });
    sizes.replaceChildren(sizeFragment);
  }

  function open(product, trigger = document.activeElement) {
    if (!product) return;
    populate(product);
    motion.open(trigger);
  }

  function close() {
    motion.close();
  }

  closeButton.addEventListener('click', close);
  decreaseQuantity.addEventListener('click', () => setQuantity(quantity - 1));
  increaseQuantity.addEventListener('click', () => setQuantity(quantity + 1));
  addButton.addEventListener('click', () => {
    if (motion.closing) return;
    if (!activeProduct || !selectedSize) {
      validation.hidden = false;
      sizes.querySelector('button')?.focus();
      return;
    }

    const addedProduct = activeProduct;
    const addedSize = selectedSize;
    const { quantityChanged } = addProductToCart({
      product: addedProduct,
      size: addedSize,
      quantity,
    });

    if (!quantityChanged) {
      validation.textContent = `Maximum quantity is ${MAX_CART_QUANTITY}.`;
      validation.hidden = false;
      return;
    }

    close();
    onAdded({ product: addedProduct, size: addedSize, quantity: quantityChanged });
  });

  return { open, close, dialog };
}
