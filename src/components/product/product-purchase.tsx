"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/store/cart";
import {
  conditionLabel,
  conditionValues,
  LOW_STOCK_THRESHOLD,
  maxOrderQty,
  onOrderLeadTime,
  stockText,
  whatsappMessageLink,
  type AvailabilityValue,
} from "@/lib/site";
import { cn, discountPercent, formatNaira } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { QuantityStepper } from "@/components/cart/cart-drawer";

export type PurchaseVariant = {
  id: number;
  condition: string;
  storage: string | null;
  color: string | null;
  colorHex: string | null;
  price: number;
  compareAtPrice: number | null;
  availability: AvailabilityValue;
  /** Optional quantity available (null = unlimited). */
  stock: number | null;
};

const isBuyable = (v: PurchaseVariant) => v.availability !== "sold_out" && (v.stock == null || v.stock > 0);

/** Ranking used to pick sensible defaults: in stock first, then on order, sold out last. */
const availabilityRank = (v: PurchaseVariant) => (!isBuyable(v) ? 0 : v.availability === "in_stock" ? 2 : 1);

export type PurchaseProduct = {
  id: number;
  name: string;
  slug: string;
  categorySlug: string;
  image: string | null;
  variants: PurchaseVariant[];
};

type Dim = "condition" | "storage" | "color";
const DIMS: Dim[] = ["condition", "storage", "color"];

const conditionOrder: string[] = conditionValues;

function unique<T>(arr: T[]) {
  return [...new Set(arr)];
}

export function variantText(v: PurchaseVariant) {
  return [v.storage, v.color, v.condition !== "new" ? conditionLabel(v.condition) : null].filter(Boolean).join(" · ");
}

export function ProductPurchase({ product, compact = false }: { product: PurchaseProduct; compact?: boolean }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const { variants } = product;

  const initial = useMemo(
    () => [...variants].sort((a, b) => availabilityRank(b) - availabilityRank(a) || a.price - b.price)[0],
    [variants],
  );
  const [selected, setSelected] = useState<PurchaseVariant | undefined>(initial);
  const [qty, setQty] = useState(1);

  const options = {
    condition: unique(variants.map((v) => v.condition)).sort((a, b) => conditionOrder.indexOf(a) - conditionOrder.indexOf(b)),
    storage: unique(variants.map((v) => v.storage).filter((x): x is string => !!x)),
    color: unique(variants.map((v) => v.color).filter((x): x is string => !!x)),
  };

  /** Find the best variant for a new option value, keeping the other choices where possible. */
  const choose = (dim: Dim, value: string) => {
    const others = DIMS.filter((d) => d !== dim);
    const candidates = variants.filter((v) => v[dim] === value);
    const scored = candidates
      .map((v) => ({
        v,
        score: others.reduce((s, d) => s + (selected && v[d] === selected[d] ? 3 : 0), 0) + availabilityRank(v),
      }))
      .sort((a, b) => b.score - a.score || a.v.price - b.v.price);
    if (scored[0]) {
      setSelected(scored[0].v);
      setQty(1);
    }
  };

  const availability = (dim: Dim, value: string) => {
    const others = DIMS.filter((d) => d !== dim);
    const match = variants.find((v) => v[dim] === value && others.every((d) => !selected || v[d] === selected[d]));
    if (!match) return "other"; // exists only with different choices
    return isBuyable(match) ? "ok" : "soldout";
  };

  const priceFor = (dim: Dim, value: string) => {
    const others = DIMS.filter((d) => d !== dim);
    return variants.find((v) => v[dim] === value && others.every((d) => !selected || v[d] === selected[d]))?.price;
  };

  if (!selected) return <p className="text-muted">This product is currently unavailable.</p>;

  const inStock = isBuyable(selected); // purchasable (in stock or on order, with quantity left)
  const onOrder = inStock && selected.availability === "on_order";
  const maxQty = maxOrderQty(selected.stock);
  const qtyText = stockText(selected.stock);
  const off = discountPercent(selected.price, selected.compareAtPrice);

  const addToCart = (buyNow = false) => {
    add(
      {
        variantId: selected.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantLabel: variantText(selected),
        image: product.image,
        categorySlug: product.categorySlug,
        price: selected.price,
        onOrder,
        stock: selected.stock,
      },
      qty,
    );
    if (buyNow) {
      useCart.getState().close();
      router.push("/checkout");
    } else {
      toast.success("Added to cart", { description: `${product.name}${variantText(selected) ? ` — ${variantText(selected)}` : ""}` });
    }
  };

  const waText = `Hi Snoware Gadgets, I'm interested in the ${product.name}${variantText(selected) ? ` (${variantText(selected)})` : ""} listed at ${formatNaira(selected.price)}. Is it available?`;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={cn("font-display text-[28px] font-bold tracking-tight", off > 0 && "text-brand-600")}>{formatNaira(selected.price)}</span>
          {off > 0 && (
            <>
              <span className="text-[17px] text-muted line-through">{formatNaira(selected.compareAtPrice!)}</span>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[12px] font-bold text-brand-700">Save {formatNaira(selected.compareAtPrice! - selected.price)}</span>
            </>
          )}
        </div>
        <p className={cn("mt-1.5 flex items-center gap-1.5 text-[13.5px] font-medium", onOrder ? "text-amber-700" : inStock ? "text-success" : "text-brand-700")}>
          <span className={cn("h-2 w-2 rounded-full", onOrder ? "bg-amber-500" : inStock ? "bg-success" : "bg-brand-600")} />
          {onOrder ? `Available on order · ships in ${onOrderLeadTime}` : inStock ? "In stock, ready to ship" : "Sold out in this option"}
        </p>
        {inStock && qtyText && (
          <p className={cn("mt-1 text-[13px] font-semibold", (selected.stock ?? 0) <= LOW_STOCK_THRESHOLD ? "text-brand-700" : "text-muted")}>{qtyText}</p>
        )}
      </div>

      {options.condition.length > 1 && (
        <OptionGroup label="Condition" value={conditionLabel(selected.condition)}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {options.condition.map((c) => (
              <OptionButton key={c} active={selected.condition === c} state={availability("condition", c)} onClick={() => choose("condition", c)}>
                <span className="block text-[13.5px] font-semibold">{conditionLabel(c)}</span>
                {priceFor("condition", c) && <span className="block text-[11.5px] text-muted">{formatNaira(priceFor("condition", c)!)}</span>}
              </OptionButton>
            ))}
          </div>
        </OptionGroup>
      )}

      {options.storage.length > 0 && (options.storage.length > 1 || !compact) && (
        <OptionGroup label={options.storage.some((s) => /GB|TB/.test(s)) ? "Capacity" : "Size"} value={selected.storage ?? ""}>
          <div className="flex flex-wrap gap-2">
            {options.storage.map((s) => (
              <OptionButton key={s} active={selected.storage === s} state={availability("storage", s)} onClick={() => choose("storage", s)}>
                <span className="text-[13.5px] font-semibold">{s}</span>
              </OptionButton>
            ))}
          </div>
        </OptionGroup>
      )}

      {options.color.length > 0 && (
        <OptionGroup label="Colour" value={selected.color ?? ""}>
          <div className="flex flex-wrap gap-2.5">
            {options.color.map((c) => {
              const hex = variants.find((v) => v.color === c)?.colorHex ?? "#ccc";
              const state = availability("color", c);
              return (
                <button
                  key={c}
                  onClick={() => choose("color", c)}
                  title={c}
                  aria-label={c}
                  aria-pressed={selected.color === c}
                  className={cn(
                    "relative h-10 w-10 rounded-full ring-2 ring-offset-2 transition",
                    selected.color === c ? "ring-ink" : "ring-transparent hover:ring-line",
                    state !== "ok" && "opacity-40",
                  )}
                >
                  <span className="absolute inset-0 rounded-full ring-1 ring-black/10" style={{ background: hex }} />
                  {selected.color === c && <Check className="absolute inset-0 m-auto h-4 w-4 text-white mix-blend-difference" />}
                </button>
              );
            })}
          </div>
        </OptionGroup>
      )}

      <div className="space-y-3">
        <div className="flex gap-3">
          {inStock && <QuantityStepper value={qty} max={maxQty} onChange={(q) => setQty(Math.max(1, Math.min(q, maxQty)))} size="md" />}
          <button
            onClick={() => addToCart(false)}
            disabled={!inStock}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-white transition hover:bg-ink-soft disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
          >
            <ShoppingBag className="h-4.5 w-4.5" /> {inStock ? "Add to cart" : "Sold out"}
          </button>
        </div>
        {inStock && (
          <button
            onClick={() => addToCart(true)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-600 text-[15px] font-semibold text-white transition hover:bg-brand-700"
          >
            <Zap className="h-4.5 w-4.5" /> Buy now
          </button>
        )}
        <a
          href={whatsappMessageLink(waText)}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full text-[14.5px] font-semibold text-[#128C4B] ring-1 ring-[#25D366]/40 transition hover:bg-[#25D366]/10"
        >
          <WhatsAppIcon className="h-5 w-5" /> {inStock ? "Ask about this on WhatsApp" : "Notify me on WhatsApp"}
        </a>
      </div>
    </div>
  );
}

function OptionGroup({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-[13.5px]">
        <span className="font-semibold">{label}</span>
        {value && <span className="text-muted"> — {value}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

function OptionButton({ active, state, onClick, children }: { active: boolean; state: "ok" | "soldout" | "other"; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative rounded-xl border px-4 py-2.5 text-left transition",
        active ? "border-ink bg-ink/[0.03] ring-1 ring-ink" : "border-line hover:border-ink/50",
        state === "soldout" && !active && "text-muted line-through decoration-muted/50",
        state === "other" && !active && "border-dashed text-muted",
      )}
    >
      {children}
    </button>
  );
}
