"""Real-browser checks for versioned CGI product bases. Uses the existing local server."""
from pathlib import Path
from tempfile import gettempdir
import os
from playwright.sync_api import sync_playwright

VERSION = os.environ.get('IMAGE_VERSION', 'v3')
LABEL = 'Elements render' if VERSION == 'v3' else 'Field render'
OUT = Path(gettempdir()) / f'verycoolapparel-base-{VERSION}-qa'
OUT.mkdir(exist_ok=True)
ORIGIN = 'http://127.0.0.1:8000'
SLUGS = ('traverse-short', 'contour-merino', 'altitude-fleece', 'strata-shell')

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'))
    errors = []
    for name, width, height in (('desktop', 1440, 1000), ('mobile', 393, 852)):
        context = browser.new_context(viewport={'width': width, 'height': height}, reduced_motion='reduce')
        page = context.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        for route, suffix in (('/', 'home'), ('/products/', 'collection')):
            page.goto(ORIGIN + route)
            page.locator('.product-card').first.wait_for()
            page.locator('.product-grid').scroll_into_view_if_needed()
            page.wait_for_function("""() => [...document.querySelectorAll('.product-card__image')].every(
                e => e.complete && e.naturalWidth > 0)""")
            page.evaluate("""async () => {
                await Promise.all([...document.querySelectorAll('.product-card__image')].map(e => e.decode()));
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            }""")
            cards = page.locator('.product-card__image').evaluate_all("""els => els.map(e => ({
                src: e.currentSrc, fit: getComputedStyle(e).objectFit,
                width: e.naturalWidth, height: e.naturalHeight,
                media: e.parentElement.getBoundingClientRect().toJSON(),
                image: e.getBoundingClientRect().toJSON()
            }))""")
            assert len(cards) == 4
            for slug, card in zip(SLUGS, cards):
                assert card['src'].endswith(f'/{slug}/base-{VERSION}.webp'), card
                assert card['fit'] == 'cover', card
                assert card['width'] == card['height'] and card['width'] >= 1600, card
                assert abs(card['media']['width'] - card['image']['width']) < 1, card
                assert abs(card['media']['height'] - card['image']['height']) < 1, card
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.locator('#field-system' if suffix == 'home' else '.product-grid').screenshot(
                path=str(OUT / f'{name}-{suffix}.png'))
            print(f'PASS {name} {suffix}: four {VERSION} images fill cards, no letterboxing or horizontal overflow')
        page.goto(ORIGIN)
        for slug in SLUGS:
            page.locator(f'[data-product-id="{slug}"] .product-card__media').click()
            img = page.locator('.product-dialog__image')
            img.wait_for(state='visible')
            page.wait_for_function("() => {const e=document.querySelector('.product-dialog__image'); return e.complete && e.naturalWidth > 0;}")
            assert img.get_attribute('src').endswith(f'/{slug}/base-{VERSION}.webp')
            assert img.evaluate('e => getComputedStyle(e).objectFit') == 'cover'
            assert page.locator('.product-gallery__status').inner_text() == f'{LABEL} · 1 / 3'
            page.locator('.product-gallery__next').click()
            assert img.get_attribute('src').endswith('lifestyle-01.webp')
            page.locator('.product-gallery__next').click()
            assert img.get_attribute('src').endswith('lifestyle-02.webp')
            page.locator('.product-gallery__next').click()
            assert img.get_attribute('src').endswith(f'base-{VERSION}.webp')
            page.locator('.product-dialog__close').click()
        print(f'PASS {name}: all product galleries retain on-body images and wrap to {VERSION}')
        context.close()
    assert not errors, errors
    browser.close()
    print('PASS no browser JavaScript errors')
