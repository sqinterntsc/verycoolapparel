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
    }, contains: (name) => this.className.split(' ').includes(name) };
  }
  set textContent(value) { this._text = value; this.children = []; }
  get textContent() { return this._text; }
  set innerHTML(html) {
    this.children = [];
    // Extract the specific nodes the gallery/dialog controller queries.
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
  focus() { document.activeElement = this; }
  setPointerCapture(id) { this.capturedPointerId = id; }
  showModal() { this.open = true; }
  close() { this.open = false; this.emit('close'); }
}
const document = { createElement: (tag) => new Element(tag),
  createDocumentFragment: () => new Element('fragment'), activeElement: null };
const added = []; const callbacks = [];
const context = vm.createContext({ document, HTMLElement: Element, console,
  addItem: (id, size) => added.push({ id, size }), formatCurrency: (price) => `$${price}` });
function load(relative) {
  let source = fs.readFileSync(path.join(base, relative), 'utf8');
  source = source.replace(/^import .*;\n/gm, '').replace(/\bexport /g, '');
  vm.runInContext(source, context, { filename: relative });
}
load('assets/js/features/product-gallery.js');
load('assets/js/features/product-dialog.js');
const api = vm.runInContext('({getProductImages,wrapImageIndex,initProductGallery,initProductDialog})', context);
const product = (id) => ({ id, name: id, image: `${id}-base.webp`, imageAlt: 'base',
  categoryLabel: 'Shells', color: 'Sulphur', price: 348, description: 'Concept', sizes: ['S', 'M'],
  specs: [{ label: 'Design', value: 'Concept' }], images: [
    { src: `${id}-base.webp`, alt: 'Floating studio view', label: 'Studio', fit: 'contain' },
    { src: `${id}-weather.webp`, alt: 'Worn in rain', label: 'In the elements', fit: 'cover' },
  ] });
let checks = 0;
function check(name, run) { run(); checks++; console.log(`PASS ${name}`); }
check('wraparound handles previous, next and empty collections', () => {
  assert.equal(api.wrapImageIndex(-1, 2), 1); assert.equal(api.wrapImageIndex(2, 2), 0);
  assert.equal(api.wrapImageIndex(10, 0), 0);
});
check('legacy single image and malformed gallery entries', () => {
  assert.equal(api.getProductImages({ image: 'legacy.webp', imageAlt: 'legacy' })[0].src, 'legacy.webp');
  assert.equal(api.getProductImages({ image: 'fallback.webp', images: [null, {}, {src: ''}] })[0].src, 'fallback.webp');
});
const root = new Element();
const controller = api.initProductDialog({ root, onAdded: (result) => callbacks.push(result) });
const dialog = controller.dialog;
const gallery = dialog.querySelector('.product-dialog__media');
const image = gallery.querySelector('.product-dialog__image');
const viewport = gallery.querySelector('.product-gallery__viewport');
const status = gallery.querySelector('.product-gallery__status');
const next = gallery.querySelector('.product-gallery__next');
const previous = gallery.querySelector('.product-gallery__previous');
const thumbRoot = gallery.querySelector('.product-gallery__thumbnails');
const add = dialog.querySelector('.product-dialog__add');
const sizes = dialog.querySelector('.product-dialog__sizes');
const trigger = new Element('button');
check('opens on studio with labelled two-image gallery and disabled add', () => {
  controller.open(product('strata-shell'), trigger);
  assert.equal(dialog.open, true); assert.equal(image.src, 'strata-shell-base.webp');
  assert.equal(image.alt, 'Floating studio view'); assert.equal(image.dataset.fit, 'contain');
  assert.equal(status.textContent, 'Studio · 1 / 2'); assert.equal(add.disabled, true);
  assert.equal(thumbRoot.querySelectorAll('button').length, 2);
  assert.equal(gallery.getAttribute('aria-roledescription'), 'carousel');
});
check('next/previous wrap, update alt and active thumbnail without resetting size', () => {
  sizes.querySelectorAll('button')[1].emit('click');
  next.emit('click'); assert.equal(image.src, 'strata-shell-weather.webp');
  assert.equal(image.dataset.fit, 'cover'); assert.equal(image.alt, 'Worn in rain');
  assert.equal(thumbRoot.querySelectorAll('button')[1].getAttribute('aria-pressed'), 'true');
  assert.equal(add.disabled, false);
  next.emit('click'); assert.equal(image.src, 'strata-shell-base.webp');
  previous.emit('click'); assert.equal(image.src, 'strata-shell-weather.webp');
});
check('thumbnail selection and keyboard navigation announce active view', () => {
  thumbRoot.querySelectorAll('button')[0].emit('click');
  const event = gallery.emit('keydown', { key: 'ArrowRight' });
  assert.equal(event.defaultPrevented, true); assert.equal(status.textContent, 'In the elements · 2 / 2');
  gallery.emit('keydown', { key: 'ArrowLeft' }); assert.equal(image.src, 'strata-shell-base.webp');
  assert.equal(gallery.emit('keydown', { key: 'Escape' }).defaultPrevented, undefined);
});
const pointer = (name, x, y, extra = {}) => viewport.emit(name, {
  isPrimary: true, button: 0, pointerId: 1, clientX: x, clientY: y, ...extra });
check('horizontal swipe changes image; vertical scroll and small movement do not', () => {
  pointer('pointerdown', 200, 100); pointer('pointerup', 80, 110);
  assert.equal(image.src, 'strata-shell-weather.webp');
  pointer('pointerdown', 100, 100); pointer('pointerup', 180, 110);
  assert.equal(image.src, 'strata-shell-base.webp');
  pointer('pointerdown', 200, 100); pointer('pointerup', 130, 260);
  assert.equal(image.src, 'strata-shell-base.webp');
  pointer('pointerdown', 100, 100); pointer('pointerup', 120, 100);
  assert.equal(image.src, 'strata-shell-base.webp');
});
check('cancelled pointers do not advance gallery', () => {
  pointer('pointerdown', 200, 100); viewport.emit('pointercancel'); pointer('pointerup', 80, 100);
  assert.equal(image.src, 'strata-shell-base.webp');
});
check('image failure is recoverable by navigating to another view', () => {
  image.emit('error'); assert.equal(image.hidden, true);
  assert.equal(gallery.querySelector('.product-gallery__error').hidden, false);
  next.emit('click'); assert.equal(image.hidden, false);
  assert.equal(gallery.querySelector('.product-gallery__error').hidden, true);
});
check('gallery navigation preserves selected size and add-to-bag contract', () => {
  add.emit('click'); assert.deepEqual(added, [{ id: 'strata-shell', size: 'M' }]);
  assert.equal(callbacks[0].size, 'M'); assert.equal(dialog.open, false);
  assert.equal(document.activeElement, trigger);
});
check('reopening and switching products reset studio view and size', () => {
  controller.open(product('strata-shell'), trigger); next.emit('click'); controller.close();
  controller.open(product('contour-merino'), trigger);
  assert.equal(image.src, 'contour-merino-base.webp'); assert.equal(status.textContent, 'Studio · 1 / 2');
  assert.equal(add.disabled, true); assert.equal(sizes.querySelectorAll('button')[0].getAttribute('aria-pressed'), 'false');
});
check('single-image product hides extra controls and ignores arrows', () => {
  const single = product('legacy'); delete single.images;
  controller.open(single, trigger); assert.equal(next.hidden, true);
  assert.equal(previous.hidden, true); assert.equal(thumbRoot.hidden, true);
  gallery.emit('keydown', { key: 'ArrowRight' }); assert.equal(image.src, 'legacy-base.webp');
});
check('close and no-root initialization remain safe', () => {
  controller.close(); assert.equal(dialog.open, false);
  api.initProductDialog().open(); api.initProductDialog().close();
});
console.log(`${checks} gallery/dialog regression checks passed`);
