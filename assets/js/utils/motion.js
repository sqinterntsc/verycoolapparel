// CSS owns the motion. These helpers only wait before hiding native elements.
export function afterCSSMotion(element, complete) {
  const animations = element.getAnimations?.() ?? [];
  if (!animations.length) {
    complete();
    return;
  }
  // Cancellation (including a changed reduced-motion preference) also settles.
  Promise.allSettled(animations.map((animation) => animation.finished)).then(complete);
}

export function createDisclosure(element, openClass = 'is-open') {
  let revision = 0;
  let isOpen = false;

  function setOpen(open) {
    isOpen = open;
    const current = ++revision;
    element.inert = !open;
    if (open) element.hidden = false;
    element.classList.toggle(openClass, open);
    if (!open) {
      afterCSSMotion(element, () => {
        if (current === revision) element.hidden = true;
      });
    }
  }

  setOpen(false);
  return { setOpen, get isOpen() { return isOpen; } };
}

export function createDialogMotion(dialog, initialFocus) {
  let returnFocus = null;
  let revision = 0;
  let closing = false;

  function open(trigger = document.activeElement) {
    ++revision;
    closing = false;
    dialog.inert = false;
    dialog.classList.remove('is-closing');
    if (trigger instanceof HTMLElement && !dialog.contains(trigger)) returnFocus = trigger;
    if (!dialog.open) {
      dialog.scrollTop = 0;
      dialog.showModal();
    }
    initialFocus?.focus({ preventScroll: true });
  }

  function close() {
    if (!dialog.open || closing) return;
    closing = true;
    const current = ++revision;
    dialog.classList.add('is-closing');
    dialog.inert = true;
    afterCSSMotion(dialog, () => {
      if (current === revision && closing) dialog.close();
    });
  }

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener('close', () => {
    // Ignore a queued close event if the dialog has already been reopened.
    if (dialog.open) return;
    ++revision;
    closing = false;
    dialog.inert = false;
    dialog.classList.remove('is-closing');
    const target = returnFocus;
    returnFocus = null;
    if (target?.isConnected && !document.querySelector('dialog[open]')) {
      target.focus({ preventScroll: true });
    }
  });

  return { open, close, get closing() { return closing; } };
}
