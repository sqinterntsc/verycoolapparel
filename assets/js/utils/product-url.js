// Resolve from the module so links also work under a GitHub Pages repository path.
export function productUrl(productId) {
  return new URL(`../../../products/${encodeURIComponent(productId)}/`, import.meta.url).href;
}
