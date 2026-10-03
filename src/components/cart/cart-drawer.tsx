"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lock, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart, cartCount, cartSubtotal } from "@/store/cart";
import { ProductImage } from "@/components/product/product-image";
import { formatNaira } from "@/lib/utils";
import { maxOrderQty, onOrderLeadTime, stockText } from "@/lib/site";

export function CartDrawer() {
  const { items, isOpen, close, setQuantity, remove, notes, setNotes } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;
  const count = cartCount(items);
  const subtotal = cartSubtotal(items);

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal aria-label="Shopping cart">
      <div className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-[2px]" onClick={close} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in-right flex-col bg-white shadow-lift">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[17px] font-semibold">Your cart {count > 0 && <span className="text-muted">({count})</span>}</h2>
          <button onClick={close} className="rounded-full p-2 hover:bg-mist" aria-label="Close cart">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-mist">
              <ShoppingBag className="h-9 w-9 text-muted" />
            </div>
            <p className="text-[17px] font-semibold">Your cart is empty</p>
            <p className="text-[14px] text-muted">Find the latest phones, laptops and gadgets at honest prices.</p>
            <Link href="/shop" onClick={close} className="mt-2 rounded-full bg-ink px-6 py-3 text-[14px] font-semibold text-white hover:bg-ink-soft">
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4 py-5">
                  <Link href={`/p/${item.slug}`} onClick={close} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-mist">
                    <ProductImage src={item.image} alt={item.name} categorySlug={item.categorySlug} sizes="96px" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <Link href={`/p/${item.slug}`} onClick={close} className="line-clamp-2 text-[14.5px] font-medium hover:underline">
                        {item.name}
                      </Link>
                      <button onClick={() => remove(item.variantId)} className="h-fit rounded-full p-1 text-muted hover:bg-mist hover:text-brand-600" aria-label={`Remove ${item.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {item.variantLabel && <p className="mt-0.5 text-[12.5px] text-muted">{item.variantLabel}</p>}
                    {item.onOrder && <p className="mt-0.5 text-[12px] font-medium text-amber-700">On order · ships in {onOrderLeadTime}</p>}
                    {stockText(item.stock) && <p className="mt-0.5 text-[12px] font-medium text-brand-700">{stockText(item.stock)}</p>}
                    <div className="mt-auto flex items-end justify-between pt-3">
                      <QuantityStepper
                        value={item.quantity}
                        max={maxOrderQty(item.stock)}
                        onChange={(q) => setQuantity(item.variantId, q)}
                      />
                      <p className="text-[15px] font-semibold">{formatNaira(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line bg-mist/60 px-5 pt-4 pb-5">
              <label htmlFor="cart-notes" className="sr-only">Order notes</label>
              <textarea
                id="cart-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Order notes (optional)"
                rows={2}
                className="w-full resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[15px]">Subtotal</span>
                <span className="text-[18px] font-bold">{formatNaira(subtotal)}</span>
              </div>
              <p className="mt-1 text-[12.5px] text-muted">Delivery fee is calculated at checkout. Free in-store pickup.</p>
              <Link
                href="/checkout"
                onClick={close}
                className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 text-[15px] font-semibold text-white transition hover:bg-brand-700"
              >
                <Lock className="h-4 w-4" /> Checkout securely
              </Link>
              <Link href="/cart" onClick={close} className="mt-2 block text-center text-[13.5px] font-medium text-ink underline-offset-2 hover:underline">
                View full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export function QuantityStepper({ value, max, onChange, size = "sm" }: { value: number; max: number; onChange: (v: number) => void; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-9" : "h-11";
  return (
    <div className={`inline-flex ${h} items-center overflow-hidden rounded-full border border-line bg-white`}>
      <button onClick={() => onChange(value - 1)} className="flex h-full w-9 items-center justify-center hover:bg-mist" aria-label="Decrease quantity">
        <Minus className="h-3.5 w-3.5" />
      </button>
      {/* Keyed on value so the draft resets whenever the quantity changes elsewhere (e.g. +/- buttons). */}
      <QtyInput key={value} value={value} max={max} onCommit={onChange} />
      <button
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className="flex h-full w-9 items-center justify-center hover:bg-mist disabled:opacity-30"
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Typeable quantity (for bulk orders). Commits on blur/Enter; an empty or 0 entry reverts instead of removing the item. */
function QtyInput({ value, max, onCommit }: { value: number; max: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  const commit = () => {
    const n = parseInt(draft, 10);
    if (!n || n < 1) return setDraft(String(value));
    const clamped = Math.min(n, max);
    if (clamped !== value) onCommit(clamped);
    else setDraft(String(value));
  };
  return (
    <input
      value={draft}
      inputMode="numeric"
      aria-label="Quantity"
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 4))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
      }}
      className="w-11 bg-transparent text-center text-[14px] font-medium tabular-nums outline-none"
    />
  );
}
