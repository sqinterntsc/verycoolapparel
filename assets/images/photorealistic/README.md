# Photorealistic image retry pack

Status: five photorealistic AI-generated launch concept images are complete, reviewed, and linked from the storefront. Open `index.html` in this directory to review and download the individual images. The earlier service-authentication diagnosis is preserved below as historical context.

## Asset structure

Each product has its own directory so additional views can be added without mixing products:

```text
products/
  <product-slug>/
    base.webp          Primary storefront image
    alternate-01.webp  Suggested future alternate view
    detail-01.webp     Suggested future detail view
    lifestyle-01.webp  On-body rain/snow detail; second modal slide
editorial/
  alpine-landscape.webp
```

Keep `base.webp` as the primary catalog image. Number additional images with two digits so they sort predictably.

## Retry and diagnosis — October 29, 2026

- Retried an actual sulphur-shell photography request using `meta ape.image generate` with a new job purpose and this folder as the output location.
- The request failed with `WearablesAPIException: Failed to generate APE access token`, before reaching the image model. `meta ape.user describe` failed with the same message.
- The verbose trace places the failure in `WearablesAPEAuthUtils::genSessionKey`, called by `ApeKeyHelper::genResolveKey`.
- Inspection of the server implementation shows that this message is emitted after employee-identity resolution, when temporary service-key creation or its cache throws an exception. It catches the underlying exception and returns a generic message, so the CLI response does not identify the exact upstream reason.
- The deeper error-log query was denied access to a protected user-ID column. A read-only Accessmate diagnosis confirmed that restriction; it could not resolve it automatically. No permissions or account settings were changed.
- MetaGen's alternative route requires an explicit, approved API key that is unavailable in the current session.

Generation error reference: https://www.internalfb.com/logview/opes/18416554b7596f91062fa7f0663c03e3/sample/opes%3A18416554b7596f91062fa7f0663c03e3%3A8731745df85e4be12ebd6d2ec507711e%3A1793247120?optimistic=1

## Historical next available route (before this image-generation run)

Figma MCP offers `gpt-image-2.5-sunburst` for realistic image generation. Its user check reports `AUTHENTICATION_FAILED` / `not_linked`. The human must link their Figma account here:

https://www.internalfb.com/intern/figma/auth/mcp/

After linking, the workflow needs an eligible plan with available Figma AI credits and an accessible design file. Generate the product set with one shared model/style, download the resulting images here, and review realism and consistency before changing any storefront image reference.

The prompts define one cohesive campaign system: warm mineral gray seamless background (`#eeeae3`), 85 mm product lens, broad upper-left softbox, subtle fill, faint floor shadow, floating invisible-mannequin construction, and true fabric microtexture. Each product prompt uses the existing illustration as a design reference while asking the model to rebuild the garment as physically plausible technical tailoring.

## Prompt and intended output

| Prompt | Intended output |
| --- | --- |
| `prompts/contour-merino.txt` | `products/contour-merino/base.webp` |
| `prompts/altitude-fleece.txt` | `products/altitude-fleece/base.webp` |
| `prompts/traverse-short.txt` | `products/traverse-short/base.webp` |
| `prompts/strata-shell.txt` | `products/strata-shell/base.webp` |
| `prompts/alpine-landscape.txt` | `editorial/alpine-landscape.webp` |

Generate the four products at 1200 × 1200. Use the same model, seed family, lighting language, camera position, and color treatment across the set when the service supports those controls. The alpine image is a separate wide hero at 2000 × 1100.

Do not replace or edit the preserved illustrations in the parent image directory. Save successful product outputs in the matching product directory and review them together before changing any site reference.

