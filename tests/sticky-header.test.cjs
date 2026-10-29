/* Scroll-state regressions; run with node tests/sticky-header.test.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(scrollY = 0, hasMenu = true, hasHeader = true) {
  const classes = new Set();
  const nav = { className: '', children: [], classList: { toggle(name, on) {
    if (on) classes.add(name); else classes.delete(name);
  } }, append(node) { this.children.push(node); } };
  const header = {
    parent: null,
    closest: () => header.parent,
    before: (node) => { header.parent = node; },
    querySelector: () => hasMenu ? { getAttribute: () => 'mobile-menu' } : null,
  };
  const menu = {};
  const document = {
    querySelector: () => hasHeader ? header : null,
    createElement: () => nav,
    getElementById: (id) => id === 'mobile-menu' ? menu : null,
  };
  const events = new Map(), frames = new Map();
  let frameId = 0;
  const window = {
    scrollY,
    addEventListener: (name, callback, options) => events.set(name, { callback, options }),
    removeEventListener: (name, callback) => {
      if (events.get(name)?.callback === callback) events.delete(name);
    },
    requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
  };
  const context = vm.createContext({ document, window });
  const source = fs.readFileSync(path.join(__dirname, '../assets/js/features/sticky-header.js'), 'utf8');
  vm.runInContext(source.replace(/\bexport /g, ''), context);
  const init = vm.runInContext('initStickyHeader', context);
  const api = init();
  const flush = () => {
    const queued = [...frames.values()]; frames.clear(); queued.forEach((callback) => callback());
  };
  const scroll = (y) => { window.scrollY = y; events.get('scroll')?.callback(); flush(); };
  return { api, init, nav, header, menu, classes, window, events, frames, flush, scroll };
}

let checks = 0;
function check(name, run) { run(); checks++; console.log(`PASS ${name}`); }
check('preserves existing header and menu nodes and prevents duplicate wrappers', () => {
  const state = setup();
  assert.equal(state.nav.children[0], state.header);
  assert.equal(state.nav.children[1], state.menu);
  assert.equal(state.init(), null);
});
check('compacts on downward scroll and keeps its state stable around the threshold', () => {
  const state = setup();
  state.scroll(64); assert.equal(state.classes.has('is-floating'), false);
  state.scroll(65); assert.equal(state.classes.has('is-floating'), true);
  for (const y of [64, 50, 25, 63]) {
    state.scroll(y); assert.equal(state.classes.has('is-floating'), true);
  }
  state.scroll(24); assert.equal(state.classes.has('is-floating'), false);
  state.scroll(-10); assert.equal(state.classes.has('is-floating'), false);
});
check('initializes correctly at a restored deep scroll position', () => {
  assert.equal(setup(600).classes.has('is-floating'), true);
});
check('scroll bursts are passive and coalesced into one frame using the final position', () => {
  const state = setup();
  assert.equal(state.events.get('scroll').options.passive, true);
  for (const y of [30, 90, 100]) {
    state.window.scrollY = y; state.events.get('scroll').callback();
  }
  assert.equal(state.frames.size, 1);
  state.flush(); assert.equal(state.classes.has('is-floating'), true);
});
check('pageshow restores state without duplicating an already scheduled scroll frame', () => {
  const state = setup(); state.window.scrollY = 300;
  state.events.get('scroll').callback(); state.events.get('pageshow').callback();
  assert.equal(state.frames.size, 1);
  state.flush(); assert.equal(state.classes.has('is-floating'), true);
  state.window.scrollY = 0; state.events.get('pageshow').callback(); state.flush();
  assert.equal(state.classes.has('is-floating'), false);
});
check('works without a mobile menu and is safe on pages without a storefront header', () => {
  assert.equal(setup(0, false).nav.children.length, 1);
  assert.equal(setup(0, false, false).api, null);
});
check('cleanup removes its listeners and cancels a pending frame', () => {
  const state = setup(); state.events.get('scroll').callback(); state.api.destroy();
  assert.equal(state.frames.size, 0); assert.equal(state.events.size, 0);
});
console.log(`${checks} sticky header checks passed`);
