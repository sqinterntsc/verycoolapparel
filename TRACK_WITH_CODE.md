# Meta Pixel tracking reference

Pixel ID: `1111051611838188`

## Current custom events

| Link | Event | Locations |
| --- | --- | --- |
| The field system | `CheckCurrentProducts` | Desktop and mobile navigation on both pages |
| Our approach | `ViewBrandStory` | Desktop, mobile, and footer navigation on both pages |

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

Page views are currently active:

```js
fbq('track', 'PageView');
```

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

## Implementation preference

Keep a small number of calls inline so they remain recognizable against Meta's documentation. Reconsider a shared helper only when several application-driven events need the same validation, parameters, or dynamic binding.

## Verify

Use Events Manager **Test events**, perform one action, and confirm the expected `ev` value and parameters. Do not configure the same event through both code and the Event Setup Tool.
