/** Shapes returned by the website's API (see src/app/api on the website). */

export type ProductCard = {
  id: number;
  name: string;
  slug: string;
  badge: string | null;
  image: string | null;
  categorySlug: string;
  brand: string | null;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  onOrderOnly: boolean;
  /** Conditions that can currently be bought (new, uk-used, …). */
  conditions?: string[];
  defaultVariantId: number | null;
  defaultVariantLabel: string;
  defaultVariantOnOrder: boolean;
  defaultVariantStock: number | null;
};

export type Variant = {
  id: number;
  condition: string;
  storage: string | null;
  color: string | null;
  colorHex: string | null;
  price: number;
  compareAtPrice: number | null;
  availability: "in_stock" | "on_order" | "sold_out";
  stock: number | null;
};

export type ProductDetail = {
  id: number;
  name: string;
  slug: string;
  brand: string | null;
  badge: string | null;
  categorySlug: string;
  shortDescription: string | null;
  description: string | null;
  highlights: string[];
  specs: { label: string; value: string }[];
  image: string | null;
  images: string[];
  variants: Variant[];
};

export type Category = { id: number; name: string; slug: string; parentId: number | null; image: string | null; icon: string | null };

export type Banner = {
  id: number;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  priceText: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  image: string | null;
  theme: string;
};

export type HomeData = {
  announcement: string;
  banners: Banner[];
  sections: { title: string; category: string | null; used?: boolean; products: ProductCard[] }[];
};

export type Listing = { items: ProductCard[]; total: number; page: number; hasMore: boolean };

export type CartItem = {
  variantId: number;
  productId: number;
  slug: string;
  name: string;
  variantLabel: string;
  image: string | null;
  categorySlug: string;
  price: number;
  quantity: number;
  onOrder?: boolean;
  stock?: number | null;
};

export type CartSnapshot = { items: CartItem[]; notes: string };
export type CartUpdatedEvent = { origin: string | null; cart?: CartSnapshot };

export type User = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phone: string | null;
  role: "customer" | "admin";
  hasPassword: boolean;
};

export type DeliveryZone = { id: number; name: string; state: string; fee: number; eta: string };
export type StoreInfo = {
  zones: DeliveryZone[];
  store: { address: string; hours: string; email: string; whatsapp: string; whatsappLink: string };
  /** Missing on older servers — treat as Paystack only. */
  payments?: { paystack: boolean; bankTransfer: boolean; bankAccounts: { bank: string; accountNumber: string; accountName: string }[] };
  /** Missing on older servers — no update prompt. */
  app?: { latestVersion: string | null; minVersion: string | null; androidUrl: string };
};

export type Order = {
  reference: string;
  status: string;
  statusLabel: string;
  paymentStatus: string;
  paymentMethod?: "paystack" | "bank_transfer";
  /** Unpaid bank transfer: the customer still needs to pay / upload their screenshot at payUrl. */
  awaitingTransfer?: boolean;
  payUrl?: string;
  deliveryMethod: "delivery" | "pickup";
  fullName: string;
  email: string;
  phone: string;
  zoneName: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  items: { name: string; variantLabel: string | null; image: string | null; unitPrice: number; quantity: number; onOrder: boolean }[];
};

export type FormResult = { ok?: boolean; message?: string; fieldErrors?: Record<string, string> } | null;
