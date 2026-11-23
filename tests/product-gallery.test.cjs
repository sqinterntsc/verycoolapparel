/* Dependency-free DOM-event regression tests; run with node tests/product-gallery.test.cjs.
 * This is a DOM double, not a substitute for desktop/mobile browser visual QA. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const base = path.resolve(__dirname, '..');

class Element {
  constructor(tag = 'div') {
    this.tagName = tag; this.className = ''; this.children = []; this.attrs = {};
    this.events = {}; this.dataset = {}; this.hidden = false; this.disabled = false;
    this.isConnected = true; this.open = false; this._text = '';
    this.classList = { toggle: (name, on) => {
      const values = new Set(this.className.split(' ').filter(Boolean));
      if (on) values.add(name); else values.delete(name);
      this.className = [...values].join(' ');
    }, contains: (name) => this.className.split(' ').includes(name),
    add: (name) => this.classList.toggle(name, true),
    remove: (name) => this.classList.toggle(name, false) };
  }
  set textContent(value) { this._text = value; this.children = []; }
  get textContent() { return this._text; }
  set innerHTML(html) {
    this.children = [];
    // Extract the specific nodes the gallery controller queries.
    const regex = /<(\w+)([^>]*\bclass="([^"]+)"[^>]*)>/g;
    for (const match of html.matchAll(regex)) {
      const child = new Element(match[1]); child.className = match[3];
      child.hidden = /\bhidden\b/.test(match[2]); child.disabled = /\bdisabled\b/.test(match[2]);
      this.append(child);
    }
  }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  getAttribute(name) { return this.attrs[name] ?? null; }
  append(...nodes) { for (const node of nodes) {
    if (node.tagName === 'fragment') this.children.push(...node.children);
    else this.children.push(node);
  } }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  querySelectorAll(selector) {
    const found = []; const matches = (node) => selector.startsWith('.')
      ? node.className.split(' ').includes(selector.slice(1)) : node.tagName === selector;
    for (const child of this.children) {
      if (matches(child)) found.push(child);
      found.push(...child.querySelectorAll(selector));
    }
    return found;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  addEventListener(name, handler) { (this.events[name] ||= []).push(handler); }
  emit(name, event = {}) {
    event.target ||= this; event.preventDefault ||= () => { event.defaultPrevented = true; };
    for (const handler of this.events[name] || []) handler(event);
    return event;
  }
  contains(node) { return this === node || this.children.some((child) => child.contains(node)); }
  focus() { document.activeElement = this; }
  setPointerCapture(id) { this.capturedPointerId = id; }
  showModal() { this.open = true; }
  close() { this.open = false; this.emit('close'); }
}
const document = { createElement: (tag) => new Element(tag),
  createDocumentFragment: () => new Element('fragment'), activeElement: null,
  querySelector: () => null };
const context = vm.createContext({ document, console });
let gallerySource = fs.readFileSync(path.join(base, 'assets/js/features/product-gallery.js'), 'utf8');
vm.runInContext(gallerySource.replace(/\bexport /g, ''), context);
const api = vm.runInContext('({getProductImages,wrapImageIndex,initProductGallery})', context);
const product = (id) => ({ id, name: id, image: `${id}-base.webp`, imageAlt: 'base', images: [
  { src: `${id}-base.webp`, alt: 'Floating studio view', label: 'Studio', fit: 'contain' },
  { src: `${id}-weather.webp`, alt: 'Worn in rain', label: 'In the elements', fit: 'cover' },
  { src: `${id}-angle.webp`, alt: 'Extreme bottom-up view', label: 'Off axis', fit: 'cover' },
] });
let checks = 0;
function check(name, run) { run(); checks++; console.log(`PASS ${name}`); }
check('wraparound handles previous, next and empty collections', () => {
  assert.equal(api.wrapImageIndex(-1, 3), 2); assert.equal(api.wrapImageIndex(3, 3), 0);
  assert.equal(api.wrapImageIndex(10, 0), 0);
});
check('single image and malformed gallery entries use the fallback', () => {
  assert.equal(api.getProductImages({ image: 'legacy.webp', imageAlt: 'legacy' })[0].src, 'legacy.webp');
  assert.equal(api.getProductImages({ image: 'fallback.webp', images: [null, {}, {src: ''}] })[0].src, 'fallback.webp');
});
const root = new Element();
const controller = api.initProductGallery(root);
controller.setProduct(product('strata-shell'));
const image = root.querySelector('.product-dialog__image');
const viewport = root.querySelector('.product-gallery__viewport');
const status = root.querySelector('.product-gallery__status');
const next = root.querySelector('.product-gallery__next');
const previous = root.querySelector('.product-gallery__previous');
const thumbRoot = root.querySelector('.product-gallery__thumbnails');
check('starts on the first image with accessible labels', () => {
  assert.equal(image.src, 'strata-shell-base.webp');
  assert.equal(image.alt, 'Floating studio view'); assert.equal(image.dataset.fit, 'contain');
  assert.equal(status.textContent, 'Studio · 1 / 3');
  assert.equal(thumbRoot.querySelectorAll('button').length, 3);
  assert.equal(root.getAttribute('aria-roledescription'), 'carousel');
});
check('next and previous reach all three images and wrap', () => {
  next.emit('click'); assert.equal(image.src, 'strata-shell-weather.webp');
  assert.equal(image.dataset.fit, 'cover'); assert.equal(image.alt, 'Worn in rain');
  next.emit('click'); assert.equal(image.src, 'strata-shell-angle.webp');
  assert.equal(thumbRoot.querySelectorAll('button')[2].getAttribute('aria-pressed'), 'true');
  next.emit('click'); assert.equal(image.src, 'strata-shell-base.webp');
  previous.emit('click'); assert.equal(image.src, 'strata-shell-angle.webp');
});
check('thumbnail selection and keyboard navigation announce the active view', () => {
  thumbRoot.querySelectorAll('button')[0].emit('click');
  const event = root.emit('keydown', { key: 'ArrowRight' });
  assert.equal(event.defaultPrevented, true); assert.equal(status.textContent, 'In the elements · 2 / 3');
  root.emit('keydown', { key: 'ArrowLeft' }); assert.equal(image.src, 'strata-shell-base.webp');
  assert.equal(root.emit('keydown', { key: 'Escape' }).defaultPrevented, undefined);
});
const pointer = (name, x, y, extra = {}) => viewport.emit(name, {
  isPrimary: true, button: 0, pointerId: 1, clientX: x, clientY: y, ...extra });
check('horizontal swipe changes the image; vertical scroll and small movement do not', () => {
  pointer('pointerdown', 200, 100); pointer('pointerup', 80, 110);
  assert.equal(image.src, 'strata-shell-weather.webp');
  pointer('pointerdown', 100, 100); pointer('pointerup', 180, 110);
  assert.equal(image.src, 'strata-shell-base.webp');
  pointer('pointerdown', 200, 100); pointer('pointerup', 130, 260);
  assert.equal(image.src, 'strata-shell-base.webp');
  pointer('pointerdown', 100, 100); pointer('pointerup', 120, 100);
  assert.equal(image.src, 'strata-shell-base.webp');
});
check('cancelled pointers do not advance the gallery', () => {
  pointer('pointerdown', 200, 100); viewport.emit('pointercancel'); pointer('pointerup', 80, 100);
  assert.equal(image.src, 'strata-shell-base.webp');
});
check('image failure is recoverable by navigating to another view', () => {
  image.emit('error'); assert.equal(image.hidden, true);
  assert.equal(root.querySelector('.product-gallery__error').hidden, false);
  next.emit('click'); assert.equal(image.hidden, false);
  assert.equal(root.querySelector('.product-gallery__error').hidden, true);
});
check('changing products resets the gallery to the first image', () => {
  controller.setProduct(product('contour-merino'));
  assert.equal(image.src, 'contour-merino-base.webp'); assert.equal(status.textContent, 'Studio · 1 / 3');
});
check('single-image products hide extra controls and ignore arrows', () => {
  const single = product('legacy'); delete single.images;
  controller.setProduct(single); assert.equal(next.hidden, true);
  assert.equal(previous.hidden, true); assert.equal(thumbRoot.hidden, true);
  root.emit('keydown', { key: 'ArrowRight' }); assert.equal(image.src, 'legacy-base.webp');
});
console.log(`${checks} gallery regression checks passed`);
