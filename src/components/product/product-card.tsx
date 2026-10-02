import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { conditionLabel } from "@/lib/site";
import { cn, discountPercent, formatNaira } from "@/lib/utils";
import { ProductImage } from "./product-image";
import { CardActions } from "./card-actions";

export function ProductCard({ product, priority, className }: { product: ProductCardData; priority?: boolean; className?: string }) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const usedOnly = product.conditions.every((c) => c !== "new");
  const hasUsed = product.conditions.some((c) => c !== "new");

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-line transition duration-300 hover:-translate-y-0.5 hover:shadow-card hover:ring-transparent",
        className,
      )}
    >
      <Link href={`/p/${product.slug}`} className="relative block aspect-square overflow-hidden bg-mist" aria-label={product.name}>
        <ProductImage
          src={product.image}
          alt={product.name}
          categorySlug={product.categorySlug}
          priority={priority}
          className={cn("transition duration-500 group-hover:scale-[1.04]", !product.inStock && "opacity-60 grayscale")}
        />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {off > 0 && product.inStock && <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-bold text-white">-{off}%</span>}
          {product.badge && product.inStock && <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">{product.badge}</span>}
          {!product.inStock && <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-muted ring-1 ring-line">Sold out</span>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex items-center gap-2 text-[11.5px] font-medium text-muted">
          {product.brand && <span>{product.brand}</span>}
          {hasUsed && (
            <>
              {product.brand && <span aria-hidden>·</span>}
              <span className="text-navy-700">{usedOnly ? conditionLabel(product.conditions[0]) : "New & Used"}</span>
            </>
          )}
        </div>
        <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-ink">
          <Link href={`/p/${product.slug}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
            {product.name}
          </Link>
        </h3>

        {product.colors.length > 1 && (
          <div className="mt-2 flex items-center gap-1" aria-label={`${product.colors.length} colours`}>
            {product.colors.slice(0, 5).map((c) => (
              <span key={c.name} title={c.name} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ background: c.hex ?? "#ccc" }} />
            ))}
            {product.colors.length > 5 && <span className="text-[11px] text-muted">+{product.colors.length - 5}</span>}
          </div>
        )}

        <div className="mt-auto pt-3">
          <p className="text-[12px] text-muted">{product.storages.length > 1 || product.conditions.length > 1 ? "From" : " "}</p>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className={cn("text-[17px] font-bold", off > 0 ? "text-brand-600" : "text-ink")}>{formatNaira(product.price)}</span>
            {off > 0 && <span className="text-[13px] text-muted line-through">{formatNaira(product.compareAtPrice!)}</span>}
          </div>
          <CardActions product={product} />
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] ring-1 ring-line">
      <div className="skeleton aspect-square" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-5 w-1/2 rounded" />
        <div className="skeleton mt-3 h-10 w-full rounded-full" />
      </div>
    </div>
  );
}
