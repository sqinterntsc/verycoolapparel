/* Lifecycle regressions. Run: node tests/motion.test.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Element {
  constructor() {
    this.hidden = true;
    this.open = false;
    this.isConnected = true;
    this.events = {};
    this.animations = [];
    this.classes = new Set();
    this.classList = {
      add: (name) => this.classes.add(name),
      remove: (name) => this.classes.delete(name),
      toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name),
    };
  }
  addEventListener(type, callback) { (this.events[type] ??= []).push(callback); }
  emit(type, event = {}) {
    event.target ??= this;
    event.preventDefault ??= () => { event.defaultPrevented = true; };
    this.events[type]?.forEach((callback) => callback(event));
    return event;
  }
  contains(element) { return element === this; }
  getAnimations() { return this.animations; }
  showModal() { this.open = true; }
  close() { this.open = false; this.emit('close'); }
  focus() { document.activeElement = this; }
}
const document = {
  activeElement: null,
  modal: null,
  querySelector: () => document.modal?.open ? document.modal : null,
};
const context = vm.createContext({ HTMLElement: Element, document });
const source = fs.readFileSync(path.join(__dirname, '../assets/js/utils/motion.js'), 'utf8');
vm.runInContext(source.replace(/\bexport /g, ''), context);
const { createDialogMotion, createDisclosure } = vm.runInContext('({ createDialogMotion, createDisclosure })', context);
function pendingAnimation(element) {
  let resolve, reject;
  const finished = new Promise((yes, no) => { resolve = yes; reject = no; });
  element.animations = [{ finished }];
  return { resolve, reject };
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
let checks = 0;
async function check(name, run) { await run(); checks++; console.log(`PASS ${name}`); }

(async () => {
  await check('modal exit keeps native dialog open until CSS finishes, then restores focus', async () => {
    const dialog = new Element(), focus = new Element(), trigger = new Element();
    const motion = createDialogMotion(dialog, focus);
    motion.open(trigger);
    assert.equal(document.activeElement, focus);
    const animation = pendingAnimation(dialog);
    motion.close();
    assert.equal(dialog.open, true);
    assert.equal(dialog.inert, true);
    assert.equal(document.activeElement, focus);
    animation.resolve(); await settle();
    assert.equal(dialog.open, false);
    assert.equal(document.activeElement, trigger);
    assert.equal(dialog.inert, false);
  });
  await check('Escape and backdrop use the animated close path; repeated close is safe', async () => {
    const dialog = new Element(), motion = createDialogMotion(dialog);
    motion.open(new Element());
    const animation = pendingAnimation(dialog);
    assert.equal(dialog.emit('cancel').defaultPrevented, true);
    dialog.emit('cancel'); motion.close();
    assert.equal(dialog.open, true);
    animation.resolve(); await settle(); assert.equal(dialog.open, false);
    dialog.animations = []; motion.open(); dialog.emit('click');
    assert.equal(dialog.open, false);
  });
  await check('reopening during exit prevents a stale completion from closing the dialog', async () => {
    const dialog = new Element(), motion = createDialogMotion(dialog);
    motion.open(new Element()); const animation = pendingAnimation(dialog);
    motion.close(); motion.open(new Element());
    animation.resolve(); await settle();
    assert.equal(dialog.open, true); assert.equal(dialog.inert, false);
    assert.equal(motion.closing, false);
  });
  await check('queued native close events do not steal focus from a reopened modal', () => {
    const dialog = new Element(), focus = new Element(), motion = createDialogMotion(dialog, focus);
    motion.open(new Element()); dialog.emit('close');
    assert.equal(document.activeElement, focus); assert.equal(dialog.open, true);
  });
  await check('cancelled CSS motion completes closing without leaving a stuck overlay', async () => {
    const dialog = new Element(), motion = createDialogMotion(dialog);
    motion.open(); const animation = pendingAnimation(dialog);
    motion.close(); animation.reject(new Error('Animation cancelled')); await settle();
    assert.equal(dialog.open, false);
  });
  await check('reduced motion and missing animation APIs close synchronously', () => {
    for (const missingAPI of [false, true]) {
      const dialog = new Element(); if (missingAPI) dialog.getAnimations = undefined;
      const motion = createDialogMotion(dialog); motion.open(); motion.close();
      assert.equal(dialog.open, false);
    }
  });
  await check('closing another dialog preserves focus inside the remaining modal', () => {
    const dialog = new Element(), other = new Element(), focus = new Element();
    const motion = createDialogMotion(dialog, focus);
    motion.open(new Element()); other.open = true; document.modal = other;
    motion.close(); assert.equal(document.activeElement, focus); document.modal = null;
  });
  await check('disclosure exit disables links immediately, then hides after CSS settles', async () => {
    const element = new Element(), motion = createDisclosure(element);
    motion.setOpen(true); const animation = pendingAnimation(element); motion.setOpen(false);
    assert.equal(element.hidden, false); assert.equal(element.inert, true);
    assert.equal(motion.isOpen, false);
    animation.resolve(); await settle(); assert.equal(element.hidden, true);
  });
  await check('rapid disclosure reopen and repeated toast messages survive stale exits', async () => {
    const element = new Element(), motion = createDisclosure(element, 'is-visible');
    motion.setOpen(true); const animation = pendingAnimation(element);
    motion.setOpen(false); motion.setOpen(true);
    animation.resolve(); await settle();
    assert.equal(element.hidden, false); assert.equal(element.inert, false);
    assert.equal(element.classes.has('is-visible'), true);
  });
  console.log(`${checks} motion lifecycle checks passed`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
