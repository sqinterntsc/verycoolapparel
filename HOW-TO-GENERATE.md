# How to generate product pages

The storefront uses vanilla HTML, CSS and JavaScript. Product information lives
in one shared data module. A Node.js script combines that data with one HTML
template and writes a complete static page for each implemented product.

## Is this a standard approach?

**Static site generation** is a common industry approach: render pages at build
time, then publish ordinary HTML files. It works well on hosts such as GitHub
Pages because visitors do not need an application server to render a page.

This project's generator is a small custom implementation of that pattern. It
is not a framework or a standardized generator API. Tools such as Astro,
Eleventy and Hugo provide the same general pattern with more features. For this
four-product storefront, the custom script keeps dependencies and setup small.

## What does `.mjs` mean?

An `.mjs` file contains JavaScript. Its extension explicitly tells Node.js to
treat it as an **ES module**, which supports `import`, `export` and top-level
`await`. It is not a separate language, template format or compilation step.

In Node.js:

- `.mjs` explicitly means an ES module.
- `.cjs` explicitly means a CommonJS module, using `require()` and
  `module.exports`.
- `.js` follows the package's module configuration. This project's
  `package.json` contains `"type": "module"`, so its `.js` files are ES modules
  too. Here, a `.mjs` script could also use `.js` with the imports updated.

We use `.mjs` for Node build scripts to make their module format explicit.
Browser modules use `.js` and load through `<script type="module">`.

## Where everything lives

| File or folder | Purpose | Edit directly? |
| --- | --- | --- |
| [assets/js/data/products.js](assets/js/data/products.js) | Central product objects, sizes, specifications and image references | Yes |
| [scripts/templates/product.html](scripts/templates/product.html) | Shared product-page layout, navigation, footer and head metadata | Yes |
| [scripts/product-pages.mjs](scripts/product-pages.mjs) | `generateProductPages()` reads the template and writes HTML files | When changing generation behavior |
| [scripts/generate-products.mjs](scripts/generate-products.mjs) | Entry point for `npm run generate:products` | Usually no |
| [scripts/config.mjs](scripts/config.mjs) | Loads `.env` and shell configuration; writes public backend configuration | When changing configuration behavior |
| [scripts/serve.mjs](scripts/serve.mjs) | Generates pages and starts the local static server | Usually no |
| [scripts/build.mjs](scripts/build.mjs) | Builds the deployable `_site/` directory | Usually no |
| `products/<product-id>/index.html` | Generated HTML pages kept in the repository | Regenerate them |
| `_site/` | Generated deployment output; ignored by Git | Rebuild it |
| [assets/js/pages/product.js](assets/js/pages/product.js) | Browser gallery setup, size selection, quantities and ViewContent | When changing product interactions |
| [assets/css/product.css](assets/css/product.css) | Standalone product-page layout | Yes |

The four generated source pages are:

- [products/traverse-short/index.html](products/traverse-short/index.html)
- [products/contour-merino/index.html](products/contour-merino/index.html)
- [products/altitude-fleece/index.html](products/altitude-fleece/index.html)
- [products/strata-shell/index.html](products/strata-shell/index.html)

Each folder becomes a URL such as `/products/strata-shell/`. Its `index.html`
lets a static host handle direct visits and refreshes without route rewrites.
If GitHub Pages serves the repository under `/verycoolapparel/`, that prefix
also appears in the deployed URL.

## Central product data

`products.js` exports a `products` array of JavaScript objects. There are no
separate product JSON files for each page. Each object defines an `id`, `name`,
`price`, `category`, `categoryLabel`, `color`, `description`, `sizes`, `specs`
and image information.

The module also:

- Resolves product image URLs relative to its own location using
  `new URL(..., import.meta.url)`.
- Shares the size list between products.
- Uses `.map()` to attach the three-image gallery and featured order to each
  product.
- Exports `productById`, a Map that lets browser code look up a product by ID.

The homepage, collection, bag, product-page controller and generator import
this same module. To change a description, price or specification, edit the
product object here and regenerate the HTML.

The data array currently contains only the four implemented products. The
isotherm gaiter, ridge trail shoe and trace gilet assets are outside this
collection. **The generator reads product data, not image directories**, so
having those assets on disk does not generate pages or add them to the shop.
If you add their objects to the array later, they will be included; the
generator does not have a separate four-product limit.

## Routine editing and regeneration

Use Node.js 22 or newer. The local preview also needs Python 3. Run commands
from the storefront repository:

```sh
cd /Users/thiashanquan/Documents/verycoolapparel
```

1. Edit `assets/js/data/products.js` for product information,
   `scripts/templates/product.html` for shared page HTML, or
   `assets/css/product.css` for page layout.
2. Regenerate the checked-in pages:

   ```sh
   npm run generate:products
   ```

3. Check the generated changes:

   ```sh
   git diff -- products
   ```

   Newly generated files appear in `git status` until added to Git.

4. Run the local checks and create the deployment output:

   ```sh
   npm test
   npm run build
   ```

5. Preview the site:

   ```sh
   npm run dev
   ```

   With the example `PORT=8000`, open
   `http://localhost:8000/products/strata-shell/`. Open through HTTP rather
   than double-clicking an HTML file because the browser uses module imports.
   Stop the server with **Ctrl+C**.

`npm run dev` regenerates pages **when it starts**. It does not watch files or
regenerate HTML continuously. After another data or template edit, run
`npm run generate:products` and reload the browser, or restart the server.

Do not edit generated product HTML as the main source: the next generation
overwrites it. Commit both the edited source files and regenerated product
pages. Build output under `_site/` stays out of Git.

## Configuration and deployment

`scripts/config.mjs` reads the local `.env` and then applies shell environment
variables on top. Shell values take precedence.

- `PORT` controls the local preview server.
- `BACKEND_URL` is required for `npm run dev` and `npm run build`. It is written
  to the public `assets/js/env.js` configuration. Standalone page generation
  does not validate or require this setting.
- `SITE_URL` optionally sets the storefront base URL for absolute canonical,
  social page and social image URLs. It includes any repository path, for
  example `https://sqinterntsc.github.io/verycoolapparel/`.

Without `SITE_URL`, local page generation uses relative metadata URLs. For a
manual production build, supply the real deployed base URL:

```sh
SITE_URL=https://sqinterntsc.github.io/verycoolapparel/ npm run build
```

The [GitHub Pages workflow](.github/workflows/pages.yml) runs when changes are
pushed to `main`. It:

1. Checks out the committed repository and installs Node.js 22.
2. Reads the GitHub Pages configuration with `actions/configure-pages`.
3. Passes the configured Pages `base_url` as `SITE_URL` and the repository's
   public `BACKEND_URL` variable to `npm run build`.
4. Uploads `_site/` and deploys it to GitHub Pages.

`npm run build` clears `_site/`, copies the homepage, products and assets,
writes public environment configuration, then regenerates product HTML
**inside `_site/`** with production metadata URLs. It does not rewrite the
checked-in source pages. Deployment therefore uses current data and the
configured production base URL.

Keep access tokens and other backend secrets in the backend configuration.
The frontend's environment output is public.

## Generation code flow

For the manual generation command, the call chain is:

```text
npm run generate:products
  scripts/generate-products.mjs
    loads env and projectRoot from scripts/config.mjs
    calls generateProductPages(projectRoot, { siteUrl: env.SITE_URL })
      scripts/product-pages.mjs
        reads scripts/templates/product.html
        imports products from assets/js/data/products.js
        loops over the products
        writes products/<product-id>/index.html
```

Inside `generateProductPages()`:

1. Read the shared template once and validate an optional `SITE_URL`.
2. For each product, prepare its name, description, formatted price,
   category, color, image path and metadata URLs.
3. Escape text and attribute values so characters such as `&` and `"` are
   safe in HTML.
4. Build the repeated specification rows and size buttons with `.map()` and
   `.join('')`.
5. Replace template tokens such as `{{name}}`, `{{description}}`, `{{specs}}`
   and `{{sizes}}` with the prepared values. Unknown tokens cause an error.
6. Create the product directory and write its complete `index.html`.

The pages repeat the shared markup in the output, but their editable sources
are centralized. Product details and metadata are already present when the
browser receives the HTML; JavaScript does not need to populate the product
heading, description or price at runtime.

## Browser and tracking code flow

The product layout in `assets/css/product.css` reserves space for the header and
breadcrumb within `100svh`, with a `100vh` fallback. `svh` uses the smaller,
stable viewport when mobile browser controls are visible; `dvh` changes as
those controls expand or retract. The gallery shrinks with available height,
and description/specifications sit in a native expandable `<details>` after
the size, quantity and Add to bag controls. Expanding product information can
extend the page, but does not move the purchase controls below that section.

1. Homepage and collection cards use `utils/product-url.js` to create ordinary
   product links. Resolving URLs from the module preserves the deployment's
   repository prefix.
2. Clicking a link loads the corresponding static document. Back, Forward,
   refresh and opening a link in a new tab use normal browser navigation.
3. The HTML loads CSS, public environment configuration and `assets/js/app.js`.
   Its Pixel snippet queues one `PageView`.
4. `app.js` calls `initProductPage()`. The controller reads
   `data-product-page="strata-shell"` from the generated article and looks up
   that ID in `productById`.
5. `features/product-gallery.js` adds the three-image gallery controls. The
   controller enables size selection and updates the quantity and add button
   according to the selected size and remaining cart capacity.
6. `utils/meta-events.js` queues one `ViewContent` with the product ID, name,
   category, price and currency. Size, quantity and gallery changes do not
   create extra view events.
7. Adding to the bag calls `features/cart-actions.js`, which commits the
   selected product, size and quantity through `features/cart-store.js`.
8. The cart action reports the actual quantity added as Pixel `AddToCart` and
   posts it to `${BACKEND_URL}/api/prod/AddToCart`. Both use the same event ID
   for deduplication. `event_source_url` is the current product-page URL.
9. Cart subscriptions update the bag count and purchase controls. `app.js`
   displays the confirmation toast; the visitor stays on the product page.

The shopping bag still uses its existing native dialog. Product details use
standalone pages. Only AddToCart currently has a backend Conversions API
integration; ViewContent is a browser Pixel event.

## Checks and troubleshooting

`npm test` runs the gallery, generated-page, tracking, cart and shared UI
checks. The generated-page checks verify all four products, metadata under a
repository prefix and preservation of unrelated directories. Tests mock
tracking transport and do not send live Meta events.

For browser verification, check direct product links and refreshes, all three
gallery images, size selection, quantities, bag persistence, and mobile
layout. When verifying real Meta receipt yourself, use Events Manager's Test
events and check for one PageView and one ViewContent per product load.

| Symptom | What to check |
| --- | --- |
| Old description or price in the page | Regenerate the source HTML and reload; rebuild and deploy for the hosted site |
| Changes vanish after regeneration | Edit the shared data or template instead of generated HTML |
| A direct product URL returns 404 | Confirm its `products/<id>/index.html` exists in the deployed output and include the repository URL prefix |
| Build reports missing `BACKEND_URL` | Set it in local `.env` or the GitHub Actions repository variables |
| Canonical or social URLs point to the wrong host | Check `SITE_URL` and the GitHub Pages base URL used during the build |
| New image assets unexpectedly become shop products | Check whether their objects were added to `products.js`; the generator never scans assets to discover products |

The generator does not delete unrelated directories. If a product is removed
later, also remove its previously generated source folder and update relevant
links and tests; removing only its data object leaves old HTML on disk.
