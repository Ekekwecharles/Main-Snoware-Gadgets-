export const site = {
  name: "Snoware Gadgets",
  shortName: "Snoware",
  tagline: "Genuine gadgets. Honest prices. Delivered fast.",
  description:
    "Snoware Gadgets — buy new and UK/US used iPhones, Samsung, Google Pixel, MacBooks, laptops, PS5, Starlink, JBL speakers and accessories in Nigeria. Pay securely with Paystack.",
  rcNumber: "8611693",
  email: "snowaregadgets@gmail.com",
  whatsapp: "+2347048236937",
  whatsappLink: "https://wa.me/2347048236937",
  socials: {
    instagram: "https://instagram.com/snowaregadgets",
    tiktok: "https://www.tiktok.com/@snowaregadgets",
    handle: "@snowaregadgets",
  },
} as const;

export function whatsappMessageLink(message: string) {
  return `${site.whatsappLink}?text=${encodeURIComponent(message)}`;
}

export type MenuIcon =
  | "phone"
  | "phone-used"
  | "laptop"
  | "tablet"
  | "watch"
  | "earbuds"
  | "tag"
  | "charger"
  | "fold"
  | "desktop"
  | "printer"
  | "console"
  | "monitor"
  | "speaker"
  | "satellite"
  | "glasses"
  | "projector"
  | "drone"
  | "accessory"
  | "grid";

export type MenuItem = { label: string; href: string; icon: MenuIcon };
export type MenuGroup = {
  label: string;
  href: string;
  items: MenuItem[];
  promo: { text: string; href: string; tone: "red" | "navy" | "blue" };
};

/** Mega-menu structure. Slugs match the categories created by the seed script. */
export const megaMenu: MenuGroup[] = [
  {
    label: "Apple",
    href: "/c/apple",
    items: [
      { label: "iPhone", href: "/c/apple/iphone", icon: "phone" },
      { label: "MacBook", href: "/c/apple/macbook", icon: "laptop" },
      { label: "iPad", href: "/c/apple/ipad", icon: "tablet" },
      { label: "Apple Watch", href: "/c/apple/apple-watch", icon: "watch" },
      { label: "AirPods", href: "/c/apple/airpods", icon: "earbuds" },
      { label: "AirTag", href: "/c/apple/airtag", icon: "tag" },
      { label: "Chargers", href: "/c/apple/apple-chargers", icon: "charger" },
      { label: "Shop Apple", href: "/c/apple", icon: "grid" },
    ],
    promo: { text: "Swap your old iPhone and save on a new one", href: "/trade-in", tone: "blue" },
  },
  {
    label: "Samsung",
    href: "/c/samsung",
    items: [
      { label: "Galaxy Phones", href: "/c/samsung/samsung-phones", icon: "phone" },
      { label: "Galaxy Z Fold", href: "/c/samsung/samsung-phones?q=fold", icon: "fold" },
      { label: "Galaxy Tab", href: "/c/samsung/samsung-tablets", icon: "tablet" },
      { label: "Galaxy Watch", href: "/c/samsung/samsung-watches", icon: "watch" },
      { label: "Galaxy Buds", href: "/c/samsung/galaxy-buds", icon: "earbuds" },
      { label: "Chargers", href: "/c/samsung/samsung-chargers", icon: "charger" },
      { label: "Shop Samsung", href: "/c/samsung", icon: "grid" },
    ],
    promo: { text: "New & UK-used Galaxy devices — every unit tested", href: "/c/samsung", tone: "navy" },
  },
  {
    label: "Pixel",
    href: "/c/google-pixel",
    items: [
      { label: "Pixel 10 Series", href: "/c/google-pixel/pixel-phones?q=pixel 10", icon: "phone" },
      { label: "Pixel 9 Series", href: "/c/google-pixel/pixel-phones?q=pixel 9", icon: "phone" },
      { label: "Pixel Fold", href: "/c/google-pixel/pixel-phones?q=fold", icon: "fold" },
      { label: "Pixel Buds", href: "/c/google-pixel/pixel-buds", icon: "earbuds" },
      { label: "Pixel Watch", href: "/c/google-pixel/pixel-watch", icon: "watch" },
      { label: "Shop Pixel", href: "/c/google-pixel", icon: "grid" },
    ],
    promo: { text: "Pure Android, best-in-class camera — plus Pixel Buds & Pixel Watch", href: "/c/google-pixel", tone: "blue" },
  },
  {
    label: "Pre-owned",
    href: "/used",
    items: [
      { label: "Boxed (like new)", href: "/used?condition=boxed", icon: "phone-used" },
      { label: "Open Box", href: "/used?condition=open-box", icon: "phone-used" },
      { label: "UK Used", href: "/used?condition=uk-used", icon: "phone-used" },
      { label: "US Used", href: "/used?condition=us-used", icon: "phone-used" },
      { label: "Nigerian Used", href: "/used?condition=nigeria-used", icon: "phone-used" },
      { label: "All Pre-owned", href: "/used", icon: "grid" },
    ],
    promo: { text: "Boxed phones: brand-new condition, 100% battery, inspected & under warranty", href: "/used?condition=boxed", tone: "red" },
  },
  {
    label: "Computers",
    href: "/c/computers",
    items: [
      { label: "MacBooks", href: "/c/apple/macbook", icon: "laptop" },
      { label: "Office & Student", href: "/c/computers/office-student-laptops", icon: "laptop" },
      { label: "Gaming Laptops", href: "/c/computers/gaming-laptops", icon: "laptop" },
      { label: "Workstations", href: "/c/computers/workstation-laptops", icon: "laptop" },
      { label: "All-in-One PCs", href: "/c/computers/all-in-one-pcs", icon: "desktop" },
      { label: "Printers", href: "/c/computers/printers", icon: "printer" },
      { label: "Shop Computers", href: "/c/computers", icon: "grid" },
    ],
    promo: { text: "Students: ask about our back-to-school laptop deals", href: "/contact", tone: "navy" },
  },
  {
    label: "Gaming",
    href: "/c/gaming",
    items: [
      { label: "PlayStation 5", href: "/c/gaming/ps5", icon: "console" },
      { label: "PlayStation 4", href: "/c/gaming/ps4", icon: "console" },
      { label: "Gaming Monitors", href: "/c/gaming/gaming-monitors", icon: "monitor" },
      { label: "Shop Gaming", href: "/c/gaming", icon: "grid" },
    ],
    promo: { text: "Free pickup in-store — play tonight", href: "/store", tone: "red" },
  },
  {
    label: "Audio",
    href: "/c/audio",
    items: [
      { label: "JBL", href: "/c/audio/jbl", icon: "speaker" },
      { label: "Onyx", href: "/c/audio/onyx", icon: "speaker" },
      { label: "Zealot", href: "/c/audio/zealot", icon: "speaker" },
      { label: "AirPods", href: "/c/apple/airpods", icon: "earbuds" },
      { label: "Galaxy Buds", href: "/c/samsung/galaxy-buds", icon: "earbuds" },
      { label: "Pixel Buds", href: "/c/google-pixel/pixel-buds", icon: "earbuds" },
      { label: "Shop Audio", href: "/c/audio", icon: "grid" },
    ],
    promo: { text: "Bring the party — portable speakers from ₦25,000", href: "/c/audio", tone: "blue" },
  },
  {
    label: "Starlink",
    href: "/c/starlink",
    items: [
      { label: "Starlink Mini", href: "/c/starlink?q=mini", icon: "satellite" },
      { label: "Starlink Standard", href: "/c/starlink?q=standard", icon: "satellite" },
      { label: "Shop Starlink", href: "/c/starlink", icon: "grid" },
    ],
    promo: { text: "High-speed internet anywhere in Nigeria", href: "/c/starlink", tone: "navy" },
  },
  {
    label: "More",
    href: "/c/others",
    items: [
      { label: "Ray-Ban Meta", href: "/c/others/ray-ban", icon: "glasses" },
      { label: "Projectors", href: "/c/others/projectors", icon: "projector" },
      { label: "Drones", href: "/c/others/drones", icon: "drone" },
      { label: "Accessories", href: "/c/others/accessories", icon: "accessory" },
      { label: "Shop All", href: "/shop", icon: "grid" },
    ],
    promo: { text: "Get free pickup or fast delivery nationwide", href: "/shipping", tone: "red" },
  },
];

export const conditions = [
  { value: "new", label: "Brand New" },
  { value: "open-box", label: "Open Box" },
  { value: "boxed", label: "Boxed" },
  { value: "uk-used", label: "UK Used" },
  { value: "us-used", label: "US Used" },
  { value: "nigeria-used", label: "Nigerian Used" },
] as const;

export type ConditionValue = (typeof conditions)[number]["value"];

export const availabilityOptions = [
  { value: "in_stock", label: "In stock" },
  { value: "on_order", label: "Available on order" },
  { value: "sold_out", label: "Sold out" },
] as const;

export type AvailabilityValue = (typeof availabilityOptions)[number]["value"];
export const availabilityValues = availabilityOptions.map((a) => a.value) as [AvailabilityValue, ...AvailabilityValue[]];

/** How long "available on order" items take before dispatch — shown on product pages, cart and emails. */
export const onOrderLeadTime = "1–3 business days";

/** Upper bound for the quantity box when a variant has no quantity limit (keeps input sane, allows bulk orders). */
export const UNLIMITED_QTY = 9999;

/** At or below this many units left, customers see "Only N left — order soon". */
export const LOW_STOCK_THRESHOLD = 5;

/** Max quantity a customer can order for a variant: its stock if set, otherwise effectively unlimited. */
export function maxOrderQty(stock: number | null | undefined) {
  return stock == null ? UNLIMITED_QTY : Math.max(stock, 0);
}

/** Customer-facing stock text, or null when no quantity is tracked. */
export function stockText(stock: number | null | undefined) {
  if (stock == null) return null;
  if (stock <= 0) return null;
  return stock <= LOW_STOCK_THRESHOLD ? `Only ${stock} left — order soon` : `${stock} in stock`;
}

/** Tuple of condition values, in display order — for zod enums and sorting. Must match `conditionEnum` in the DB schema. */
export const conditionValues = conditions.map((c) => c.value) as [ConditionValue, ...ConditionValue[]];

export function conditionLabel(value: string) {
  return conditions.find((c) => c.value === value)?.label ?? value;
}

export const footerLinks = {
  company: [
    { label: "About Us", href: "/about" },
    { label: "Visit Our Store", href: "/store" },
    { label: "Trade-In", href: "/trade-in" },
    { label: "Warranty", href: "/warranty" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact Us", href: "/contact" },
  ],
  shop: [
    { label: "Shop Apple", href: "/c/apple" },
    { label: "Shop Samsung", href: "/c/samsung" },
    { label: "Shop Google Pixel", href: "/c/google-pixel" },
    { label: "Used Phones", href: "/used" },
    { label: "Laptops & Computers", href: "/c/computers" },
    { label: "Gaming", href: "/c/gaming" },
  ],
  policies: [
    { label: "Terms of Service", href: "/policies/terms" },
    { label: "Refund Policy", href: "/policies/refund" },
    { label: "Shipping Policy", href: "/shipping" },
    { label: "Privacy Policy", href: "/policies/privacy" },
  ],
};
