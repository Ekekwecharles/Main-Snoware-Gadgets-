import type { ProductDetail } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/utils";
import { conditionLabel, site } from "@/lib/site";

/** Renders schema.org structured data that Google reads for rich results (prices, stock, store info). */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const STORE_ID = absoluteUrl("/#store");

/** The physical shop — lets Google show Snoware for local searches like "iPhone shop Port Harcourt". */
export function storeJsonLd(storeAddress: string) {
  // The admin address is free text like "Artillery Portharcourt — message us on WhatsApp for directions".
  const street = storeAddress.split(/\s+[—–-]\s+/)[0]?.trim();
  const hasStreet = street && !/coming soon/i.test(street);
  return {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    "@id": STORE_ID,
    name: site.name,
    description: site.description,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/og.png"),
    image: absoluteUrl("/og.png"),
    telephone: site.whatsapp,
    email: site.email,
    priceRange: "₦₦",
    currenciesAccepted: "NGN",
    paymentAccepted: "Card, Bank Transfer",
    address: {
      "@type": "PostalAddress",
      ...(hasStreet ? { streetAddress: street } : {}),
      addressLocality: "Port Harcourt",
      addressRegion: "Rivers",
      addressCountry: "NG",
    },
    areaServed: { "@type": "Country", name: "Nigeria" },
    sameAs: [site.socials.instagram, site.socials.tiktok, site.whatsappLink],
  };
}

const availabilityUrl = {
  in_stock: "https://schema.org/InStock",
  on_order: "https://schema.org/BackOrder",
  sold_out: "https://schema.org/OutOfStock",
} as const;

// Matches the "7-day guarantee" promised on product pages.
const returnPolicy = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "NG",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 7,
  merchantReturnLink: absoluteUrl("/policies/refund"),
};

/** Product + breadcrumb data: one offer per variant so Google knows each price and whether it's new or used. */
export function productJsonLd(product: ProductDetail) {
  const url = absoluteUrl(`/p/${product.slug}`);
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${url}#product`,
      name: product.name,
      url,
      description: product.shortDescription ?? product.description ?? undefined,
      image: product.images.map((i) => i.url),
      category: product.trail.map((c) => c.name).join(" > ") || undefined,
      brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
      offers: product.variants.map((v) => ({
        "@type": "Offer",
        sku: v.sku ?? String(v.id),
        name: [product.name, v.storage, v.color, conditionLabel(v.condition)].filter(Boolean).join(" · "),
        url,
        price: v.price,
        priceCurrency: "NGN",
        availability: availabilityUrl[v.availability],
        // Boxed, open box and UK/US/Nigerian used are all pre-owned in Google's terms.
        itemCondition: v.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
        seller: { "@id": STORE_ID },
        hasMerchantReturnPolicy: returnPolicy,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { name: "Home", url: absoluteUrl("/") },
        ...product.trail.map((c, i) => ({
          name: c.name,
          url: absoluteUrl(`/c/${product.trail.slice(0, i + 1).map((t) => t.slug).join("/")}`),
        })),
        { name: product.name, url },
      ].map((crumb, i) => ({ "@type": "ListItem", position: i + 1, name: crumb.name, item: crumb.url })),
    },
  ];
}
