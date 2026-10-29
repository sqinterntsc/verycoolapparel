import { productCategories, products } from '../data/products.js';
import { renderProductCards } from '../components/product-card.js';

function normalizeText(value) {
  return String(value ?? '').trim().toLocaleLowerCase();
}

export function filterAndSortProducts(
  source,
  { category = 'all', query = '', sort = 'featured' } = {},
) {
  const needle = normalizeText(query);
  const filtered = source.filter((product) => {
    const matchesCategory = category === 'all' || product.category === category;
    const haystack = normalizeText([
      product.name,
      product.categoryLabel,
      product.color,
      product.description,
    ].join(' '));
    return matchesCategory && (!needle || haystack.includes(needle));
  });

  return [...filtered].sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    return a.featuredIndex - b.featuredIndex;
  });
}

function categoryFromUrl() {
  try {
    const category = new URL(window.location.href).searchParams.get('category');
    return productCategories.includes(category) ? category : 'all';
  } catch {
    return 'all';
  }
}

function updateCategoryUrl(category) {
  if (typeof history?.replaceState !== 'function') return;
  const url = new URL(window.location.href);
  if (category === 'all') url.searchParams.delete('category');
  else url.searchParams.set('category', category);
  history.replaceState(null, '', url);
}

export function initCatalog({ onSelect = () => {} } = {}) {
  const grids = [...document.querySelectorAll('[data-catalog-grid]')];
  if (!grids.length) return null;

  const filters = [...document.querySelectorAll('[data-filter]')];
  const search = document.querySelector('[data-product-search]');
  const sort = document.querySelector('[data-sort]');
  const resultCount = document.querySelector('[data-result-count]');
  const empty = document.querySelector('[data-catalog-empty]');
  const state = {
    category: categoryFromUrl(),
    query: search?.value ?? '',
    sort: sort?.value ?? 'featured',
  };

  function render({ updateUrl = false } = {}) {
    const result = filterAndSortProducts(products, state);
    grids.forEach((grid) => renderProductCards(grid, result, { onSelect }));

    filters.forEach((filter) => {
      const active = filter.dataset.filter === state.category;
      filter.classList.toggle('is-active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    if (resultCount) {
      resultCount.textContent = `${result.length} ${result.length === 1 ? 'product' : 'products'}`;
    }
    if (empty) empty.hidden = result.length !== 0;
    if (updateUrl) updateCategoryUrl(state.category);
  }

  filters.forEach((filter) => {
    filter.addEventListener('click', (event) => {
      event.preventDefault();
      const category = filter.dataset.filter;
      state.category = productCategories.includes(category) ? category : 'all';
      render({ updateUrl: true });
    });
  });
  search?.addEventListener('input', () => {
    state.query = search.value;
    render();
  });
  sort?.addEventListener('change', () => {
    state.sort = ['featured', 'price-asc', 'price-desc'].includes(sort.value)
      ? sort.value
      : 'featured';
    render();
  });
  window.addEventListener('popstate', () => {
    state.category = categoryFromUrl();
    render();
  });

  render();
  return { render, state };
}

