# Cart actions and event flow

This guide traces storefront clicks through cart state, Meta Pixel and the backend. Start here when changing add-to-bag behavior or debugging an AddToCart request.

## The two sets of quantity controls

The product page has a quantity selector next to **Add to bag** (or **Add 3 to bag**). Its **+** and **−** buttons change the quantity selected for a future addition. Clicking **Add to bag** commits that selection to the cart and triggers tracking.

The bag drawer has separate **+** and **−** buttons for items already in the cart. Those buttons immediately change cart state. A successful increase also triggers an AddToCart backend request.

| User action | Cart state | Pixel event | Backend request |
| --- | --- | --- | --- |
| Select a size in the product page | Unchanged | None | None |
| Product page quantity **+** or **−** | Unchanged; changes the page selection | None | None |
| Product page **Add to bag** | Adds the selected product, size and quantity | `AddToCart` | `POST /api/prod/AddToCart` |
| Bag drawer **+** | Increases the existing item quantity | `AddToCart` | `POST /api/prod/AddToCart` |
| Bag drawer **−** | Decreases quantity; removes the item if it reaches zero | Custom `RemoveFromCart` | None |
| Bag drawer **Remove** | Removes the item | Custom `RemoveFromCart` | None |
| Demo checkout | Unchanged; creates no order | `InitiateCheckout` | None |
| An action that produces no actual cart change | Unchanged | None | None |

Pixel calls require `globalThis.fbq` to be available. AddToCart backend reporting can still run when Pixel is unavailable. Backend reporting requires the generated `APP_ENV.BACKEND_URL` configuration.

## Where to start in the code

| File | Responsibility and symbols to look for |
| --- | --- |
| [app.js](../assets/js/app.js) | `init()` initializes the product page and bag drawer. Its `onAdded` callback displays the toast. |
| [product.js](../assets/js/pages/product.js) | `updateControls()` refreshes the selected quantity. `add.addEventListener('click', ...)` calls `addProductToCart()`. |
| [cart-ui.js](../assets/js/features/cart-ui.js) | The delegated click handler reads `data-cart-action` and handles `increase`, `decrease` and `remove`. |
| [cart-actions.js](../assets/js/features/cart-actions.js) | `addProductToCart()` and `setProductQuantity()` calculate the actual change and call `trackQuantityChange()`. The latter also contains the backend `fetch()`. |
| [cart-store.js](../assets/js/features/cart-store.js) | Validates items, caps each product/size quantity at 99, persists state to localStorage and notifies UI subscribers. Storage failures fall back to memory. |
| [meta-events.js](../assets/js/utils/meta-events.js) | `createEventID()`, `trackAddToCart()` and `trackRemoveFromCart()` build IDs and Pixel payloads. |

`trackQuantityChange()` is an internal helper. UI modules reach it through the exported cart actions.

## Product page: Add to bag

1. The visitor opens a product and selects a size.
2. The product page quantity buttons change the selected quantity and call `updateControls()`. This updates the displayed quantity and button label. It does not call a cart action.
3. The **Add to bag** click handler checks that a product and size are selected, then calls:

   ```js
   addProductToCart({ product, size: selectedSize, quantity });
   ```

4. `addProductToCart()` reads the previous quantity, calls the store's `addItem()`, and calculates:

   ```js
   const quantityChanged = getQuantity(product.id, size, cart) - previousQuantity;
   trackQuantityChange({ product, size, quantityChange: quantityChanged });
   ```

5. `trackQuantityChange()` uses the positive change to call `trackAddToCart()`. That creates a shared event ID and commerce payload, queues the Pixel event if available, and returns the ID and payload.
6. `trackQuantityChange()` sends those returned values to the backend using `fetch()`.
7. `onAdded()` displays a toast while the visitor stays on the product page. This callback does not send another tracking event. The cart UI updates through store subscriptions.

For example, selecting 3 and clicking **Add 3 to bag** produces one AddToCart request with `contents[0].quantity: 3`. If the cart already held 2 of that product/size, the resulting cart quantity is 5, while the event still describes the 3 newly added items.

## Bag drawer: change an existing item

The bag drawer's delegated click handler finds the current product/size item and calls:

```js
// Bag drawer +
setProductQuantity({ product: item.product, size: item.size, quantity: item.quantity + 1 });

// Bag drawer −
setProductQuantity({ product: item.product, size: item.size, quantity: item.quantity - 1 });

// Bag drawer Remove
removeProductFromCart({ product: item.product, size: item.size });
```

`setProductQuantity()` commits the new quantity, calculates the difference from the previous quantity, and calls `trackQuantityChange()`. `removeProductFromCart()` reaches the same path by setting quantity to zero.

- A positive difference queues Pixel `AddToCart` and submits one backend AddToCart request.
- A negative difference queues custom Pixel `RemoveFromCart` with the absolute quantity removed. There is no removal backend request.
- A zero difference returns before tracking. Invalid additions and additions already capped at 99 do not submit events.

The value reported for additions is `product.price * quantityChange`, using USD. The event describes the change, rather than the entire cart subtotal.

## Event ID and backend payload

The event ID is created once per successful addition:

```js
function createEventID(eventPrefix) {
  return `${eventPrefix}.${PIXEL_ID}.${crypto.randomUUID()}`;
}

// Inside trackAddToCart:
const eventID = createEventID('addcart');
```

`eventPrefix` is a project-defined string, not a mouse event. Native `crypto.randomUUID()` generates UUIDv4 and requires HTTPS or localhost. Removal events use the `removecart` prefix.

Pixel receives the ID as `{ eventID }`. The AddToCart request sends that exact string as `data[0].event_id`, allowing Meta to deduplicate the browser and server events when the Pixel ID and event name match.

The frontend posts to `${APP_ENV.BACKEND_URL}/api/prod/AddToCart` with:

- `event_id`: the shared ID returned by `trackAddToCart()`.
- `event_time`: occurrence time in Unix seconds.
- `event_source_url`: the current page URL.
- `user_data`: browser user agent and available `_fbp`/`_fbc` cookie values.
- `custom_data`: the same commerce payload passed to Pixel, including product IDs, name, category, size, actual added quantity, unit price, value and currency.

The frontend does not collect or submit an IP address. The Cloudflare backend reads and validates `CF-Connecting-IP`, logs it on production request receipt and adds it to Meta's `user_data.client_ip_address`. The plain local Node server does not automatically capture a public visitor IP.

The backend sets `event_name: 'AddToCart'` and `action_source: 'website'`, preserves the shared event ID, and forwards the event to Meta. Only AddToCart currently has a storefront backend integration. See the [backend contract](../../verycoolapparel-backend/README.md#production-addtocart-contract) for server behavior.

## Debugging and verification

1. Begin with the button handler in `product.js` or `cart-ui.js` to establish which controls were clicked.
2. Follow the exported action into `cart-actions.js` and inspect `quantityChanged`. Reporting happens after the store commits the cart change.
3. Inspect `[Meta Pixel] AddToCart queued` in the browser console. It means `fbq()` was invoked; it does not confirm receipt by Meta.
4. In browser Network tools, inspect the POST to `/api/prod/AddToCart`. Its `event_id` should match the Pixel log, and `contents[0].quantity` should match the actual increase. Product page quantity selector clicks alone produce no POST.
5. Inspect `[Meta CAPI] AddToCart <status>` or `[Meta CAPI] AddToCart request failed` in the browser console. The fetch uses `keepalive: true` and runs asynchronously; API/network failures do not undo the cart and are not retried automatically.
6. If no POST appears after a successful addition, check generated `assets/js/env.js` and the missing `BACKEND_URL` console error. If the browser rejects the request, check the backend's `FRONTEND_ORIGINS`. See [setup instructions](../README.md#addtocart-api).
7. Inspect backend `[API]` receipt/status logs and `[Meta CAPI]` response logs for server-side failures. Worker receipt logs contain the captured IP when available; it is added server-side and therefore will not appear in the frontend request body.

Existing automated checks use mocked transport and do not submit live Meta events:

```sh
node --test tests/cart-api.test.mjs tests/cart-actions.test.mjs tests/meta-events.test.mjs
node tests/product-gallery.test.cjs
```

The cart/API checks cover actual quantity differences, shared IDs, capped changes, removals and reporting failures. The gallery controller checks include the add-to-bag callback path. These tests do not verify browser layout or prove that a deployed Meta integration accepts events.
