const productImageUrl = (productId, filename = 'base-v3.webp') => (
  new URL(`../../images/photorealistic/products/${productId}/${filename}`, import.meta.url).href
);

const sharedSizes = Object.freeze(['XS', 'S', 'M', 'L', 'XL']);

const fieldViews = Object.freeze({
  'traverse-short': 'Charcoal Traverse shorts floating with windblown dust against an empty neutral studio backdrop, CGI concept render',
  'contour-merino': 'Dry stone Contour merino long sleeve floating in warm sunlight against an empty neutral studio backdrop, CGI concept render',
  'altitude-fleece': 'Moss Altitude quarter-zip fleece floating among snowflakes against an empty neutral studio backdrop, CGI concept render',
  'strata-shell': 'Sulphur Strata hooded shell floating in rain against an empty neutral studio backdrop, CGI concept render',
});

const weatherViews = Object.freeze({
  'traverse-short': 'Close-up of an adult trekker wearing charcoal Traverse shorts while stepping over wet granite in heavy rain',
  'contour-merino': 'Face-free close-up of an adult adjusting the dry stone merino sleeve cuff while preparing inside an alpine hut',
  'altitude-fleece': 'Low-angle close-up of an adult trekker wearing the moss Altitude Grid Fleece in alpine snowfall',
  'strata-shell': 'Low-angle close-up of an adult trekker wearing the sulphur Strata shell hood in torrential rain',
});

const angleViews = Object.freeze({
  'traverse-short': 'Extreme worm’s-eye view of an adult trekker wearing charcoal Traverse shorts over opaque leggings in rain',
  'contour-merino': 'Face-free close-up of the dry stone merino worn beneath an open sulphur shell while adjusting layers under a sheltered hut porch',
  'altitude-fleece': 'Low upward long-lens close-up of moss quarter-zip fleece with snow-covered shoulders and wind-driven blizzard flakes, face cropped out',
  'strata-shell': 'Face-free low side-on long-lens close-up of the sulphur shell shoulder, bent elbow and chest zipper in heavy rain',
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
  imageAlt: fieldViews[product.id],
  featuredIndex,
  images: Object.freeze([
    Object.freeze({
      src: product.image,
      alt: fieldViews[product.id],
      label: 'Elements render',
      fit: 'cover',
    }),
    Object.freeze({
      src: productImageUrl(product.id, 'lifestyle-01.webp'),
      alt: weatherViews[product.id],
      label: product.id === 'contour-merino' ? 'Before the trail' : 'In the elements',
      fit: 'cover',
    }),
    Object.freeze({
      src: productImageUrl(product.id, 'lifestyle-02.webp'),
      alt: angleViews[product.id],
      label: product.id === 'contour-merino' ? 'Layered protection' : 'Off axis',
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

