import { formatCurrency } from '../utils/currency.js';

function productButton(className, label, product, onSelect) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.dataset.productOpen = product.id;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', () => onSelect(product, button));
  return button;
}

export function createProductCard(product, { onSelect = () => {} } = {}) {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.productId = product.id;

  const mediaButton = productButton(
    'product-card__media',
    `Choose a size for ${product.name}`,
    product,
    onSelect,
  );
  const image = document.createElement('img');
  image.className = 'product-card__image';
  image.src = product.image;
  image.alt = product.imageAlt;
  image.loading = 'lazy';
  image.decoding = 'async';
  mediaButton.append(image);

  const body = document.createElement('div');
  body.className = 'product-card__body';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'product-card__eyebrow';
  eyebrow.textContent = product.categoryLabel;

  const title = document.createElement('h3');
  title.className = 'product-card__title';
  const titleButton = productButton(
    'product-card__title-button',
    `Choose a size for ${product.name}`,
    product,
    onSelect,
  );
  titleButton.textContent = product.name;
  title.append(titleButton);

  const meta = document.createElement('div');
  meta.className = 'product-card__meta';
  const color = document.createElement('span');
  color.className = 'product-card__color';
  color.textContent = product.color;
  const price = document.createElement('span');
  price.className = 'product-card__price';
  price.textContent = formatCurrency(product.price);
  meta.append(color, price);

  const action = productButton(
    'product-card__action',
    `Quick shop ${product.name}`,
    product,
    onSelect,
  );
  action.textContent = 'Add to bag';

  body.append(eyebrow, title, meta, action);
  card.append(mediaButton, body);
  return card;
}

export function renderProductCards(container, products, options = {}) {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  products.forEach((product) => fragment.append(createProductCard(product, options)));
  container.replaceChildren(fragment);
}

