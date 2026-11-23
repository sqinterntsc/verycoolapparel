import { formatCurrency } from '../utils/currency.js';
import { productUrl } from '../utils/product-url.js';

function productLink(className, label, product) {
  const link = document.createElement('a');
  link.href = productUrl(product.id);
  link.className = className;
  link.setAttribute('aria-label', label);
  return link;
}

export function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.productId = product.id;

  const mediaButton = productLink(
    'product-card__media',
    `View ${product.name}`,
    product,
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
  const titleButton = productLink(
    'product-card__title-button',
    `View ${product.name}`,
    product,
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

  const action = productLink(
    'product-card__action',
    `View ${product.name}`,
    product,
  );
  action.textContent = 'View product';

  body.append(eyebrow, title, meta, action);
  card.append(mediaButton, body);
  return card;
}

export function renderProductCards(container, products) {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  products.forEach((product) => fragment.append(createProductCard(product)));
  container.replaceChildren(fragment);
}
