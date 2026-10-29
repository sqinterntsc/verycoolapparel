import { addItem } from './cart-store.js';
import { createDialogMotion } from '../utils/motion.js';
import { formatCurrency } from '../utils/currency.js';

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
        <div class="product-dialog__media"><img class="product-dialog__image" alt=""></div>
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
          <button class="product-dialog__add" type="button" disabled>Add to bag</button>
        </div>
      </div>
    </div>`;
  root.append(dialog);

  const closeButton = dialog.querySelector('.product-dialog__close');
  const image = dialog.querySelector('.product-dialog__image');
  const eyebrow = dialog.querySelector('.product-dialog__eyebrow');
  const title = dialog.querySelector('.product-dialog__title');
  const price = dialog.querySelector('.product-dialog__price');
  const description = dialog.querySelector('.product-dialog__description');
  const specs = dialog.querySelector('.product-dialog__specs');
  const sizes = dialog.querySelector('.product-dialog__sizes');
  const validation = dialog.querySelector('.product-dialog__validation');
  const addButton = dialog.querySelector('.product-dialog__add');

  let activeProduct = null;
  let selectedSize = null;
  const motion = createDialogMotion(dialog, closeButton);

  function selectSize(size, selectedButton) {
    selectedSize = size;
    sizes.querySelectorAll('button').forEach((button) => {
      const selected = button === selectedButton;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    addButton.disabled = false;
    validation.hidden = true;
  }

  function populate(product) {
    activeProduct = product;
    selectedSize = null;
    image.src = product.image;
    image.alt = product.imageAlt;
    eyebrow.textContent = `${product.categoryLabel} · ${product.color}`;
    title.textContent = product.name;
    price.textContent = formatCurrency(product.price);
    description.textContent = product.description;
    addButton.disabled = true;
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
  addButton.addEventListener('click', () => {
    if (motion.closing) return;
    if (!activeProduct || !selectedSize) {
      validation.hidden = false;
      sizes.querySelector('button')?.focus();
      return;
    }

    addItem(activeProduct.id, selectedSize);
    const addedProduct = activeProduct;
    const addedSize = selectedSize;
    close();
    onAdded({ product: addedProduct, size: addedSize });
  });

  return { open, close, dialog };
}

