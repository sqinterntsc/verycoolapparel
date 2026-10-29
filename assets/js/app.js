import { products } from './data/products.js';
import { renderProductCards } from './components/product-card.js';
import { initCartUI } from './features/cart-ui.js';
import { initProductDialog } from './features/product-dialog.js';
import { initCatalog } from './pages/catalog.js';

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
  toast.hidden = true;
  let timer = null;

  return (message) => {
    window.clearTimeout(timer);
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add('is-visible');
    timer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.hidden = true;
    }, 3200);
  };
}

function initMobileMenu() {
  document.querySelectorAll('[data-menu-toggle]').forEach((button) => {
    const menuId = button.getAttribute('aria-controls');
    const menu = menuId ? document.getElementById(menuId) : null;
    if (!menu) return;

    function setOpen(open) {
      button.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      menu.classList.toggle('is-open', open);
    }

    setOpen(false);
    button.addEventListener('click', () => setOpen(menu.hidden));
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !menu.hidden) {
        setOpen(false);
        button.focus();
      }
    });
  });
}

function init() {
  const dialogRoot = getDialogRoot();
  const showToast = initToast();
  const productDialog = initProductDialog({
    root: dialogRoot,
    onAdded: ({ product, size }) => {
      showToast(`${product.name}, size ${size}, added to your bag.`);
    },
  });
  const openProduct = (product, trigger) => productDialog.open(product, trigger);

  document.querySelectorAll('[data-product-grid]').forEach((grid) => {
    renderProductCards(grid, products, { onSelect: openProduct });
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

