import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  RefreshCcw,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductTabs } from "@/components/product/product-tabs";
import { ProductRail } from "@/components/home/product-rail";
import { WishlistButton } from "@/components/product/wishlist-button";
import { auth } from "@/auth";
import { db } from "@/db";
import { wishlist } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { absoluteUrl, formatNaira } from "@/lib/utils";
import { site } from "@/lib/site";

export async function generateMetadata(
  props: PageProps<"/p/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const from = Math.min(...p.variants.map((v) => v.price));
  return {
    title: `${p.name} — from ${formatNaira(from)}`,
    description: p.shortDescription ?? undefined,
    openGraph: {
      title: p.name,
      description: p.shortDescription ?? undefined,
      images: p.images[0] ? [p.images[0].url] : ["/og.png"],
    },
  };
}

export default async function ProductPage(props: PageProps<"/p/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, session] = await Promise.all([
    getRelatedProducts(product.id, product.categoryId),
    auth(),
  ]);
  const saved = session?.user
    ? !!(await db.query.wishlist.findFirst({
        where: and(
          eq(wishlist.userId, session.user.id),
          eq(wishlist.productId, product.id),
        ),
      }))
    : false;
  const cheapest = Math.min(...product.variants.map((v) => v.price));
  const anyInStock = product.variants.some((v) => v.availability === "in_stock");
  const anyOnOrder = product.variants.some((v) => v.availability === "on_order");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: product.images.map((i) => i.url),
    brand: product.brand
      ? { "@type": "Brand", name: product.brand.name }
      : undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "NGN",
      lowPrice: cheapest,
      highPrice: Math.max(...product.variants.map((v) => v.price)),
      offerCount: product.variants.length,
      availability: anyInStock
        ? "https://schema.org/InStock"
        : anyOnOrder
          ? "https://schema.org/BackOrder"
          : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/p/${product.slug}`),
      seller: { "@type": "Organization", name: site.name },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="container-x py-6 lg:py-10">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1 text-[13px]">
            <li>
              <Link href="/" className="text-sky hover:underline">
                Home
              </Link>
            </li>
            {product.trail.map((c, i) => (
              <li key={c.id} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-muted" />
                <Link
                  href={`/c/${product.trail
                    .slice(0, i + 1)
                    .map((t) => t.slug)
                    .join("/")}`}
                  className="text-sky hover:underline"
                >
                  {c.name}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted" />
              <span className="line-clamp-1 text-ink/70" aria-current="page">
                {product.name}
              </span>
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <ProductGallery
            images={product.images.map((i) => ({
              url: i.url,
              alt: i.alt ?? product.name,
            }))}
            name={product.name}
            categorySlug={product.category.slug}
          />

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-wrap items-center gap-2">
              {product.brand && (
                <span className="text-[13.5px] font-semibold text-muted">
                  {product.brand.name}
                </span>
              )}
              {product.badge && (
                <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-[11.5px] font-bold text-white">
                  {product.badge}
                </span>
              )}
            </div>
            <div className="mt-2 flex items-start justify-between gap-4">
              <h1 className="text-[30px] leading-[1.1] font-extrabold sm:text-[36px]">
                {product.name}
              </h1>
              <WishlistButton
                productId={product.id}
                slug={product.slug}
                initialSaved={saved}
              />
            </div>
            {product.shortDescription && (
              <p className="mt-3 text-[15.5px] leading-relaxed text-ink/75">
                {product.shortDescription}
              </p>
            )}

            <div className="mt-6 border-t border-line pt-6">
              <ProductPurchase
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  categorySlug: product.category.slug,
                  image: product.images[0]?.url ?? null,
                  variants: product.variants.map((v) => ({
                    id: v.id,
                    condition: v.condition,
                    storage: v.storage,
                    color: v.color,
                    colorHex: v.colorHex,
                    price: v.price,
                    compareAtPrice: v.compareAtPrice,
                    availability: v.availability,
                    stock: v.stock,
                  })),
                }}
              />
            </div>

            {cheapest >= 300_000 && (
              <div className="mt-5 rounded-2xl bg-sky/[0.07] p-4 text-[14px]">
                <p className="font-semibold text-sky">Pay small-small</p>
                <p className="mt-0.5 text-ink/75">
                  Spread the cost from about{" "}
                  <b>
                    {formatNaira(Math.ceil(cheapest / 6 / 1000) * 1000)}/month
                  </b>
                  .{" "}
                  <a
                    href={`${site.whatsappLink}?text=${encodeURIComponent(`Hi, I'd like to pay for the ${product.name} in instalments.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-sky hover:underline"
                  >
                    Ask about instalments
                  </a>
                </p>
              </div>
            )}

            <ul className="mt-5 grid grid-cols-2 gap-3 text-[13px]">
              {[
                [Truck, "Fast delivery", "Same-day in Port Harcourt"],
                [Store, "Free pickup", "Collect in-store"],
                [ShieldCheck, "Warranty", "On every device"],
                [RefreshCcw, "Easy returns", "7-day guarantee"],
              ].map(([Icon, title, sub]) => {
                const I = Icon as typeof Truck;
                return (
                  <li
                    key={title as string}
                    className="flex items-start gap-2.5 rounded-xl bg-mist p-3"
                  >
                    <I className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand-600" />
                    <span>
                      <span className="block font-semibold">
                        {title as string}
                      </span>
                      <span className="text-muted">{sub as string}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <ProductTabs
          highlights={product.highlights}
          description={product.description}
          specs={product.specs}
          hasUsed={product.variants.some((v) => v.condition !== "new")}
        />
      </div>

      <ProductRail title="You may" highlight="also like" products={related} />
    </>
  );
}
