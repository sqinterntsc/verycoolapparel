# Photorealistic image retry pack

Status: prompts prepared; generation is pending. This folder intentionally contains no generated image files until an image service completes successfully.

The prompts define one cohesive campaign system: warm mineral gray seamless background (`#eeeae3`), 85 mm product lens, broad upper-left softbox, subtle fill, faint floor shadow, floating invisible-mannequin construction, and true fabric microtexture. Each product prompt uses the existing illustration as a design reference while asking the model to rebuild the garment as physically plausible technical tailoring.

## Prompt and intended output

| Prompt | Intended output |
| --- | --- |
| `prompts/contour-merino.txt` | `contour-merino.webp` |
| `prompts/altitude-fleece.txt` | `altitude-fleece.webp` |
| `prompts/traverse-short.txt` | `traverse-short.webp` |
| `prompts/strata-shell.txt` | `strata-shell.webp` |
| `prompts/alpine-landscape.txt` | `alpine-landscape.webp` |

Generate the four products at 1200 × 1200. Use the same model, seed family, lighting language, camera position, and color treatment across the set when the service supports those controls. The alpine image is a separate wide hero at 2000 × 1100.

Do not replace or edit the current live illustrations when retrying. Save successful outputs only in this directory and review them together before changing any site reference.

