# Verycoolapparel

A premium outdoor apparel storefront built with **vanilla HTML, CSS, and JavaScript**. A small build script generates public environment configuration; no framework or dependencies. Cart event reporting connects to the separate Verycoolapparel backend.

## Run locally

From this folder:

```sh
cp .env.example .env
npm run dev
```

Requires Node.js 22+ and Python 3. Set `PORT` and `BACKEND_URL` in `.env`. Open **http://localhost:8000** with the example settings; the collection is at **http://localhost:8000/products/**. Restart the server after changing `.env`.

Use a local HTTP server instead of double-clicking the HTML files: browsers restrict ES module imports on `file://` URLs. This command only serves static files; it does not implement an application backend.

### AddToCart API

For the button-by-button call paths, read [Cart actions and event flow](docs/cart-event-flow.md). The product dialog's quantity selector changes the intended addition; **Add to bag** commits it. The bag drawer's quantity buttons immediately update existing cart items.

Start the backend separately with `pnpm dev` in `../verycoolapparel-backend`. Cart events call `${BACKEND_URL}/api/prod/AddToCart`. Match the local backend's `PORT` to the port in `BACKEND_URL`. Set the backend's `FRONTEND_ORIGINS` to allow the storefront origin (including the local frontend `PORT`). The backend must have the new route, CORS configuration and Meta credentials deployed for the hosted integration to work.

### GitHub Pages environment configuration

1. In repository **Settings → Secrets and variables → Actions → Variables**, add `BACKEND_URL` with your deployed backend base URL (currently `https://verycoolapparel-backend.thiashanquan.workers.dev`). You can also set it as a variable on the `github-pages` environment.
2. In **Settings → Pages**, select **GitHub Actions** as the deployment source.
3. Push to `main` or run **Deploy GitHub Pages** manually. If your default branch differs, update `.github/workflows/pages.yml`.

GitHub Pages cannot read environment variables at runtime. The workflow runs `npm run build`, writes only the public `BACKEND_URL` into `assets/js/env.js`, and deploys `_site/`. Changing the variable requires another deployment. Local `.env` files are ignored and excluded from the deployment artifact. Never put Meta access tokens in frontend configuration; keep them in the backend environment.

For a manual build, run `npm run build` with `.env` configured or `BACKEND_URL` set in the shell. Browser URLs come from the generated config rather than hostname detection. A missing `BACKEND_URL` fails the build; if a page is served without generated config, cart changes still work and API reporting logs the missing setting.

`cart-actions.js` calls the API after `cart-store.js` commits a successful quantity increase. It sends the actual added quantity and value, current event time, page URL, browser user agent and available `_fbp`/`_fbc` cookie values. No sample email hash or phone placeholder is sent. Quantity decreases, removals and changes capped at the cart limit do not submit AddToCart events.

The Cloudflare backend captures the visitor's public IP from `CF-Connecting-IP`, logs it on production request receipt and adds it to the Meta payload as `user_data.client_ip_address`. The browser does not need to look up or submit its IP address. Deploy the backend IP capture changes to enable this behavior; the plain local Node server does not capture a public IP.

IDs have the form `addcart.<pixel_id>.<UUIDv4>`, generated using native `crypto.randomUUID()`. The same ID is sent as Pixel `eventID` and backend `event_id` for deduplication. `PIXEL_ID` in `assets/js/utils/meta-events.js` matches the Pixel initialized on both HTML pages; keep them aligned if you change the Pixel.

The fetch call runs asynchronously. The cart remains usable if reporting fails; Meta's response status/body or network errors appear in the browser console under `[Meta CAPI]`. A fresh event ID is generated for each addition, including repeated additions of the same product.

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
    env.js                       Generated public BACKEND_URL configuration
    data/products.js             Collection data, prices, sizes, asset paths
    components/product-card.js   Shared product card renderer
    features/cart-store.js       Cart state, validation, localStorage
    features/cart-actions.js     Cart actions, Pixel tracking and AddToCart fetch
    utils/meta-events.js         Pixel payloads and native UUIDv4 event IDs
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

- Open a product to view its details and choose a size before adding it to your bag. Each product modal has a three-image gallery: a floating product image, an on-body rain/snow close-up, and an extreme-angle view. Navigate with the overlaid arrows and dots, left/right keys while focused inside the gallery, or a horizontal swipe. Reopening resets to the first image; switching views preserves the selected size.
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


Cart/API checks: `node --test tests/cart-api.test.mjs`, `node tests/cart-actions.test.mjs`, and `node tests/meta-events.test.mjs`. Transport is mocked, so these checks do not submit live Meta events.
