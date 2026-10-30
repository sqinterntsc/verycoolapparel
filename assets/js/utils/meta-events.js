const createEventID = (eventName, productId) => {
  const uniquePart = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${eventName}-${productId}-${uniquePart}`;
};

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
  if (typeof fbq !== 'function') return null;

  const eventID = createEventID('add-to-cart', productId);
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

  // Reuse this eventID if the same event is later sent through Conversions API.
  fbq('track', 'AddToCart', eventPayload, { eventID }); // 'track' indicates that it's a standard function

  const trackedEvent = {
    eventName: 'AddToCart',
    eventID,
    eventPayload,
  };

  onTracked(trackedEvent);
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

  const eventID = createEventID('remove-from-cart', productId);
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
