# Product artwork and replacement prompts

The four launch product assets are **original hand-authored SVG illustrations**, rendered to PNG with macOS `sips` and encoded to 1200 × 1200 WebP with Pillow 11.3.0, quality 90, method 6. Editable files are in `source/`. They contain no existing brand logos or third-party imagery.

Image generation was attempted through APE's `nano-banana` service, which failed to issue an access token. The alternative MetaGen service required an approved API key that was unavailable. No AI model generated the delivered product images.

## Shared art direction for future photography generation

Use the strongest available photographic image model and retain the same settings/reference image across all four products:

> Premium technical outdoor apparel studio product photograph for the original brand verycoolapparel. A single garment floating in a natural, dimensional ghost-mannequin pose; no visible mannequin, person, hanger, stand, or support. Slightly opened silhouette, front view, subtle organic folds, realistic cloth and precise technical construction. The garment fills approximately 75% of a square 1200 × 1200 frame. Warm mineral-gray seamless studio background, approximately #eeeae3. Broad diffused illumination from the upper left, restrained highlights, soft contact-free shadow below. Sleek premium outdoor styling. Photorealistic materials and construction. No text, watermark, existing brand logos, or claimed textile certifications.

Append one of these subjects to the shared prompt:

- **Contour Merino LS:** fitted long-sleeve merino crew-neck base layer in warm stone. Fine understated knit, clean neckline, articulated shoulder construction, subtle cuffs. Lightweight, soft, technical rather than bulky.
- **Altitude Grid Fleece:** a quarter-zip technical fleece mid layer in subdued dark moss. Fine visible grid texture, stand collar, articulated sleeves, clean elastic cuffs and hem, charcoal zip. Soft structured warmth with restrained technical detailing.
- **Traverse Short:** above-knee trekking shorts in charcoal. Adjustable waist, articulated technical paneling, subtle secure zipped pockets, clean straight silhouette. Matte lightweight stretch-woven cloth.
- **Strata 3L Shell:** a sleek hooded three-layer technical outdoor shell in sulphur yellow/chartreuse #d6e342. Charcoal central and pocket zippers, precise seam mapping, articulated sleeves, adjustable hood and cuffs, matte technical fabric. An original design with no existing brand marks or licensed membrane logos.

Replace the matching files in `assets/images/` when generated photography is available; product data already refers to these filenames.
