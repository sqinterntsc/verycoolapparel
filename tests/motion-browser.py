"""Optional real-browser QA: python -m pip install playwright; playwright install chromium.
Run with python tests/motion-browser.py. No browser tools are loaded by the site.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import tempfile

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
ARTIFACTS = Path(tempfile.gettempdir()) / 'verycoolapparel-motion-qa'
ARTIFACTS.mkdir(exist_ok=True)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
origin = f'http://127.0.0.1:{server.server_port}'
checks = 0


def check(condition, message):
    global checks
    assert condition, message
    checks += 1
    print(f'PASS {message}', flush=True)


def settle(page, selector):
    page.wait_for_function("s => document.querySelector(s).getAnimations().length === 0", arg=selector)


def opening(page, selector):
    state = page.locator(selector).evaluate("e => ({open:e.open, motion:e.getAnimations().length})")
    check(state['open'] and state['motion'] > 0, f'{selector} has a CSS entry transition')
    settle(page, selector)


def closing(page, selector):
    state = page.locator(selector).evaluate("e => ({open:e.open, inert:e.inert, closing:e.classList.contains('is-closing'), motion:e.getAnimations().length})")
    check(all((state['open'], state['inert'], state['closing'], state['motion'] > 0)), f'{selector} stays modal during CSS exit')
    check(page.evaluate("getComputedStyle(document.body).overflow === 'hidden'"), 'page scroll remains locked during exit')
    page.wait_for_function("s => !document.querySelector(s).open", arg=selector)
    check(page.evaluate("getComputedStyle(document.body).overflow !== 'hidden'"), 'page scrolling resumes after exit')


try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={'width': 1440, 'height': 1000})
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(origin)
        page.locator('.product-card').first.wait_for()
        page.screenshot(path=str(ARTIFACTS / 'desktop-home.png'))

        # Hover and mouse-out reverse through the same CSS transition.
        cta = page.locator('.hero .button')
        cta.hover()
        settle(page, '.hero .button')
        hover = cta.evaluate('e => getComputedStyle(e).transform')
        check(hover != 'none', 'desktop CTA responds to hover')
        page.mouse.move(1, 1)
        settle(page, '.hero .button')
        check(cta.evaluate('e => getComputedStyle(e).transform') == 'none', 'CTA returns to rest on mouse-out')

        trigger = page.locator('.product-card__media').first
        trigger.click()
        opening(page, '.product-dialog')
        check(page.locator('.product-dialog__close').evaluate('e => e === document.activeElement'), 'quick shop focuses its close control')
        page.screenshot(path=str(ARTIFACTS / 'desktop-quick-shop.png'))
        page.locator('.product-dialog__close').click()
        closing(page, '.product-dialog')
        check(trigger.evaluate('e => e === document.activeElement'), 'quick shop returns focus to its trigger')

        trigger.click(); settle(page, '.product-dialog')
        page.keyboard.press('Escape'); closing(page, '.product-dialog')
        trigger.click(); settle(page, '.product-dialog')
        page.mouse.click(8, 500); closing(page, '.product-dialog')

        # Add-to-bag flow plus a real toast entry and exit.
        trigger.click(); settle(page, '.product-dialog')
        page.locator('.product-dialog__size').first.click()
        page.locator('.product-dialog__add').click()
        closing(page, '.product-dialog')
        check(page.locator('[data-toast]').is_visible(), 'adding a product shows its confirmation toast')
        check(page.locator('[data-cart-count]').inner_text() == '1', 'adding a product updates the bag count')
        page.wait_for_function("() => { const t=document.querySelector('[data-toast]'); return !t.classList.contains('is-visible') && !t.hidden; }")
        check(page.locator('[data-toast]').evaluate('e => e.getAnimations().length') > 0, 'toast fades before it becomes hidden')
        page.wait_for_function("() => document.querySelector('[data-toast]').hidden")

        bag = page.locator('.bag-button')
        bag.click(); opening(page, '.cart-drawer')
        page.locator('[data-cart-action="increase"]').click()
        check(page.locator('.cart-item__quantity-value').inner_text() == '2', 'quantity control updates the bag during the new motion lifecycle')
        page.screenshot(path=str(ARTIFACTS / 'desktop-bag.png'))
        page.keyboard.press('Escape'); closing(page, '.cart-drawer')
        check(bag.evaluate('e => e === document.activeElement'), 'bag returns keyboard focus to its opener')
        bag.click(); settle(page, '.cart-drawer')
        page.mouse.click(8, 500); closing(page, '.cart-drawer')

        # Native CSS race handling is checked in a real browser as well as the unit suite.
        race = page.evaluate("""async () => {
          const {createDialogMotion}=await import('./assets/js/utils/motion.js');
          const d=document.createElement('dialog'); d.className='cart-drawer'; document.body.append(d);
          const motion=createDialogMotion(d); motion.open();
          await Promise.allSettled(d.getAnimations().map(a=>a.finished));
          motion.close(); motion.open();
          await Promise.allSettled(d.getAnimations().map(a=>a.finished));
          await Promise.resolve(); const valid=d.open && !d.inert;
          d.close(); d.remove(); return valid;
        }""")
        check(race, 'reopening a native drawer invalidates its pending exit')

        page.goto(origin + '/products/')
        page.locator('[data-filter="shells"]').click()
        check(page.locator('.product-card').count() == 1, 'collection filters still work')
        page.locator('.product-card__media').click(); opening(page, '.product-dialog')
        page.keyboard.press('Escape'); closing(page, '.product-dialog')

        mobile = browser.new_context(viewport={'width': 393, 'height': 852}, is_mobile=True, has_touch=True)
        mobile_page = mobile.new_page()
        mobile_page.on('pageerror', lambda error: errors.append(str(error)))
        mobile_page.goto(origin)
        mobile_page.locator('.product-card').first.wait_for()
        toggle = mobile_page.locator('[data-menu-toggle]')
        toggle.click(); settle(mobile_page, '.mobile-menu')
        check(toggle.get_attribute('aria-label') == 'Close menu', 'mobile menu updates its accessible label')
        mobile_page.screenshot(path=str(ARTIFACTS / 'mobile-menu.png'))
        toggle.click()
        check(mobile_page.locator('.mobile-menu').evaluate('e => !e.hidden && e.inert'), 'mobile menu animates out while its links are inert')
        mobile_page.wait_for_function("() => document.querySelector('.mobile-menu').hidden")
        toggle.click(); toggle.click(); toggle.click()
        settle(mobile_page, '.mobile-menu')
        check(mobile_page.locator('.mobile-menu').evaluate('e => !e.hidden && !e.inert'), 'rapid mobile toggles preserve the final open state')
        mobile_page.keyboard.press('Escape')
        mobile_page.wait_for_function("() => document.querySelector('.mobile-menu').hidden")
        toggle.click(); settle(mobile_page, '.mobile-menu')
        mobile_page.mouse.click(10, 400)
        mobile_page.wait_for_function("() => document.querySelector('.mobile-menu').hidden")
        check(toggle.get_attribute('aria-expanded') == 'false', 'outside click dismisses mobile navigation')
        mobile_page.locator('.bag-button').click(); opening(mobile_page, '.cart-drawer')
        check(mobile_page.locator('.cart-drawer').evaluate('e => e.getBoundingClientRect().width') <= 393, 'drawer fits the mobile viewport')
        mobile_page.screenshot(path=str(ARTIFACTS / 'mobile-bag.png'))
        mobile_page.locator('.cart-drawer__close').click(); closing(mobile_page, '.cart-drawer')
        mobile_page.locator('.product-card__media').first.click(); opening(mobile_page, '.product-dialog')
        check(mobile_page.locator('.product-dialog').evaluate('e => e.getBoundingClientRect().width') < 393, 'quick shop fits the mobile viewport')
        mobile_page.screenshot(path=str(ARTIFACTS / 'mobile-quick-shop.png'))
        mobile_page.keyboard.press('Escape'); closing(mobile_page, '.product-dialog')
        check(mobile_page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'mobile page has no horizontal overflow')

        reduced = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
        rp = reduced.new_page(); rp.goto(origin)
        rp.locator('.product-card__media').first.click()
        check(rp.locator('.product-dialog').evaluate('e => e.getAnimations().length') == 0, 'reduced-motion quick shop has no CSS animation')
        rp.keyboard.press('Escape')
        check(rp.locator('.product-dialog').evaluate('e => !e.open'), 'reduced-motion dismissal is immediate')
        rp.locator('.bag-button').click()
        check(rp.locator('.cart-drawer').evaluate('e => e.getAnimations().length') == 0, 'reduced-motion drawer has no CSS animation')
        rp.locator('.cart-drawer__close').click()
        check(rp.locator('.cart-drawer').evaluate('e => !e.open'), 'reduced-motion drawer closes immediately')
        check(not errors, f'no browser JavaScript errors: {errors}')
        browser.close()
        print(f'{checks} real-browser motion checks passed. Screenshots: {ARTIFACTS}', flush=True)
finally:
    server.shutdown()
    server.server_close()
