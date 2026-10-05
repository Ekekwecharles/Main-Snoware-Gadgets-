"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import type { ProductSpec } from "@/db/schema";
import { cn } from "@/lib/utils";

type Props = {
  highlights: string[];
  description: string | null;
  specs: ProductSpec[];
  hasUsed: boolean;
};

export function ProductTabs({
  highlights,
  description,
  specs,
  hasUsed,
}: Props) {
  const tabs = [
    { id: "overview", label: "Overview" },
    ...(specs.length ? [{ id: "specs", label: "Specifications" }] : []),
    ...(hasUsed ? [{ id: "grading", label: "Condition guide" }] : []),
    { id: "delivery", label: "Delivery & returns" },
  ];
  const [active, setActive] = useState("overview");

  return (
    <section className="mt-16">
      <div
        role="tablist"
        aria-label="Product information"
        className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setActive(t.id)}
            className={cn(
              "relative shrink-0 px-4 py-3.5 text-[15px] font-semibold transition-colors",
              active === t.id
                ? "text-ink after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-brand-600"
                : "text-muted hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        className="max-w-3xl py-8"
      >
        {active === "overview" && (
          <div className="space-y-6">
            {highlights.length > 0 && (
              <ul className="grid gap-3 sm:grid-cols-2">
                {highlights.map((h) => (
                  <li
                    key={h}
                    className="flex gap-3 rounded-2xl bg-mist p-4 text-[14.5px]"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                      <Check className="h-3 w-3" />
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            )}
            {description && (
              <div className="prose-snow whitespace-pre-line">
                {description}
              </div>
            )}
          </div>
        )}

        {active === "specs" && (
          <dl className="divide-y divide-line overflow-hidden rounded-2xl ring-1 ring-line">
            {specs.map((s) => (
              <div
                key={s.label}
                className="grid grid-cols-[minmax(120px,35%)_1fr] gap-4 px-5 py-3.5 text-[14.5px] odd:bg-mist/60"
              >
                <dt className="font-semibold">{s.label}</dt>
                <dd className="text-ink/80">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {active === "grading" && (
          <div className="prose-snow">
            <p>
              Every pre-owned device we sell passes a multi-point inspection
              before it goes on sale. We test:
            </p>
            <ul>
              <li>Battery health (we state the percentage on request)</li>
              <li>Face ID / Touch ID / fingerprint sensor</li>
              <li>All cameras, microphones and speakers</li>
              <li>Screen, touch response and True Tone</li>
              <li>Network, Wi-Fi, Bluetooth and charging port</li>
              <li>iCloud / Google account lock — always removed</li>
            </ul>
            <h3>What the conditions mean</h3>
            <ul>
              <li>
                <b>Boxed</b> — pre-owned and repackaged, in brand-new condition:
                the body looks like new, battery health is 100%, and everything
                works with all features intact.
              </li>
              <li>
                <b>Open Box</b> — the box has been opened and the device is
                unused or only lightly used. The product description says which.
              </li>
              <li>
                <b>UK Used</b> and <b>US Used</b> — imported pre-owned units,
                typically in very good to excellent cosmetic condition.
              </li>
              <li>
                <b>Nigerian Used</b> — locally pre-owned at our lowest prices;
                minor signs of use are possible.
              </li>
            </ul>
            <p>All pre-owned devices include our pre-owned device warranty.</p>
          </div>
        )}

        {active === "delivery" && (
          <div className="prose-snow">
            <h3>Delivery</h3>
            <p>
              Same-day or next-day delivery within Port Harcourt, and 1–3
              business days to other states. The exact fee for your location is
              shown at checkout.
            </p>
            <h3>Free in-store pickup</h3>
            <p>
              Choose “Pick up in store” at checkout and collect your order once
              we message you that it’s ready.
            </p>
            <h3>Returns</h3>
            <p>
              If your device has a fault that isn't due to misuse, report it
              within 7 days of delivery for a repair, replacement or refund. See
              our <Link href="/policies/refund">refund policy</Link> for
              details.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
