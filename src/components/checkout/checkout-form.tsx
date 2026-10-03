"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2, Lock, MapPin, ShieldCheck, Store, Truck } from "lucide-react";
import { useCart, cartSubtotal } from "@/store/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { startCheckout } from "@/app/actions/checkout";
import { ProductImage } from "@/components/product/product-image";
import { cn, formatNaira } from "@/lib/utils";
import { onOrderLeadTime } from "@/lib/site";

type Zone = { id: number; name: string; state: string; fee: number; eta: string };

type Props = {
  zones: Zone[];
  storeAddress: string;
  storeHours: string;
  defaults: { email: string; fullName: string };
  signedIn: boolean;
};

export function CheckoutForm({ zones, storeAddress, storeHours, defaults, signedIn }: Props) {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const notes = useCart((s) => s.notes);
  const [method, setMethod] = useState<"delivery" | "pickup">("delivery");
  const [zoneId, setZoneId] = useState<number | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!hydrated) {
    return <div className="skeleton h-[480px] rounded-3xl" />;
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-card">
        <p className="text-[18px] font-semibold">Your cart is empty</p>
        <p className="mt-1 text-muted">Add something you love, then come back to check out.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 font-semibold text-white">Continue shopping</Link>
      </div>
    );
  }

  const zone = zones.find((z) => z.id === zoneId);
  const subtotal = cartSubtotal(items);
  const deliveryFee = method === "delivery" ? (zone?.fee ?? 0) : 0;
  const total = subtotal + deliveryFee;
  const zonesByState = zones.reduce<Record<string, Zone[]>>((acc, z) => ((acc[z.state] ??= []).push(z), acc), {});

  const submit = (formData: FormData) => {
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const res = await startCheckout({
        email: String(formData.get("email") ?? ""),
        fullName: String(formData.get("fullName") ?? ""),
        phone: String(formData.get("phone") ?? "").replace(/\s/g, ""),
        deliveryMethod: method,
        zoneId: method === "delivery" && zoneId ? Number(zoneId) : undefined,
        addressLine: String(formData.get("addressLine") ?? ""),
        city: String(formData.get("city") ?? ""),
        state: zone?.state,
        notes: String(formData.get("notes") ?? ""),
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      });
      if (res.ok) {
        window.location.href = res.url; // Paystack hosted checkout
      } else {
        setFormError(res.error);
        setErrors(res.fieldErrors ?? {});
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  return (
    <form action={submit} className="grid gap-6 lg:grid-cols-[1fr_420px] lg:gap-10" noValidate>
      <div className="space-y-6">
        {formError && (
          <div role="alert" className="rounded-2xl bg-brand-50 px-5 py-4 text-[14.5px] font-medium text-brand-800 ring-1 ring-brand-200">
            {formError}
          </div>
        )}

        <Section step={1} title="Contact details" aside={!signedIn && <Link href="/sign-in?callbackUrl=/checkout" className="text-[13.5px] font-semibold text-sky hover:underline">Sign in for faster checkout</Link>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="fullName" defaultValue={defaults.fullName} autoComplete="name" error={errors.fullName} />
            <Field label="Phone number" name="phone" type="tel" placeholder="0803 123 4567" autoComplete="tel" error={errors.phone} />
            <Field label="Email" name="email" type="email" defaultValue={defaults.email} autoComplete="email" error={errors.email} className="sm:col-span-2" hint="We'll send your receipt and order updates here." />
          </div>
        </Section>

        <Section step={2} title="Delivery method">
          <div className="grid gap-3 sm:grid-cols-2">
            <MethodCard active={method === "delivery"} onClick={() => setMethod("delivery")} icon={<Truck className="h-5 w-5" />} title="Deliver to me" sub="Fee depends on your location" />
            <MethodCard active={method === "pickup"} onClick={() => setMethod("pickup")} icon={<Store className="h-5 w-5" />} title="Pick up in store" sub="Free · Ready same day" />
          </div>

          {method === "delivery" ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="zone" className="mb-1.5 block text-[13.5px] font-semibold">Delivery location</label>
                <select
                  id="zone"
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : "")}
                  className={cn("h-12 w-full rounded-xl border bg-white px-4 text-[15px] outline-none focus:border-ink", errors.zoneId ? "border-brand-600" : "border-line")}
                >
                  <option value="">Select your area…</option>
                  {Object.entries(zonesByState).map(([state, list]) => (
                    <optgroup key={state} label={state}>
                      {list.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} — {formatNaira(z.fee)} ({z.eta})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {errors.zoneId && <p className="mt-1 text-[12.5px] text-brand-700">{errors.zoneId}</p>}
              </div>
              <Field label="Street address" name="addressLine" placeholder="House number, street, landmark" autoComplete="street-address" error={errors.addressLine} className="sm:col-span-2" />
              <Field label="City / Area" name="city" placeholder="e.g. Ikeja" autoComplete="address-level2" error={errors.city} />
              <div className="flex items-end">
                {zone && <p className="rounded-xl bg-mist px-4 py-3 text-[13.5px]"><b>{zone.eta}</b> · {formatNaira(zone.fee)}</p>}
              </div>
            </div>
          ) : (
            <div className="mt-5 flex gap-3 rounded-2xl bg-mist p-4 text-[14px]">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="font-semibold">{storeAddress}</p>
                <p className="text-muted">{storeHours}</p>
                <p className="mt-1 text-muted">We'll call or WhatsApp you when your order is ready. Bring your order reference.</p>
              </div>
            </div>
          )}
        </Section>

        <Section step={3} title="Order notes" optional>
          <textarea name="notes" defaultValue={notes} rows={3} placeholder="Anything we should know? e.g. preferred delivery time" className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none focus:border-ink" />
        </Section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl bg-white p-6 shadow-card">
          <h2 className="text-[18px] font-bold">Order summary</h2>
          <ul className="mt-4 max-h-80 divide-y divide-line overflow-y-auto">
            {items.map((i) => (
              <li key={i.variantId} className="flex gap-3 py-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-mist">
                  <ProductImage src={i.image} alt={i.name} categorySlug={i.categorySlug} sizes="64px" />
                  <span className="absolute -top-0 -right-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-ink px-1 text-[11px] font-bold text-white">{i.quantity}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[14px] font-medium">{i.name}</p>
                  {i.variantLabel && <p className="text-[12px] text-muted">{i.variantLabel}</p>}
                  {i.onOrder && <p className="text-[12px] font-medium text-amber-700">On order · ships in {onOrderLeadTime}</p>}
                </div>
                <p className="text-[14px] font-semibold">{formatNaira(i.price * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[14.5px]">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatNaira(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-muted">{method === "pickup" ? "In-store pickup" : "Delivery"}</dt>
              <dd>{method === "pickup" ? "Free" : zone ? formatNaira(zone.fee) : "Select location"}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-[18px] font-bold"><dt>Total</dt><dd>{formatNaira(total)}</dd></div>
          </dl>
          <button
            disabled={pending}
            className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3.5 text-[16px] font-semibold text-white transition hover:bg-brand-700 disabled:opacity-70"
          >
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4.5 w-4.5" />}
            {pending ? "Connecting to Paystack…" : `Pay ${formatNaira(total)}`}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] text-muted">
            <ShieldCheck className="h-4 w-4 text-success" /> Secured by Paystack · Card, transfer, USSD
          </p>
          <p className="mt-2 text-center text-[12px] text-muted">
            Prices are confirmed at payment. By paying you agree to our <Link href="/policies/terms" className="underline">terms</Link>.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Section({ step, title, optional, aside, children }: { step: number; title: string; optional?: boolean; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-card sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-3 text-[18px] font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[13px] text-white">{step}</span>
          {title} {optional && <span className="text-[13px] font-normal text-muted">(optional)</span>}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string; hint?: string };

function Field({ label, name, error, hint, className, ...rest }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-[13.5px] font-semibold">{label}</label>
      <input
        id={name}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn("h-12 w-full rounded-xl border bg-white px-4 text-[15px] outline-none transition focus:border-ink", error ? "border-brand-600" : "border-line")}
        {...rest}
      />
      {error ? <p id={`${name}-error`} className="mt-1 text-[12.5px] text-brand-700">{error}</p> : hint && <p className="mt-1 text-[12.5px] text-muted">{hint}</p>}
    </div>
  );
}

function MethodCard({ active, onClick, icon, title, sub }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn("flex items-center gap-4 rounded-2xl border p-4 text-left transition", active ? "border-ink bg-ink/[0.03] ring-1 ring-ink" : "border-line hover:border-ink/40")}
    >
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-full", active ? "bg-ink text-white" : "bg-mist")}>{icon}</span>
      <span>
        <span className="block text-[15px] font-semibold">{title}</span>
        <span className="text-[13px] text-muted">{sub}</span>
      </span>
    </button>
  );
}
