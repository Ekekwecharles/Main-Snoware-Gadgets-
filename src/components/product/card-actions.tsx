"use client";

import { useState } from "react";
import { Eye, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { ProductCardData } from "@/lib/catalog";
import { useCart } from "@/store/cart";
import { QuickView } from "./quick-view";

/** Add-to-cart + Quick View buttons. Multi-variant products open Quick View so the shopper picks options. */
export function CardActions({ product }: { product: ProductCardData }) {
  const add = useCart((s) => s.add);
  const [quickOpen, setQuickOpen] = useState(false);
  const needsChoice = product.storages.length > 1 || product.colors.length > 1 || product.conditions.length > 1;

  const onAdd = () => {
    if (needsChoice) return setQuickOpen(true);
    if (!product.defaultVariantId) return;
    add({
      variantId: product.defaultVariantId,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantLabel: product.defaultVariantLabel,
      image: product.image,
      categorySlug: product.categorySlug,
      price: product.price,
      onOrder: product.defaultVariantOnOrder,
      stock: product.defaultVariantStock,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="relative z-10 mt-3 flex gap-2">
      <button
        onClick={onAdd}
        disabled={!product.inStock}
        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-[13.5px] font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
      >
        {product.inStock ? (
          <>
            <ShoppingBag className="h-4 w-4" /> {needsChoice ? "Choose options" : "Add to cart"}
          </>
        ) : (
          "Sold out"
        )}
      </button>
      <button
        onClick={() => setQuickOpen(true)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-line transition hover:bg-mist hover:ring-ink"
        aria-label={`Quick view ${product.name}`}
        title="Quick view"
      >
        <Eye className="h-4 w-4" />
      </button>
      {quickOpen && <QuickView slug={product.slug} onClose={() => setQuickOpen(false)} />}
    </div>
  );
}
