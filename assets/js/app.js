import { products } from './data/products.js';
import { renderProductCards } from './components/product-card.js';
import { renderFieldSystemCards } from './components/field-system-card.js';
import { initCartUI } from './features/cart-ui.js';
import { initProductDialog } from './features/product-dialog.js';
import { initCatalog } from './pages/catalog.js';
import { createDisclosure } from './utils/motion.js';
import { initStickyHeader } from './features/sticky-header.js';

function getDialogRoot() {
  let root = document.querySelector('[data-dialog-root]');
  if (!root) {
    root = document.createElement('div');
    root.dataset.dialogRoot = '';
    document.body.append(root);
  }
  return root;
}

function initToast() {
  const toast = document.querySelector('[data-toast]');
  if (!toast) return () => {};

  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  const motion = createDisclosure(toast, 'is-visible');
  let timer = null;

  return (message) => {
    window.clearTimeout(timer);
    toast.textContent = message;
    motion.setOpen(true);
    timer = window.setTimeout(() => {
      motion.setOpen(false);
    }, 3200);
  };
}

function initMobileMenu() {
  document.querySelectorAll('[data-menu-toggle]').forEach((button) => {
    const menuId = button.getAttribute('aria-controls');
    const menu = menuId ? document.getElementById(menuId) : null;
    if (!menu) return;
    const motion = createDisclosure(menu);
    const desktop = window.matchMedia('(min-width: 761px)');

    function setOpen(open) {
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      motion.setOpen(open);
    }

    setOpen(false);
    button.addEventListener('click', () => setOpen(!motion.isOpen));
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && motion.isOpen) {
        setOpen(false);
        button.focus();
      }
    });
    document.addEventListener('pointerdown', (event) => {
      if (motion.isOpen && !menu.contains(event.target) && !button.contains(event.target)) setOpen(false);
    });
    desktop.addEventListener('change', (event) => {
      if (event.matches) setOpen(false);
    });
  });
}

function init() {
  initStickyHeader();
  const dialogRoot = getDialogRoot();
  const showToast = initToast();
  const productDialog = initProductDialog({
    root: dialogRoot,
    onAdded: ({ product, size, quantity }) => {
      const quantityLabel = quantity > 1 ? `${quantity} × ` : '';
      showToast(`${quantityLabel}${product.name}, size ${size}, added to your bag.`);
    },
  });
  const openProduct = (product, trigger) => productDialog.open(product, trigger);

  document.querySelectorAll('[data-product-grid]').forEach((grid) => {
    renderProductCards(grid, products, { onSelect: openProduct });
  });
  document.querySelectorAll('[data-field-system-grid]').forEach((grid) => {
    renderFieldSystemCards(grid, products, { onSelect: openProduct });
  });
  initCatalog({ onSelect: openProduct });
  initCartUI({ root: dialogRoot });
  initMobileMenu();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

