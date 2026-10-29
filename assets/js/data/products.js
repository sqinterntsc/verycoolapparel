const productImageUrl = (productId, filename = 'base.webp') => (
  new URL(`../../images/photorealistic/products/${productId}/${filename}`, import.meta.url).href
);

const sharedSizes = Object.freeze(['XS', 'S', 'M', 'L', 'XL']);

const weatherViews = Object.freeze({
  'traverse-short': 'Close-up of an adult trekker wearing charcoal Traverse shorts while stepping over wet granite in heavy rain',
  'contour-merino': 'Oblique close-up of an adult trekker wearing the stone Contour Merino base layer in wind-driven snow',
  'altitude-fleece': 'Low-angle close-up of an adult trekker wearing the moss Altitude Grid Fleece in alpine snowfall',
  'strata-shell': 'Low-angle close-up of an adult trekker wearing the sulphur Strata shell hood in torrential rain',
});

export const products = Object.freeze([
  {
    id: 'traverse-short',
    name: 'Traverse Short',
    price: 98,
    category: 'bottoms',
    categoryLabel: 'Bottoms',
    color: 'Charcoal',
    image: productImageUrl('traverse-short'),
    imageAlt: 'Traverse Short in Charcoal',
    description: 'A relaxed trail short shaped for everyday movement and warm-weather miles.',
    sizes: sharedSizes,
    specs: [
      { label: 'Design', value: 'Pull-on short with an adjustable waist' },
      { label: 'Fit', value: 'Relaxed, above-knee cut' },
      { label: 'Color', value: 'Charcoal' },
    ],
  },
  {
    id: 'contour-merino',
    name: 'Contour Merino LS',
    price: 128,
    category: 'base-layers',
    categoryLabel: 'Base layers',
    color: 'Stone',
    image: productImageUrl('contour-merino'),
    imageAlt: 'Contour Merino LS base layer in Stone',
    description: 'A close-fitting merino crew long sleeve designed for easy warmth and daily wear.',
    sizes: sharedSizes,
    specs: [
      { label: 'Design', value: 'Merino crew long sleeve' },
      { label: 'Fit', value: 'Close, flexible silhouette' },
      { label: 'Color', value: 'Stone' },
    ],
  },
  {
    id: 'altitude-fleece',
    name: 'Altitude Grid Fleece',
    price: 188,
    category: 'mid-layers',
    categoryLabel: 'Mid layers',
    color: 'Moss',
    image: productImageUrl('altitude-fleece'),
    imageAlt: 'Altitude Grid Fleece mid layer in Moss',
    description: 'A softly structured quarter-zip grid fleece for cool starts and everyday layering.',
    sizes: sharedSizes,
    specs: [
      { label: 'Design', value: 'Quarter-zip grid fleece' },
      { label: 'Fit', value: 'Roomy enough for light layering' },
      { label: 'Color', value: 'Moss' },
    ],
  },
  {
    id: 'strata-shell',
    name: 'Strata 3L Shell',
    price: 348,
    category: 'shells',
    categoryLabel: 'Shells',
    color: 'Sulphur',
    image: productImageUrl('strata-shell'),
    imageAlt: 'Strata 3L Shell jacket in Sulphur',
    description: 'A hooded three-layer shell concept with a clean profile and room for shifting conditions.',
    sizes: sharedSizes,
    specs: [
      { label: 'Design', value: 'Hooded 3L shell with adjustable details' },
      { label: 'Fit', value: 'Regular fit for flexible layering' },
      { label: 'Color', value: 'Sulphur' },
    ],
  },
].map((product, featuredIndex) => Object.freeze({
  ...product,
  featuredIndex,
  images: Object.freeze([
    Object.freeze({
      src: product.image,
      alt: `${product.name} in ${product.color}, floating studio product photograph`,
      label: 'Studio',
      fit: 'contain',
    }),
    Object.freeze({
      src: productImageUrl(product.id, 'lifestyle-01.webp'),
      alt: weatherViews[product.id],
      label: 'In the elements',
      fit: 'cover',
    }),
  ]),
})));

export const productById = new Map(products.map((product) => [product.id, product]));
export const productCategories = Object.freeze([
  'all',
  'base-layers',
  'mid-layers',
  'shells',
  'bottoms',
]);

