# Tracking Meta Pixel events with code

The base Meta Pixel currently records `PageView` using pixel ID `1111051611838188` in the root and products HTML pages. The examples below are a reference for adding explicit commerce events later; they are **not currently wired into the application**.

## Why use code-based events

Code-based events fire at the point where the application confirms an action. They are less fragile than Event Setup Tool rules based on button text or page structure, and they can include product IDs, prices, quantities, sizes, and cart totals.

Do not enable the same event through both application code and the Event Setup Tool. Doing so can double-count it.

## Suggested standard events

| Application action | Meta standard event | When to fire |
| --- | --- | --- |
| Product quick-view dialog opens | `ViewContent` | After a valid product is loaded into the dialog |
| Product is added to the bag | `AddToCart` | After `addItem()` succeeds |
| Checkout button is selected | `InitiateCheckout` | When checkout begins with a non-empty cart |
| A real order succeeds | `Purchase` | Only after payment/order confirmation, never on the current demo checkout |

## Optional tracking helper

A future implementation could add `assets/js/utils/meta-pixel.js`:

```js
export function trackMetaEvent(eventName, parameters = {}) {
  const fbq = globalThis.fbq;
  if (typeof fbq !== 'function') return false;

  fbq('track', eventName, parameters);
  return true;
}
```

The base snippet creates `fbq` synchronously, so calls made while Meta's external script is still loading are queued.

## Track product views

In `assets/js/features/product-dialog.js`, call the helper from `open()` after the product has been populated:

```js
function open(product, trigger = document.activeElement) {
  if (!product) return;
  populate(product);
  motion.open(trigger);

  trackMetaEvent('ViewContent', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price,
    currency: 'USD',
  });
}
```

## Track additions to the bag

In the same file, call the helper only after the selected product and size have passed validation and `addItem()` has run:

```js
addItem(activeProduct.id, selectedSize);

trackMetaEvent('AddToCart', {
  content_ids: [activeProduct.id],
  content_name: activeProduct.name,
  content_type: 'product',
  contents: [{
    id: activeProduct.id,
    quantity: 1,
    item_price: activeProduct.price,
  }],
  value: activeProduct.price,
  currency: 'USD',
});
```

Size can be included as an additional custom parameter if it is useful for reporting:

```js
size: selectedSize,
```

## Track checkout initiation

`assets/js/features/cart-ui.js` already imports `getDetailedCart()`, `getCartCount()`, and `getCartSubtotal()`. Its checkout handler could record:

```js
checkout.addEventListener('click', () => {
  const cart = getDetailedCart();
  if (!cart.length) return;

  trackMetaEvent('InitiateCheckout', {
    content_ids: cart.map(({ product }) => product.id),
    content_type: 'product',
    contents: cart.map(({ product, quantity }) => ({
      id: product.id,
      quantity,
      item_price: product.price,
    })),
    num_items: getCartCount(),
    value: getCartSubtotal(),
    currency: 'USD',
  });

  // Continue the checkout flow.
});
```

The current site has a demonstration checkout and creates no order or payment. `InitiateCheckout` may be useful for interface testing, but `Purchase` must not be fired.

## Testing an implementation

1. Open the pixel's **Test events** page in Events Manager.
2. Start the website test from that page and leave Events Manager open.
3. Perform exactly one action on the website.
4. In browser developer tools, filter Network requests for `facebook.com/tr`.
5. Confirm the request has the correct pixel `id`, the expected `ev` value, and a successful HTTP status.
6. Confirm the event and parameters appear in Test Events before testing the next action.

Expected request event names include:

```text
ev=ViewContent
ev=AddToCart
ev=InitiateCheckout
```

The normal Overview dashboard can take around 30 minutes to update; Test Events is the appropriate real-time view.

## Event Setup Tool notes

Events listed inside the Event Setup Tool are configured rules, not proof that those events have fired. Rules remain drafts until **Finish setup** is selected and the confirmation/publish step is completed. After publishing, close the setup overlay and perform each configured action again.

The rules visible in the current setup screenshot do not match the store's commerce actions:

- `our approach`, the wordmark, and `explore the collection` are navigation controls, not product `ViewContent` actions.
- `Bag` opens the cart drawer; it does not initiate checkout.
- The actual checkout control is the `Demo checkout — no payment` button inside the cart drawer.
- An `AddToCart` event should be associated with the product dialog's enabled `Add to bag` action, after a size is selected.

If the Event Setup Tool is used temporarily, publish the rules with **Finish setup**, trigger the exact buttons afterward, and verify the resulting `ev` values in Network and Test Events. Remove those rules before enabling equivalent code-based tracking to prevent duplicate events.

## Later: browser and server event deduplication

If Conversions API is added later, generate one event ID for each action and use the same ID for both the browser Pixel event and its server event. Meta can then deduplicate the pair. This is unnecessary while events are browser-only.
