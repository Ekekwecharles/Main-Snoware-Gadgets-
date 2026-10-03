"use client";

import Link from "next/link";
import { Lock, ShoppingBag, Trash2 } from "lucide-react";
import { useCart, cartCount, cartSubtotal } from "@/store/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { ProductImage } from "@/components/product/product-image";
import { QuantityStepper } from "./cart-drawer";
import { formatNaira } from "@/lib/utils";
import { maxOrderQty, onOrderLeadTime, stockText } from "@/lib/site";

export function CartPageView() {
  const hydrated = useHydrated();
  const { items, setQuantity, remove, notes, setNotes } = useCart();

  if (!hydrated) return <div className="container-x py-12"><div className="skeleton h-96 rounded-3xl" /></div>;

  if (!items.length)
    return (
      <div className="container-x flex flex-col items-center py-24 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-mist">
          <ShoppingBag className="h-10 w-10 text-muted" />
        </div>
        <h1 className="mt-6 text-[28px] font-extrabold">Your cart is empty</h1>
        <p className="mt-2 text-muted">Looks like you haven't added anything yet.</p>
        <Link href="/shop" className="mt-6 rounded-full bg-ink px-7 py-3 font-semibold text-white">Start shopping</Link>
      </div>
    );

  return (
    <div className="container-x py-10 lg:py-14">
      <h1 className="mb-8 text-[30px] font-extrabold sm:text-[36px]">
        Your cart <span className="text-muted">({cartCount(items)})</span>
      </h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-line rounded-3xl ring-1 ring-line">
          {items.map((item) => (
            <li key={item.variantId} className="flex gap-4 p-5 sm:gap-6">
              <Link href={`/p/${item.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-mist sm:h-32 sm:w-32">
                <ProductImage src={item.image} alt={item.name} categorySlug={item.categorySlug} sizes="128px" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div>
                    <Link href={`/p/${item.slug}`} className="text-[16px] font-semibold hover:underline">{item.name}</Link>
                    {item.variantLabel && <p className="mt-0.5 text-[13.5px] text-muted">{item.variantLabel}</p>}
                    {item.onOrder && <p className="mt-0.5 text-[13px] font-medium text-amber-700">Available on order · ships in {onOrderLeadTime}</p>}
                    {stockText(item.stock) && <p className="mt-0.5 text-[13px] font-medium text-brand-700">{stockText(item.stock)}</p>}
                    <p className="mt-1 text-[14px]">{formatNaira(item.price)}</p>
                  </div>
                  <p className="hidden text-[17px] font-bold sm:block">{formatNaira(item.price * item.quantity)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <QuantityStepper value={item.quantity} max={maxOrderQty(item.stock)} onChange={(q) => setQuantity(item.variantId, q)} />
                  <button onClick={() => remove(item.variantId)} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted hover:text-brand-600">
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-mist p-6">
            <label htmlFor="notes" className="text-[14px] font-semibold">Order notes</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Special instructions for your order" className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-[14px] outline-none focus:border-ink" />
            <div className="mt-5 flex justify-between text-[18px] font-bold">
              <span>Subtotal</span>
              <span>{formatNaira(cartSubtotal(items))}</span>
            </div>
            <p className="mt-1 text-[13px] text-muted">Delivery calculated at checkout · Free in-store pickup</p>
            <Link href="/checkout" className="mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 font-semibold text-white hover:bg-brand-700">
              <Lock className="h-4 w-4" /> Proceed to checkout
            </Link>
            <Link href="/shop" className="mt-3 block text-center text-[14px] font-medium hover:underline">Continue shopping</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
