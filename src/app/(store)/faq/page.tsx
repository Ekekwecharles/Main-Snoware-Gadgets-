import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { ContentPage } from "@/components/content/content-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "FAQ" };

const faqs = [
  {
    q: "Are your products original?",
    a: "Yes. We only sell genuine devices. Every product is checked before it's listed, and used devices go through a full inspection.",
  },
  {
    q: "What's the difference between UK Used, US Used and Nigerian Used?",
    a: "UK and US Used devices are imported pre-owned units, usually in very good to excellent condition. Nigerian Used devices are locally pre-owned and cost less, but may show more signs of use. All of them are tested and come with warranty.",
  },
  {
    q: "How do I pay?",
    a: "Checkout is powered by Paystack. You can pay by debit card, bank transfer or USSD. Payments are processed securely, and we never see or store your card details.",
  },
  {
    q: "How much is delivery and how long does it take?",
    a: "The fee depends on your location and is shown at checkout before you pay. Port Harcourt orders are usually delivered the same day or the next day; other states take 1–5 business days. In-store pickup is free.",
  },
  {
    q: "Can I pay on delivery?",
    a: "To protect both sides, online orders are paid before dispatch. You can also visit our store, inspect the device and pay there.",
  },
  {
    q: "Do you offer instalment payments?",
    a: "We can arrange instalment plans for selected devices. Message us on WhatsApp with the product you want and we'll share the options.",
  },
  {
    q: "What if my device develops a fault?",
    a: "Contact us with your order reference. Faults covered by warranty are repaired, replaced or refunded. See our warranty page for details.",
  },
  {
    q: "Do you accept trade-ins?",
    a: "Yes — send photos and details of your device on WhatsApp for a quote, then swap it in-store towards your new purchase.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <ContentPage
      eyebrow="Help centre"
      title="Frequently asked questions"
      intro={`Can't find what you need? WhatsApp us on ${site.whatsapp}.`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl divide-y divide-line rounded-3xl ring-1 ring-line">
        {faqs.map((f) => (
          <details key={f.q} className="group p-5 sm:p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold">
              {f.q}
              <ChevronDown className="h-5 w-5 shrink-0 text-muted transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/75">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </ContentPage>
  );
}
