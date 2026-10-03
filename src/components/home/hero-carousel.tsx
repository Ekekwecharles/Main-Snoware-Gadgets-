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

/** Every slide shares one height so the carousel doesn't jump. Taller on phones, where art and text stack. */
const slideHeight = "h-[620px] sm:h-[660px] md:h-[560px] lg:h-[600px]";

/** Slightly stronger snowflake when a photo sits on top, so it stays visible behind busy images. */
const artWithImage: Record<string, string> = {
  light: "text-navy-900/20",
  dark: "text-white/20",
  navy: "text-white/20",
  red: "text-white/25",
  blue: "text-white/25",
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
            <div className={cn("relative overflow-hidden bg-black", slideHeight)}>
              {/* Phones: show the whole banner (logo + cart) at full width on top, text below.
                  Tablet/desktop: banner fills the slide. */}
              <div className="absolute inset-x-0 top-0 aspect-[3/2] md:inset-0 md:aspect-auto">
                <Image
                  src="/snoware-hero.png"
                  alt="Snoware Gadgets — phones, laptops, consoles and audio in a shopping cart"
                  fill
                  priority
                  sizes="100vw"
                  className="object-contain object-top md:object-cover md:object-center"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 via-45% to-transparent to-70% md:bg-gradient-to-r md:from-black/70 md:via-transparent md:via-50% md:to-transparent" />
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
                <div className={cn("relative overflow-hidden", slideHeight, t.bg)}>
                  {/* Phones: stacked (art on top, text below). md+: two columns. */}
                  <div className="container-x flex h-full flex-col items-center justify-center gap-3 pt-4 pb-16 md:grid md:grid-cols-2 md:gap-6 md:py-0">
                    <div className={cn("relative z-10 order-2 w-full text-center md:order-1 md:text-left", t.text)}>
                      {b.eyebrow && <p className={cn("text-[12px] font-semibold tracking-[0.18em] uppercase sm:text-[13px]", t.sub)}>{b.eyebrow}</p>}
                      <h2 className="mt-2 text-[32px] leading-[1.05] font-extrabold sm:mt-3 sm:text-[44px] lg:text-[60px]">{b.title}</h2>
                      {b.subtitle && <p className={cn("mx-auto mt-2 max-w-md text-[15px] leading-relaxed sm:mt-4 md:mx-0 lg:text-[18px]", t.sub)}>{b.subtitle}</p>}
                      {b.priceText && <p className="mt-3 font-display text-[20px] font-bold sm:mt-5 sm:text-[22px] lg:text-[26px]">{b.priceText}</p>}
                      <div className="mt-5 flex flex-wrap justify-center gap-3 sm:mt-7 md:justify-start">
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
                    <div className="relative order-1 flex h-[250px] w-full shrink-0 items-center justify-center sm:h-[280px] md:order-2 md:h-full">
                      {/* Signature snowflake: always rotating behind the slide art, uploaded image or not. */}
                      <Snowflake
                        className={cn(
                          "pointer-events-none absolute inset-0 m-auto aspect-square h-[105%] max-w-none animate-snow-spin will-change-transform",
                          b.image ? artWithImage[b.theme] ?? t.art : t.art,
                        )}
                      />
                      {b.image ? (
                        <div className="relative z-10 h-full w-full">
                          <Image src={b.image} alt={b.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain p-2 sm:p-4 md:p-10" priority={i === 0} />
                        </div>
                      ) : (
                        <DeviceIcon icon={iconFor(b)} className={cn("relative z-10 h-[70%] w-[70%] max-w-[360px]", t.text, "opacity-90")} strokeWidth={0.9} />
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
