function element(tag, className, text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

// Keep single-image products usable as the collection grows.
export function getProductImages(product) {
  const images = Array.isArray(product?.images)
    ? product.images.filter((entry) => entry && typeof entry.src === 'string' && entry.src)
    : [];
  return images.length ? images : [{ src: product.image, alt: product.imageAlt, label: 'Product', fit: 'contain' }];
}

export function wrapImageIndex(index, count) {
  return count > 0 ? ((index % count) + count) % count : 0;
}

export function initProductGallery(root) {
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carousel');
  root.setAttribute('aria-label', 'Product images');
  root.innerHTML = `
    <div class="product-gallery__viewport" tabindex="0" role="group" aria-roledescription="slide" aria-describedby="product-gallery-hint">
      <img class="product-dialog__image" alt="" draggable="false">
      <p class="product-gallery__error" hidden>Image unavailable. Try another view.</p>
    </div>
    <div class="product-gallery__toolbar">
      <button class="product-gallery__arrow product-gallery__previous" type="button" aria-label="Previous product image">←</button>
      <p class="product-gallery__status" role="status" aria-live="polite" aria-atomic="true"></p>
      <button class="product-gallery__arrow product-gallery__next" type="button" aria-label="Next product image">→</button>
    </div>
    <div class="product-gallery__thumbnails" role="group" aria-label="Choose a product image"></div>
    <p class="sr-only" id="product-gallery-hint">Use left and right arrow keys or swipe to change product images.</p>`;

  const viewport = root.querySelector('.product-gallery__viewport');
  const image = root.querySelector('.product-dialog__image');
  const error = root.querySelector('.product-gallery__error');
  const previous = root.querySelector('.product-gallery__previous');
  const next = root.querySelector('.product-gallery__next');
  const status = root.querySelector('.product-gallery__status');
  const thumbnails = root.querySelector('.product-gallery__thumbnails');
  let images = [];
  let index = 0;
  let pointerStart = null;

  function showImage(nextIndex) {
    if (!images.length) return;
    index = wrapImageIndex(nextIndex, images.length);
    const entry = images[index];
    image.hidden = false;
    error.hidden = true;
    image.alt = entry.alt || '';
    image.dataset.fit = entry.fit === 'cover' ? 'cover' : 'contain';
    image.src = entry.src;
    viewport.setAttribute('aria-label', `${index + 1} of ${images.length}: ${entry.label || 'Product view'}`);
    status.textContent = `${entry.label || 'Product view'} · ${index + 1} / ${images.length}`;
    thumbnails.querySelectorAll('button').forEach((button, buttonIndex) => {
      const selected = buttonIndex === index;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function setProduct(product) {
    images = getProductImages(product);
    index = 0;
    pointerStart = null;
    root.setAttribute('aria-label', `${product.name} images`);
    previous.hidden = next.hidden = thumbnails.hidden = images.length < 2;
    const fragment = document.createDocumentFragment();
    images.forEach((entry, imageIndex) => {
      const button = element('button', 'product-gallery__thumbnail');
      button.type = 'button';
      button.setAttribute('aria-label', `Show ${entry.label || 'product view'}: image ${imageIndex + 1} of ${images.length}`);
      const thumbnail = element('img', 'product-gallery__thumbnail-image');
      thumbnail.src = entry.src;
      thumbnail.alt = '';
      thumbnail.width = 52;
      thumbnail.height = 52;
      thumbnail.loading = 'lazy';
      const media = element('span', 'product-gallery__thumbnail-media');
      media.append(thumbnail);
      button.append(media, element('span', 'product-gallery__thumbnail-label', entry.label || `View ${imageIndex + 1}`));
      button.addEventListener('click', () => showImage(imageIndex));
      fragment.append(button);
    });
    thumbnails.replaceChildren(fragment);
    showImage(0);
  }

  image.addEventListener('error', () => {
    image.hidden = true;
    error.hidden = false;
  });
  previous.addEventListener('click', () => showImage(index - 1));
  next.addEventListener('click', () => showImage(index + 1));
  root.addEventListener('keydown', (event) => {
    if (images.length < 2) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showImage(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  viewport.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0 || images.length < 2) return;
    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointerup', (event) => {
    if (!pointerStart || event.pointerId !== pointerStart.id) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      showImage(index + (dx < 0 ? 1 : -1));
    }
  });
  viewport.addEventListener('pointercancel', () => { pointerStart = null; });
  viewport.addEventListener('lostpointercapture', () => { pointerStart = null; });

  return { setProduct };
}
