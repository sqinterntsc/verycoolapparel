// Keep this aligned with fbq('init', ...) in the HTML pages and product-page template.
const PIXEL_ID = '1111051611838188';

export function trackViewContent({ product }) {
  const fbq = globalThis.fbq;
  if (typeof fbq !== 'function') return null;
  const eventPayload = {
    content_ids: [product.id],
    content_name: product.name,
    content_category: product.categoryLabel,
    content_type: 'product',
    value: product.price,
    currency: 'USD',
  };
  fbq('track', 'ViewContent', eventPayload);
  return { eventName: 'ViewContent', eventPayload };
}

function createEventID(eventPrefix) {
  return `${eventPrefix}.${PIXEL_ID}.${crypto.randomUUID()}`;
}

// ----- ADD to cart ----- //
export const trackAddToCart = ({
  productId,
  productName,
  category,
  size,
  price,
  quantity = 1,
  currency = 'USD',
  // Optional callback used here to log the event after fbq is called.
  onTracked = () => {},
}) => {
  const fbq = globalThis.fbq;
  // Generate the shared event even when the Pixel library is unavailable.
  const eventID = createEventID('addcart');
  const eventPayload = {
    content_ids: [productId],
    content_name: productName,
    content_category: category,
    content_type: 'product',
    contents: [{
      id: productId,
      quantity,
      item_price: price,
    }],
    value: price * quantity,
    currency,
    product_size: size,
  };

  // The backend uses the same ID to deduplicate Pixel and Conversions API events.
  if (typeof fbq === 'function') {
    fbq('track', 'AddToCart', eventPayload, { eventID });
  }

  const trackedEvent = {
    eventName: 'AddToCart',
    eventID,
    eventPayload,
  };

  if (typeof fbq === 'function') onTracked(trackedEvent);
  return trackedEvent;
};

// ----- REMOVE from cart ----- //
export const trackRemoveFromCart = ({
  productId,
  productName,
  category,
  size,
  price,
  quantity = 1,
  currency = 'USD',
  // Optional callback used here to log the event after fbq is called.
  onTracked = () => {},
}) => {
  const fbq = globalThis.fbq;
  if (typeof fbq !== 'function') return null;

  const eventID = createEventID('removecart');
  const eventPayload = {
    content_ids: [productId],
    content_name: productName,
    content_category: category,
    content_type: 'product',
    contents: [{
      id: productId,
      quantity,
      item_price: price,
    }],
    value: price * quantity,
    currency,
    product_size: size,
  };

  fbq('trackCustom', 'RemoveFromCart', eventPayload, { eventID });

  const trackedEvent = {
    eventName: 'RemoveFromCart',
    eventID,
    eventPayload,
  };

  onTracked(trackedEvent);
  return trackedEvent;
};
