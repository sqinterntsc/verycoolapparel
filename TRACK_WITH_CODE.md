# Meta Pixel tracking reference

Pixel ID: `1111051611838188`

## Current custom events

| Link | Event | Locations |
| --- | --- | --- |
| The field system | `CheckCurrentProducts` | Desktop and mobile navigation on both pages |
| Our approach | `ViewBrandStory` | Desktop, mobile, and footer navigation on both pages |
| Reduce/remove product | `RemoveFromCart` | Bag quantity and remove controls for all products |

```html
<a href="#field-system"
  onclick="fbq('trackCustom', 'CheckCurrentProducts', { link_location: 'desktop_navigation' });">
  The field system
</a>
```

```js
fbq('trackCustom', 'ViewBrandStory', {
  link_location: 'desktop_navigation'
});
```

`link_location` is a project-defined parameter, not a required Meta field. It distinguishes `desktop_navigation`, `mobile_navigation`, and `footer_navigation`.

## Standard events

Currently active:

| Event | Scope |
| --- | --- |
| `PageView` | Both pages |
| `AddToCart` | Add-to-bag and quantity increase controls for all products |
| `InitiateCheckout` | Demo checkout button |

```js
fbq('track', 'PageView');
```

```js
addProductToCart({
  product: addedProduct,
  size: addedSize,
  quantity: selectedQuantity,
});
```

All product cart changes go through `assets/js/features/cart-actions.js`. The quick-shop modal uses
`addProductToCart`; the bag quantity controls use `setProductQuantity`; and the bag remove control uses
`removeProductFromCart`. These actions update cart state and call the existing trackers with the actual
quantity changed, so capped or no-op changes are never over-reported.

Example commerce event for future implementation:

```js
fbq('track', 'ViewContent', {
  content_ids: [product.id],
  content_name: product.name,
  content_type: 'product',
  value: product.price,
  currency: 'USD'
});
```

## Optional callback pattern

The product trackers accept an optional callback inside their options object:

```js
const trackEvent = ({ eventPayload, onTracked = () => {} }) => {
  fbq('track', 'ExampleEvent', eventPayload);

  const trackedEvent = {
    eventName: 'ExampleEvent',
    eventPayload
  };

  onTracked(trackedEvent);
  return trackedEvent;
};
```

`onTracked = () => {}` is a default no-op function, so the tracker also works when no callback is supplied. Callers can later provide logging, debugging, UI, or server-forwarding behavior without changing the event payload or adding positional arguments.

```js
trackEvent({
  eventPayload,
  onTracked: ({ eventName, eventPayload }) => {
    console.log(`${eventName} queued`, eventPayload);
  }
});
```

The callback runs after `fbq` is invoked. It confirms that the browser queued the call, not that Meta's server received it.

## Implementation preference

Keep small, static navigation calls inline. Product events may use a shared function when their payload and event-ID behavior will be reused across products.

## Verify

Use Events Manager **Test events**, perform one action, and confirm the expected `ev` value and parameters. Do not configure the same event through both code and the Event Setup Tool.
