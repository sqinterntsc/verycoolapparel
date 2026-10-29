# Weather-set provenance — 29 October 2026

Four new on-body product detail images generated in parallel from the exact first-set studio photographs. Native image editing preserved garment identity; child image reviews corrected unnecessary added shell chest pockets and tightened merino/shorts crops. Parent visually inspected all four final outputs for garment identity, texture, weather, anatomy, crop and overall palette before integration.

## Final references
- Traverse Short: `/api/attachments/view?file_id=3637776666387404`; studio source `/api/attachments/view?file_id=1709080603911536`. Close raised-thigh crop in rain; matte charcoal woven cloth, waistband and near horizontal pocket zip remain recognizable. Far zipper obscured. Water particles are stylized, not proof of waterproof performance.
- Contour Merino LS: `/api/attachments/view?file_id=1479961104010353`; studio source `/api/attachments/view?file_id=2232075644320198`. Stone crew/raglan shoulder and naturally bent arm in snowfall. Elevated-oblique rather than unequivocally steep overhead. Wool texture and adhered snow remain distinct from shell rain effects.
- Altitude Grid Fleece: `/api/attachments/view?file_id=1648130943419675`; studio source `/api/attachments/view?file_id=1435843458698510`. Moss stand collar, shoulder, gloved hand and fleece fuzz in snow; tightly cropped. More frontal than requested long-lens profile, with a lighter whiteout background. Still coherent with snow merino's side lighting and slate palette.
- Strata 3L Shell: `/api/attachments/view?file_id=2313846306073368`; studio source `/api/attachments/view?file_id=1415829423530551`. Sulphur hood and chest in torrential rain; central zipper maintained after removing invented chest-pocket zips. Low upward framing, credible shadowed adult face, tactile water/cloth. Actual shoulder crop differs from brief but composition is strong.

All four are 1408 × 1760 pixels (4:5), WebP. No logos, text or watermarks. Adult on-body scenes; existing studio images retained.

## Integration
The current project uses `assets/images/photorealistic/products/<slug>/base.webp` for each product's main image. Added `lifestyle-01.webp` in the same directory rather than undoing the updated product-specific filing. Products expose a frozen two-image gallery array; existing product/card primary references and homepage hero remain untouched by this carousel change.

Manual product modal galleries include next/previous wraparound, selected thumbnails, a live view counter, descriptive image alt text, left/right keyboard navigation scoped to the gallery and horizontal pointer swipes without intercepting vertical scrolling. New product/reopened modal resets to Studio and clears size selection; navigation within a product retains its size. No autoplay. Single-image products retain a working fallback; image failures show a recoverable message.

## Validation scope
Dependency-free DOM-event regression tests exercise the gallery/controller code; asset decoding, ES module syntax, real data paths, archive integrity and static site references are checked separately. This environment could not launch Chrome on the laptop (macOS process sandbox refusal) and container Chromium download was unavailable. These checks do not claim actual interactive desktop/mobile browser or visual layout verification; perform those locally before publishing the storefront.

Creative concept images are not proof of real garment manufacture, merino composition, waterproof ratings, GORE-TEX licensing or tested weather performance.
