"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { Banner } from "@/db/schema";
import { DeviceIcon } from "@/components/brand/device-icon";
import { Snowflake } from "@/components/brand/logo";
import type { MenuIcon } from "@/lib/site";
import { cn } from "@/lib/utils";

const themes: Record<string, { bg: string; text: string; sub: string; primary: string; secondary: string; art: string }> = {
  light: { bg: "bg-mist", text: "text-ink", sub: "text-ink/65", primary: "bg-ink text-white hover:bg-ink-soft", secondary: "ring-1 ring-ink/80 text-ink hover:bg-ink hover:text-white", art: "text-navy-900/15" },
  dark: { bg: "bg-ink", text: "text-white", sub: "text-white/65", primary: "bg-white text-ink hover:bg-white/90", secondary: "ring-1 ring-white/70 text-white hover:bg-white hover:text-ink", art: "text-white/15" },
  navy: { bg: "bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950", text: "text-white", sub: "text-white/70", primary: "bg-brand-600 text-white hover:bg-brand-700", secondary: "ring-1 ring-white/70 text-white hover:bg-white hover:text-navy-900", art: "text-white/15" },
  red: { bg: "bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800", text: "text-white", sub: "text-white/80", primary: "bg-white text-brand-700 hover:bg-white/90", secondary: "ring-1 ring-white/80 text-white hover:bg-white hover:text-brand-700", art: "text-white/20" },
  blue: { bg: "bg-gradient-to-br from-sky to-[#0059c9]", text: "text-white", sub: "text-white/80", primary: "bg-white text-sky hover:bg-white/90", secondary: "ring-1 ring-white/80 text-white hover:bg-white hover:text-sky", art: "text-white/20" },
};

function iconFor(b: Banner): MenuIcon {
  const t = `${b.title} ${b.ctaHref}`.toLowerCase();
  if (/starlink/.test(t)) return "satellite";
  if (/playstation|ps5|gaming/.test(t)) return "console";
  if (/macbook|laptop/.test(t)) return "laptop";
  if (/ipad|tab/.test(t)) return "tablet";
  if (/watch/.test(t)) return "watch";
  if (/airpods|buds/.test(t)) return "earbuds";
  if (/jbl|speaker|audio/.test(t)) return "speaker";
  if (/used/.test(t)) return "phone-used";
  return "phone";
}

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true })]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const total = banners.length + 1;

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  const togglePlay = useCallback(() => {
    const autoplay = embla?.plugins().autoplay;
    if (!autoplay) return;
    if (autoplay.isPlaying()) autoplay.stop();
    else autoplay.play();
    setPlaying(autoplay.isPlaying());
  }, [embla]);

  return (
    <section aria-roledescription="carousel" aria-label="Featured" className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {/* Brand slide built from the Snoware logo artwork */}
          <div className="relative min-w-0 flex-[0_0_100%]" aria-roledescription="slide" aria-label={`1 of ${total}`}>
            <div className="relative h-[520px] overflow-hidden bg-black sm:h-[560px] lg:h-[600px]">
              <Image src="/snoware-hero.png" alt="Snoware Gadgets — phones, laptops, consoles and audio in a shopping cart" fill priority sizes="100vw" className="object-cover object-[70%_center] md:object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent md:bg-gradient-to-r md:from-black/70 md:via-transparent" />
              <div className="container-x relative flex h-full flex-col justify-end pb-16 md:pb-20">
                <p className="max-w-md text-[15px] text-white/80 md:text-[17px]">
                  Genuine new &amp; UK/US-used phones, laptops, consoles and more — at honest prices, delivered across Nigeria.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/shop" className="rounded-full bg-brand-600 px-7 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-700">
                    Shop all gadgets
                  </Link>
                  <Link href="/used" className="rounded-full px-7 py-3 text-[15px] font-semibold text-white ring-1 ring-white/70 transition hover:bg-white hover:text-ink">
                    Browse used deals
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {banners.map((b, i) => {
            const t = themes[b.theme] ?? themes.light;
            return (
              <div key={b.id} className="relative min-w-0 flex-[0_0_100%]" aria-roledescription="slide" aria-label={`${i + 2} of ${total}`}>
                <div className={cn("relative h-[520px] overflow-hidden sm:h-[560px] lg:h-[600px]", t.bg)}>
                  <div className="container-x grid h-full items-center gap-6 md:grid-cols-2">
                    <div className={cn("relative z-10 order-2 pb-14 text-center md:order-1 md:pb-0 md:text-left", t.text)}>
                      {b.eyebrow && <p className={cn("text-[13px] font-semibold tracking-[0.18em] uppercase", t.sub)}>{b.eyebrow}</p>}
                      <h2 className="mt-3 text-[36px] leading-[1.05] font-extrabold sm:text-[48px] lg:text-[60px]">{b.title}</h2>
                      {b.subtitle && <p className={cn("mx-auto mt-4 max-w-md text-[16px] leading-relaxed md:mx-0 lg:text-[18px]", t.sub)}>{b.subtitle}</p>}
                      {b.priceText && <p className="mt-5 font-display text-[22px] font-bold lg:text-[26px]">{b.priceText}</p>}
                      <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
                        {b.ctaLabel && b.ctaHref && (
                          <Link href={b.ctaHref} className={cn("rounded-full px-7 py-3 text-[15px] font-semibold transition", t.primary)}>
                            {b.ctaLabel}
                          </Link>
                        )}
                        {b.secondaryLabel && b.secondaryHref && (
                          <Link href={b.secondaryHref} className={cn("rounded-full px-7 py-3 text-[15px] font-semibold transition", t.secondary)}>
                            {b.secondaryLabel}
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="relative order-1 flex h-full max-h-[260px] items-center justify-center md:order-2 md:max-h-none">
                      {b.image ? (
                        <Image src={b.image} alt={b.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain p-6" priority={i === 0} />
                      ) : (
                        <>
                          <Snowflake className={cn("absolute h-[85%] w-[85%] animate-[spin_60s_linear_infinite]", t.art)} />
                          <DeviceIcon icon={iconFor(b)} className={cn("relative h-[70%] w-[70%] max-w-[360px]", t.text, "opacity-90")} strokeWidth={0.9} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-2 backdrop-blur-md">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => embla?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={cn("h-2 rounded-full transition-all", i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80")}
            />
          ))}
        </div>
        <button onClick={togglePlay} className="rounded-full bg-black/25 p-2 text-white backdrop-blur-md hover:bg-black/40" aria-label={playing ? "Pause slideshow" : "Play slideshow"}>
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
      </div>
      <button onClick={() => embla?.scrollPrev()} className="absolute top-1/2 left-4 hidden -translate-y-1/2 rounded-full bg-white/80 p-3 shadow-card backdrop-blur hover:bg-white lg:block" aria-label="Previous slide">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={() => embla?.scrollNext()} className="absolute top-1/2 right-4 hidden -translate-y-1/2 rounded-full bg-white/80 p-3 shadow-card backdrop-blur hover:bg-white lg:block" aria-label="Next slide">
        <ChevronRight className="h-5 w-5" />
      </button>
    </section>
  );
}
