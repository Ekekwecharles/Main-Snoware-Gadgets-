"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductCardData } from "@/lib/catalog";
import { ProductCard } from "@/components/product/product-card";

/** Horizontally scrolling product row with arrow controls (snap-scrolls on touch). */
export function ProductRail({ title, highlight, href, products }: { title: string; highlight?: string; href?: string; products: ProductCardData[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  if (!products.length) return null;

  return (
    <section className="container-x mt-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-[26px] font-bold sm:text-[30px]">
          {title} {highlight && <span className="text-brand-600">{highlight}</span>}
        </h2>
        <div className="flex items-center gap-2">
          {href && (
            <Link href={href} className="mr-2 hidden items-center gap-1 text-[14px] font-semibold text-sky hover:underline sm:inline-flex">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <button onClick={() => scroll(-1)} className="rounded-full p-2 ring-1 ring-line hover:bg-mist" aria-label="Scroll left">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => scroll(1)} className="rounded-full p-2 ring-1 ring-line hover:bg-mist" aria-label="Scroll right">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0">
        {products.map((p) => (
          <div key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-[31%] lg:w-[calc(25%-12px)]">
            <ProductCard product={p} className="h-full" />
          </div>
        ))}
      </div>
      {href && (
        <Link href={href} className="mt-2 inline-flex items-center gap-1 text-[14px] font-semibold text-sky sm:hidden">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </section>
  );
}
