import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, CheckCircle2, MapPin, Store } from "lucide-react";
import { getOrderByReference } from "@/lib/orders";
import { pickupSteps, statusLabels, statusSteps } from "@/lib/order-status";
import { getSettings } from "@/lib/catalog";
import { ProductImage } from "@/components/product/product-image";
import { ClearCartOnSuccess } from "@/components/checkout/clear-cart";
import { cn, formatNaira } from "@/lib/utils";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage(props: PageProps<"/order/[reference]">) {
  const [{ reference }, sp] = await Promise.all([props.params, props.searchParams]);
  const [order, settings] = await Promise.all([getOrderByReference(reference), getSettings()]);
  if (!order) notFound();

  const success = sp.success === "1" && order.paymentStatus === "paid";
  const steps = order.deliveryMethod === "pickup" ? pickupSteps : statusSteps;
  const currentIndex = steps.findIndex((s) => s.key === order.status);

  return (
    <div className="container-x max-w-4xl py-10 lg:py-14">
      {success && <ClearCartOnSuccess />}

      {success ? (
        <div className="mb-10 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
          <h1 className="mt-4 text-[30px] font-extrabold sm:text-[38px]">Thank you, {order.fullName.split(" ")[0]}!</h1>
          <p className="mt-2 text-muted">Your payment was successful. A confirmation has been sent to <b className="text-ink">{order.email}</b>.</p>
        </div>
      ) : (
        <h1 className="mb-8 text-[30px] font-extrabold">Order details</h1>
      )}

      <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[13px] text-muted">Order reference</p>
            <p className="font-mono text-[16px] font-semibold">{order.reference}</p>
          </div>
          <span className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-semibold", order.status === "cancelled" ? "bg-brand-50 text-brand-700" : order.paymentStatus === "paid" ? "bg-emerald-50 text-success" : "bg-amber-50 text-amber-700")}>
            {statusLabels[order.status]}
          </span>
        </div>

        {order.paymentStatus === "paid" && order.status !== "cancelled" && (
          <ol className="mt-8 grid grid-cols-4 gap-2">
            {steps.map((s, i) => {
              const done = i <= currentIndex;
              return (
                <li key={s.key} className="flex flex-col items-center text-center">
                  <div className="relative flex w-full items-center justify-center">
                    {i > 0 && <span className={cn("absolute right-1/2 h-0.5 w-full", i <= currentIndex ? "bg-success" : "bg-line")} />}
                    <span className={cn("relative z-10 flex h-8 w-8 items-center justify-center rounded-full", done ? "bg-success text-white" : "bg-line text-muted")}>
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                  </div>
                  <span className={cn("mt-2 text-[12px] sm:text-[13px]", done ? "font-semibold" : "text-muted")}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        )}

        <ul className="mt-8 divide-y divide-line border-t border-line">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 py-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-mist">
                <ProductImage src={i.image} alt={i.name} sizes="64px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{i.name}</p>
                <p className="text-[13px] text-muted">{[i.variantLabel, `Qty ${i.quantity}`].filter(Boolean).join(" · ")}</p>
              </div>
              <p className="font-semibold">{formatNaira(i.unitPrice * i.quantity)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-2 grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
          <div className="flex gap-3 text-[14px]">
            {order.deliveryMethod === "pickup" ? <Store className="h-5 w-5 shrink-0 text-brand-600" /> : <MapPin className="h-5 w-5 shrink-0 text-brand-600" />}
            <div>
              <p className="font-semibold">{order.deliveryMethod === "pickup" ? "In-store pickup" : `Delivery · ${order.zoneName}`}</p>
              <p className="text-muted">
                {order.deliveryMethod === "pickup" ? settings.store_address : [order.addressLine, order.city, order.state].filter(Boolean).join(", ")}
              </p>
              <p className="text-muted">{order.phone}</p>
            </div>
          </div>
          <dl className="space-y-1.5 text-[14.5px]">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatNaira(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">{order.deliveryMethod === "pickup" ? "Pickup" : "Delivery"}</dt><dd>{order.deliveryFee ? formatNaira(order.deliveryFee) : "Free"}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 text-[17px] font-bold"><dt>Total</dt><dd>{formatNaira(order.total)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="rounded-full bg-ink px-6 py-3 font-semibold text-white">Continue shopping</Link>
        <a href={`${site.whatsappLink}?text=${encodeURIComponent(`Hi, I have a question about order ${order.reference}`)}`} target="_blank" rel="noreferrer" className="rounded-full px-6 py-3 font-semibold ring-1 ring-ink">
          Questions? WhatsApp us
        </a>
      </div>
    </div>
  );
}
