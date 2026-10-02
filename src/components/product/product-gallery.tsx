"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
import { ProductImage } from "./product-image";
import { cn } from "@/lib/utils";

type Img = { url: string; alt: string };

export function ProductGallery({ images, name, categorySlug }: { images: Img[]; name: string; categorySlug: string }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: images.length > 1 });
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  const go = useCallback((i: number) => embla?.scrollTo(i), [embla]);

  if (!images.length) {
    return (
      <div className="aspect-square overflow-hidden rounded-[28px] bg-mist">
        <ProductImage src={null} alt={name} categorySlug={categorySlug} />
      </div>
    );
  }

  return (
    <div>
      <div className="group relative overflow-hidden rounded-[28px] bg-mist">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {images.map((img, i) => (
              <div key={img.url} className="relative aspect-square min-w-0 flex-[0_0_100%]">
                <ProductImage src={img.url} alt={img.alt} priority={i === 0} sizes="(min-width: 1024px) 55vw, 100vw" />
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => setZoom(true)} className="absolute top-4 right-4 rounded-full bg-white/90 p-2.5 shadow-card opacity-0 transition group-hover:opacity-100 focus:opacity-100" aria-label="Zoom image">
          <ZoomIn className="h-4.5 w-4.5" />
        </button>
        {images.length > 1 && (
          <>
            <button onClick={() => embla?.scrollPrev()} className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-card" aria-label="Previous image">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => embla?.scrollNext()} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-card" aria-label="Next image">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => go(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === index}
              className={cn("relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-mist ring-2 transition", i === index ? "ring-ink" : "ring-transparent hover:ring-line")}
            >
              <ProductImage src={img.url} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div className="fixed inset-0 z-[90] flex animate-fade-in items-center justify-center bg-white" role="dialog" aria-modal aria-label="Image zoom">
          <button onClick={() => setZoom(false)} className="absolute top-4 right-4 z-10 rounded-full bg-mist p-3" aria-label="Close zoom">
            <X className="h-5 w-5" />
          </button>
          <div className="relative h-full w-full max-w-5xl">
            <ProductImage src={images[index].url} alt={images[index].alt} sizes="100vw" />
          </div>
        </div>
      )}
    </div>
  );
}
