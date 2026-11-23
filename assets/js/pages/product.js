import { productById } from '../data/products.js';
import { MAX_CART_QUANTITY, subscribe } from '../features/cart-store.js';
import { addProductToCart, getRemainingProductQuantity } from '../features/cart-actions.js';
import { initProductGallery } from '../features/product-gallery.js';
import { trackViewContent } from '../utils/meta-events.js';

export function initProductPage({ onAdded = () => {} } = {}) {
  const root = document.querySelector('[data-product-page]');
  if (!root || root.dataset.initialized) return null;
  const product = productById.get(root.dataset.productPage);
  if (!product) return null;
  root.dataset.initialized = 'true';

  initProductGallery(root.querySelector('[data-product-gallery]')).setProduct(product);
  const sizeButtons = [...root.querySelectorAll('[data-product-size]')];
  const validation = root.querySelector('[data-product-validation]');
  const quantityValue = root.querySelector('[data-product-quantity]');
  const decrease = root.querySelector('[data-product-decrease]');
  const increase = root.querySelector('[data-product-increase]');
  const add = root.querySelector('[data-product-add]');
  let selectedSize = null;
  let quantity = 1;

  function updateControls() {
    const remaining = selectedSize
      ? getRemainingProductQuantity({ product, size: selectedSize })
      : 0;
    quantity = Math.max(1, Math.min(quantity, remaining || 1));
    quantityValue.textContent = String(quantity);
    decrease.disabled = remaining === 0 || quantity === 1;
    increase.disabled = remaining === 0 || quantity >= remaining;
    add.disabled = remaining === 0;
    add.textContent = quantity === 1 ? 'Add to bag' : `Add ${quantity} to bag`;
    validation.textContent = selectedSize && remaining === 0
      ? `Maximum quantity is ${MAX_CART_QUANTITY} for this size. Update your bag to add more.`
      : 'Please choose a size.';
    validation.hidden = !selectedSize || remaining > 0;
  }

  sizeButtons.forEach((button) => {
    button.disabled = false;
    button.addEventListener('click', () => {
      selectedSize = button.dataset.productSize;
      sizeButtons.forEach((candidate) => {
        const selected = candidate === button;
        candidate.classList.toggle('is-selected', selected);
        candidate.setAttribute('aria-pressed', String(selected));
      });
      updateControls();
    });
  });
  decrease.addEventListener('click', () => { quantity -= 1; updateControls(); });
  increase.addEventListener('click', () => { quantity += 1; updateControls(); });
  add.addEventListener('click', () => {
    if (!selectedSize) {
      validation.hidden = false;
      sizeButtons[0]?.focus();
      return;
    }
    const { quantityChanged } = addProductToCart({ product, size: selectedSize, quantity });
    updateControls();
    if (quantityChanged) onAdded({ product, size: selectedSize, quantity: quantityChanged });
  });

  updateControls();
  const unsubscribe = subscribe(updateControls, { emitImmediately: false });
  // The HTML owns PageView; product interactions never create extra view events.
  trackViewContent({ product });
  return { destroy: unsubscribe };
}
