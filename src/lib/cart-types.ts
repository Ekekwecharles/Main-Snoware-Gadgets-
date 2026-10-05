/** Cart line shared by the website store, the cart API and the mobile app. */
export type CartItem = {
  variantId: number;
  productId: number;
  slug: string;
  name: string;
  variantLabel: string;
  image: string | null;
  categorySlug: string;
  /** Display price only — the server re-prices every item at checkout. */
  price: number;
  quantity: number;
  /** "Available on order" — shown so the shopper knows it ships after sourcing. */
  onOrder?: boolean;
  /** Optional quantity limit for this variant (null/undefined = unlimited). Re-checked at checkout. */
  stock?: number | null;
};

export type CartSnapshot = { items: CartItem[]; notes: string };

/** Pusher event sent on `private-cart-{userId}` whenever the cart changes on any device. */
export type CartUpdatedEvent = { origin: string | null; cart?: CartSnapshot };

/** Header a client sends so it can recognise (and ignore) the realtime echo of its own change. */
export const CART_ORIGIN_HEADER = "x-cart-origin";
