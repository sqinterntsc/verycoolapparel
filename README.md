# Verycoolapparel

A premium outdoor apparel storefront built with **vanilla HTML, CSS, and JavaScript**. No framework, packages, build step, or application backend.

## Run locally

From this folder:

```sh
python3 -m http.server 8000
```

Open **http://localhost:8000**. The collection is at **http://localhost:8000/products/**.

Use a local HTTP server instead of double-clicking the HTML files: browsers restrict ES module imports on `file://` URLs. This command only serves static files; it does not implement an application backend.

## Structure

```text
index.html                       Landing page and main entry point
products/index.html              Collection, filters, search, and sorting
assets/
  css/
    main.css                     CSS entry point
    tokens.css                   Colors, typography, spacing
    base.css                     Reset, accessibility, shared primitives
    layout.css                   Navigation and footer
    components.css               Cards, buttons, product dialog, bag drawer
    pages.css                    Landing and collection page layouts
  images/                        Preserved illustration assets
    photorealistic/
      products/<product>/       Product-specific image sets; base-v3.webp is primary
      editorial/                Campaign and landscape imagery
  js/
    app.js                       Shared initialization
    data/products.js             Collection data, prices, sizes, asset paths
    components/product-card.js   Shared product card renderer
    features/cart-store.js       Cart state, validation, localStorage
    features/cart-ui.js          Bag drawer and quantity controls
    features/product-dialog.js  Product details and size selection
    pages/catalog.js             Category filtering, search, sorting
    utils/currency.js            USD formatting
docs/assets/                     Image provenance and editable product sources
```

## Make changes

- **Head snippets:** edit the clearly marked `<head>` in `index.html`. Add any shared snippets to `products/index.html` too. The HTML is delivered directly to the browser.
- **Products:** edit `assets/js/data/products.js`. Add product images to `assets/images/`. Product names, descriptions, prices, sizes, and specifications are centralized.
- **Visual style:** edit `assets/css/tokens.css` for the palette and spacing. Component styles and page layouts have separate files.
- **New pages:** create a folder with an `index.html` and use the existing relative CSS/module paths. Shared header/footer HTML is intentionally explicit in each page.
- **Future React migration:** product data, cart state, formatting, and filtering are separate from DOM rendering. Replace the view modules while adapting the state/data modules.

## Shopping behavior

- Open a product to view its details and choose a size before adding it to your bag. Each product modal has a three-image gallery: floating Studio photograph, an on-body rain/snow close-up, and an extreme-angle Off axis view. Navigate with arrows, thumbnails, left/right keys while focused inside the gallery, or a horizontal swipe. Reopening resets to Studio; switching views preserves the selected size.
- Each product/size combination is a separate bag item. Increase or decrease quantities and remove items.
- The header count and subtotal update immediately. Bags persist in `localStorage` and synchronize across tabs on the same origin. Storage restrictions fall back to an in-memory bag.
- The collection supports category filters, category links, text search, and price sorting.
- Native `<dialog>` elements support modal focus, Escape to close, and focus return. Mobile navigation and reduced-motion preferences are supported.

## Assets and concept limitations

The live storefront uses four AI-generated photorealistic garment concepts and one campaign landscape. Product images live in product-specific directories under `assets/images/photorealistic/products/`; `base-v3.webp` is the primary storefront image; the original `base.webp` files remain preserved. The earlier locally rendered illustrations remain preserved directly under `assets/images/`. See `assets/images/photorealistic/` and `docs/assets/` for provenance, art direction, prompts, and source artwork.

All garments, specifications, and USD prices are concept content. The shell is an original technical design; no third-party textile licensing or certification is claimed. There is no inventory service, checkout integration, payment collection, or order submission. The bag's demo checkout explicitly explains this and creates no order.

For production, replace concept specifications with verified product information, supply final brand assets, and connect checkout and inventory to your chosen commerce service.

## Verification

The product galleries have 13 dependency-free DOM-event regression checks in `tests/product-gallery.test.cjs` covering arrows, wraparound, thumbnails, keyboard navigation, swipe direction/cancellation, recoverable image errors, modal reset, single-image fallback, selected-size preservation, add-to-bag callbacks and focus return. Run with Node: `node tests/product-gallery.test.cjs`. These are controller checks with a DOM double, not interactive browser layout verification. Four weather images and four extreme-angle images decode correctly at 1408 × 1760; each gallery's three actual file paths were verified.

Cart and catalog logic were exercised in macOS JavaScriptCore: separate size variants, quantity changes, removal, subtotals, duplicate cart records, malformed storage, unavailable storage, category filtering, case-insensitive search, and both price sort directions passed. JavaScript bodies were checked for syntax, and static HTTP checks verified page links, module imports, stylesheet imports, and JavaScript MIME types.

Interactive browser verification could not run in this environment: macOS denied Chrome's process launch, and the remote browser launcher was unavailable. Desktop and mobile browser interaction should be checked when opening the local site.
