const editorialImageIndexes = Object.freeze([2, 1, 2, 1]);

function createFieldSystemCard(product, index, onSelect) {
  const view = product.images?.[editorialImageIndexes[index]] || product.images?.[1];
  if (!view) return null;

  const article = document.createElement('article');
  article.className = 'field-system-card';
  article.dataset.productId = product.id;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'field-system-card__button';
  button.dataset.productOpen = product.id;
  button.setAttribute('aria-label', `Explore ${product.name}, ${product.categoryLabel}`);
  button.addEventListener('click', () => onSelect(product, button));

  const image = document.createElement('img');
  image.className = 'field-system-card__image';
  image.src = view.src;
  image.alt = view.alt;
  image.loading = 'lazy';
  image.decoding = 'async';

  const category = document.createElement('span');
  category.className = 'field-system-card__category';
  category.textContent = product.categoryLabel;

  const number = document.createElement('span');
  number.className = 'field-system-card__number';
  number.textContent = String(index + 1).padStart(2, '0');

  const title = document.createElement('span');
  title.className = 'field-system-card__title';
  title.textContent = product.name;

  const action = document.createElement('span');
  action.className = 'field-system-card__action';
  action.textContent = 'View layer';
  action.setAttribute('aria-hidden', 'true');

  button.append(image, category, number, title, action);
  article.append(button);
  return article;
}

export function renderFieldSystemCards(container, products, { onSelect = () => {} } = {}) {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  products.forEach((product, index) => {
    const card = createFieldSystemCard(product, index, onSelect);
    if (card) fragment.append(card);
  });
  container.replaceChildren(fragment);
}
