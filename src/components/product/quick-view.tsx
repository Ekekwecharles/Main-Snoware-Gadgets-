"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Loader2, X } from "lucide-react";
import { ProductImage } from "./product-image";
import { ProductPurchase, type PurchaseProduct } from "./product-purchase";

type QuickData = PurchaseProduct & { shortDescription: string | null; highlights: string[]; brand: string | null; images: string[] };

export function QuickView({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [data, setData] = useState<QuickData | null>(null);
  const [error, setError] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/products/${slug}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch((e) => e?.name !== "AbortError" && setError(true));
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      ctrl.abort();
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [slug, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal aria-label="Quick view">
      <div className="absolute inset-0 animate-fade-in bg-ink/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[92dvh] w-full max-w-4xl animate-slide-up overflow-y-auto rounded-t-3xl bg-white shadow-lift sm:rounded-3xl">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 rounded-full bg-white/90 p-2 shadow-card hover:bg-mist" aria-label="Close quick view">
          <X className="h-5 w-5" />
        </button>

        {!data && !error && (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted" />
          </div>
        )}
        {error && <p className="p-10 text-center text-muted">Couldn't load this product. Please try again.</p>}

        {data && (
          <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-2 md:gap-10">
            <div>
              <div className="aspect-square overflow-hidden rounded-2xl bg-mist">
                <ProductImage src={data.images[imageIndex] ?? null} alt={data.name} categorySlug={data.categorySlug} sizes="(min-width: 768px) 420px, 90vw" />
              </div>
              {data.images.length > 1 && (
                <div className="mt-3 flex gap-2">
                  {data.images.slice(0, 5).map((img, i) => (
                    <button
                      key={img}
                      onClick={() => setImageIndex(i)}
                      className={`h-14 w-14 overflow-hidden rounded-lg bg-mist ring-2 ${i === imageIndex ? "ring-ink" : "ring-transparent"}`}
                      aria-label={`Image ${i + 1}`}
                    >
                      <ProductImage src={img} alt="" sizes="56px" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              {data.brand && <p className="text-[13px] font-medium text-muted">{data.brand}</p>}
              <h2 className="mt-1 pr-10 text-[24px] leading-tight font-bold">{data.name}</h2>
              {data.shortDescription && <p className="mt-3 text-[14.5px] leading-relaxed text-ink/75">{data.shortDescription}</p>}
              <div className="mt-6">
                <ProductPurchase product={data} compact />
              </div>
              <Link href={`/p/${data.slug}`} onClick={onClose} className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-sky hover:underline">
                See full details <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
