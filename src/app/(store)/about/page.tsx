import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, HeartHandshake, ShieldCheck, Truck } from "lucide-react";
import { ContentPage } from "@/components/content/content-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description: `About ${site.name} — genuine gadgets at honest prices in Nigeria.`,
};

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="Our story"
      title="Gadgets you can trust, from people you can reach"
      intro={`${site.name} helps Nigerians get genuine phones, laptops and tech — new or carefully inspected pre-owned — without the stress, fake products or hidden charges.`}
    >
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="prose-snow max-w-none">
          <h2>Why we started</h2>
          <p>
            Buying a phone or laptop in Nigeria shouldn't feel like a gamble.
            Too many people have paid for a “UK used” device that turned out to
            be refurbished, or waited weeks for an order that never arrived. We
            built {site.name} to fix that: clear prices, honest descriptions and
            real people answering on WhatsApp.
          </p>
          <h2>What we sell</h2>
          <p>
            iPhones, Samsung Galaxy and Google Pixel phones (new, UK-used,
            US-used and Nigerian-used), MacBooks and Windows laptops for study,
            office and gaming, PlayStation consoles, Starlink kits, JBL and
            other speakers, smart watches, earbuds, drones, projectors and the
            accessories to go with them.
          </p>
          <p>
            We're a registered business — RC {site.rcNumber}. Follow us on
            Instagram and TikTok at <b>{site.socials.handle}</b> to see new
            arrivals and unboxings.
          </p>
        </div>
        <div className="relative aspect-[3/2] overflow-hidden rounded-[28px] bg-black">
          <Image
            src="/snoware-hero.png"
            alt="Snoware Gadgets"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: BadgeCheck,
            title: "Genuine only",
            text: "Every device is authentic — we never sell clones or fakes.",
          },
          {
            icon: ShieldCheck,
            title: "Tested & covered",
            text: "Used devices pass a multi-point inspection and carry warranty.",
          },
          {
            icon: Truck,
            title: "Fast delivery",
            text: "Same-day in Port Harcourt and nationwide delivery to every state.",
          },
          {
            icon: HeartHandshake,
            title: "After-sales care",
            text: "We're on WhatsApp long after you've paid.",
          },
        ].map((v) => (
          <div
            key={v.title}
            className="rounded-[var(--radius-card)] bg-mist p-6"
          >
            <v.icon className="h-7 w-7 text-brand-600" />
            <h3 className="mt-4 text-[17px] font-bold">{v.title}</h3>
            <p className="mt-1 text-[14px] text-ink/70">{v.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 flex flex-col items-center gap-4 rounded-[28px] bg-navy-900 px-6 py-12 text-center text-white">
        <h2 className="text-[28px] font-extrabold">Ready to upgrade?</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/shop"
            className="rounded-full bg-brand-600 px-6 py-3 font-semibold hover:bg-brand-700"
          >
            Shop now
          </Link>
          <Link
            href="/contact"
            className="rounded-full px-6 py-3 font-semibold ring-1 ring-white/60 hover:bg-white hover:text-navy-900"
          >
            Contact us
          </Link>
        </div>
      </div>
    </ContentPage>
  );
}
