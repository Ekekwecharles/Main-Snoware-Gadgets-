import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Headset,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import {
  getBanners,
  getFeaturedProducts,
  getProductsByCategorySlug,
  getUsedHighlights,
} from "@/lib/catalog";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { ProductRail } from "@/components/home/product-rail";
import { DeviceIcon } from "@/components/brand/device-icon";
import { Snowflake } from "@/components/brand/logo";
import {
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/brand/social-icons";
import { site, type MenuIcon } from "@/lib/site";
import { cn } from "@/lib/utils";

export const revalidate = 300;

const categoryTiles: {
  label: string;
  href: string;
  icon: MenuIcon;
  tone: string;
  blurb: string;
}[] = [
  {
    label: "iPhone",
    href: "/c/apple/iphone",
    icon: "phone",
    tone: "from-[#f6f1e7] to-[#efe4cf]",
    blurb: "New & UK/US used",
  },
  {
    label: "Samsung Galaxy",
    href: "/c/samsung",
    icon: "fold",
    tone: "from-[#e8eefb] to-[#d5e1f8]",
    blurb: "S26 Ultra, Z Fold 7",
  },
  {
    label: "Google Pixel",
    href: "/c/google-pixel",
    icon: "phone",
    tone: "from-[#e9f6ef] to-[#d3eedf]",
    blurb: "Pixel 10 Pro XL",
  },
  {
    label: "MacBook & Laptops",
    href: "/c/computers",
    icon: "laptop",
    tone: "from-[#eef0f3] to-[#dfe3e9]",
    blurb: "Study, work, gaming",
  },
  {
    label: "Gaming",
    href: "/c/gaming",
    icon: "console",
    tone: "from-[#16181d] to-[#2a2d35] text-white",
    blurb: "PS5, PS4, monitors",
  },
  {
    label: "Starlink",
    href: "/c/starlink",
    icon: "satellite",
    tone: "from-[#0b1f4d] to-[#14306b] text-white",
    blurb: "Mini & Standard",
  },
  {
    label: "Audio",
    href: "/c/audio",
    icon: "speaker",
    tone: "from-[#fdebe9] to-[#fbd5d1]",
    blurb: "JBL, Onyx, Zealot",
  },
  {
    label: "Watches & Buds",
    href: "/c/apple/apple-watch",
    icon: "watch",
    tone: "from-[#f3effa] to-[#e5dcf5]",
    blurb: "Apple, Galaxy & Pixel",
  },
];

const promoStyles: Record<string, string> = {
  light: "bg-white ring-2 ring-sky text-ink",
  blue: "bg-sky text-white",
  red: "bg-gradient-to-br from-brand-600 to-brand-800 text-white",
  navy: "bg-gradient-to-br from-navy-900 to-navy-700 text-white",
  dark: "bg-ink text-white",
};

const promoIcons: MenuIcon[] = ["accessory", "tag", "phone-used", "laptop"];

export default async function HomePage() {
  const [hero, promos, featured, used, apple, samsung, gaming] =
    await Promise.all([
      getBanners("hero"),
      getBanners("promo"),
      getFeaturedProducts(10),
      getUsedHighlights(10),
      getProductsByCategorySlug("apple", 10),
      getProductsByCategorySlug("samsung", 10),
      getProductsByCategorySlug("gaming", 10),
    ]);

  return (
    <>
      <HeroCarousel banners={hero} />

      {/* Trust bar */}
      <section className="border-b border-line bg-white">
        <ul className="container-x no-scrollbar flex gap-8 overflow-x-auto py-4 text-[13.5px] font-medium text-ink/80 lg:justify-between">
          {[
            [BadgeCheck, "100% genuine devices"],
            [ShieldCheck, "Warranty on every device"],
            [Truck, "Fast nationwide delivery"],
            [Store, "Free in-store pickup"],
            [CreditCard, "Secure Paystack checkout"],
          ].map(([Icon, text]) => {
            const I = Icon as typeof BadgeCheck;
            return (
              <li
                key={text as string}
                className="flex shrink-0 items-center gap-2"
              >
                <I className="h-4.5 w-4.5 text-brand-600" /> {text as string}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Shop by category */}
      <section className="container-x mt-16">
        <h2 className="mb-6 text-[26px] font-bold sm:text-[30px]">
          Shop by category
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {categoryTiles.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className={cn(
                "group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br p-4 transition hover:shadow-lift sm:p-5",
                c.tone,
              )}
            >
              <div>
                <h3 className="text-[16px] font-bold sm:text-[18px]">
                  {c.label}
                </h3>
                <p className="mt-0.5 text-[12.5px] opacity-70 sm:text-[13.5px]">
                  {c.blurb}
                </p>
              </div>
              <DeviceIcon
                icon={c.icon}
                className="absolute -right-3 -bottom-3 h-[62%] w-[62%] opacity-80 transition duration-500 group-hover:-translate-y-1 group-hover:scale-105"
                strokeWidth={1}
              />
              <span className="relative inline-flex items-center gap-1 text-[13px] font-semibold">
                Shop{" "}
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Promo grid */}
      {promos.length > 0 && (
        <section className="container-x mt-16 grid gap-4 md:grid-cols-2">
          {promos.map((p, i) => (
            <Link
              key={p.id}
              href={p.ctaHref ?? "/shop"}
              className={cn(
                "group relative flex min-h-[260px] flex-col overflow-hidden rounded-[var(--radius-card)] p-7 transition hover:shadow-lift sm:p-9",
                promoStyles[p.theme] ?? promoStyles.light,
              )}
            >
              <div className="relative z-10 max-w-[70%]">
                {p.eyebrow && (
                  <span
                    className={cn(
                      "inline-block rounded-full px-3 py-1 text-[11.5px] font-bold tracking-wider uppercase",
                      p.theme === "light" ? "bg-sky text-white" : "bg-white/15",
                    )}
                  >
                    {p.eyebrow}
                  </span>
                )}
                <h3 className="mt-4 text-[26px] leading-tight font-extrabold sm:text-[30px]">
                  {p.title}
                </h3>
                {p.subtitle && (
                  <p className="mt-2 text-[14.5px] leading-relaxed opacity-80">
                    {p.subtitle}
                  </p>
                )}
              </div>
              {p.ctaLabel && (
                <span
                  className={cn(
                    "relative z-10 mt-auto inline-flex w-fit items-center gap-1.5 rounded-full px-5 py-2.5 pt-2.5 text-[14px] font-semibold transition",
                    p.theme === "light"
                      ? "bg-sky text-white"
                      : "bg-white/15 ring-1 ring-white/40 group-hover:bg-white group-hover:text-ink",
                  )}
                  style={{ marginTop: "1.5rem" }}
                >
                  {p.ctaLabel} <ArrowRight className="h-4 w-4" />
                </span>
              )}
              <DeviceIcon
                icon={promoIcons[i % promoIcons.length]}
                className={cn(
                  "absolute -right-6 -bottom-6 h-52 w-52 transition duration-500 group-hover:-rotate-6",
                  p.theme === "light" ? "text-sky/20" : "text-white/20",
                )}
                strokeWidth={1}
              />
            </Link>
          ))}
        </section>
      )}

      <ProductRail
        title="Trending"
        highlight="right now"
        href="/shop"
        products={featured}
      />

      {/* Used devices feature */}
      <section className="container-x mt-20">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 px-6 py-12 text-white sm:px-12 sm:py-16">
          <Snowflake className="absolute -top-10 -right-10 h-72 w-72 text-white/[0.06]" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="text-[13px] font-semibold tracking-[0.18em] text-brand-200 uppercase">
                Certified pre-owned
              </p>
              <h2 className="mt-3 text-[32px] leading-tight font-extrabold sm:text-[42px]">
                Flagship phones. <br className="hidden sm:block" />
                Without the flagship price.
              </h2>
              <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-white/70">
                Choose from Boxed (like new), Open Box, UK-used, US-used and Nigerian-used devices. Every
                unit is checked for battery health, Face ID, cameras and screen
                quality before it goes on sale, and comes with our warranty.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/used"
                  className="rounded-full bg-brand-600 px-6 py-3 text-[15px] font-semibold hover:bg-brand-700"
                >
                  Shop used devices
                </Link>
                <Link
                  href="/warranty"
                  className="rounded-full px-6 py-3 text-[15px] font-semibold ring-1 ring-white/60 hover:bg-white hover:text-navy-900"
                >
                  How we grade
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "UK Used",
                  href: "/used?condition=uk-used",
                  note: "Clean, imported units",
                },
                {
                  label: "US Used",
                  href: "/used?condition=us-used",
                  note: "Great value, tested",
                },
                {
                  label: "Nigerian Used",
                  href: "/used?condition=nigeria-used",
                  note: "Lowest prices",
                },
              ].map((c) => (
                <Link
                  key={c.label}
                  href={c.href}
                  className="group rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 transition hover:bg-white/[0.12] sm:p-6"
                >
                  <DeviceIcon
                    icon="phone-used"
                    className="h-14 w-14 text-white/80 transition group-hover:-translate-y-1 sm:h-20 sm:w-20"
                  />
                  <p className="mt-4 text-[15px] font-bold sm:text-[17px]">
                    {c.label}
                  </p>
                  <p className="mt-0.5 text-[12px] text-white/60 sm:text-[13px]">
                    {c.note}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ProductRail
        title="Best used"
        highlight="deals"
        href="/used"
        products={used}
      />
      <ProductRail
        title="Shop"
        highlight="Apple"
        href="/c/apple"
        products={apple}
      />
      <ProductRail
        title="Shop"
        highlight="Samsung"
        href="/c/samsung"
        products={samsung}
      />
      <ProductRail
        title="Level up your"
        highlight="gaming"
        href="/c/gaming"
        products={gaming}
      />

      {/* Why Snoware */}
      <section className="container-x mt-20">
        <h2 className="mb-6 text-[26px] font-bold sm:text-[30px]">
          So much more at <span className="text-brand-600">Snoware</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Store,
              title: "Free pickup in-store",
              text: "Order online and pick up the same day at our store.",
              href: "/store",
              tone: "from-[#e9f2ff] to-[#d6e6ff]",
            },
            {
              icon: ShieldCheck,
              title: "Warranty you can trust",
              text: "Every device is covered, new or used. No stories.",
              href: "/warranty",
              tone: "from-[#fdebe9] to-[#fbd5d1]",
            },
            {
              icon: Headset,
              title: "Real human support",
              text: "Chat with our team on WhatsApp before and after you buy.",
              href: site.whatsappLink,
              tone: "from-[#e9f6ef] to-[#d3eedf]",
            },
            {
              icon: Truck,
              title: "Delivery nationwide",
              text: "Same-day in Port Harcourt and fast delivery to every state.",
              href: "/shipping",
              tone: "from-[#fff4e0] to-[#ffe6b8]",
            },
          ].map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className={cn(
                "group rounded-[var(--radius-card)] bg-gradient-to-br p-6 transition hover:shadow-card",
                f.tone,
              )}
            >
              <f.icon className="h-7 w-7 text-ink" />
              <h3 className="mt-5 text-[17px] font-bold">{f.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink/70">
                {f.text}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-semibold">
                Learn more{" "}
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Social */}
      <section className="container-x mt-20">
        <div className="flex flex-col items-center gap-6 rounded-[28px] bg-mist px-6 py-12 text-center">
          <p className="text-[13px] font-semibold tracking-[0.18em] text-muted uppercase">
            Join the community
          </p>
          <h2 className="max-w-xl text-[28px] leading-tight font-extrabold sm:text-[34px]">
            Unboxings, deals &amp; restocks — follow{" "}
            <span className="text-brand-600">{site.socials.handle}</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={site.socials.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-6 py-3 text-[15px] font-semibold text-white hover:opacity-90"
            >
              <InstagramIcon className="h-5 w-5" /> Instagram
            </a>
            <a
              href={site.socials.tiktok}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-white hover:bg-ink-soft"
            >
              <TikTokIcon className="h-5 w-5" /> TikTok
            </a>
            <a
              href={site.whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-[15px] font-semibold text-white hover:opacity-90"
            >
              <WhatsAppIcon className="h-5 w-5" /> WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
