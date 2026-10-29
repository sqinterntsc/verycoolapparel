// Only toggle the scroll state; native CSS owns the resizing and motion.
export function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header || header.closest('.site-nav')) return null;

  const nav = document.createElement('div');
  nav.className = 'site-nav';
  header.before(nav);
  nav.append(header);
  const toggle = header.querySelector('[data-menu-toggle]');
  const menuId = toggle?.getAttribute('aria-controls');
  const menu = menuId ? document.getElementById(menuId) : null;
  if (menu) nav.append(menu);

  let floating = false;
  let frame = null;

  function update() {
    frame = null;
    // Separate thresholds prevent flicker near the transition, including bounce scroll.
    const next = window.scrollY > (floating ? 24 : 64);
    if (next === floating) return;
    floating = next;
    nav.classList.toggle('is-floating', floating);
  }

  function onScroll() {
    if (frame === null) frame = window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('pageshow', onScroll);
  update();

  return {
    element: nav,
    destroy() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pageshow', onScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    },
  };
}
