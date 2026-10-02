import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Snowflake } from "@/components/brand/logo";

export function ContentPage({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <Snowflake className="pointer-events-none absolute -top-20 -right-20 h-96 w-96 text-white/[0.04]" />
        <div className="container-x relative py-14 sm:py-20">
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1 text-[13px] text-white/60">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white/90">{title}</span>
          </nav>
          {eyebrow && <p className="text-[13px] font-semibold tracking-[0.18em] text-brand-200 uppercase">{eyebrow}</p>}
          <h1 className="mt-2 max-w-3xl text-[34px] leading-tight font-extrabold sm:text-[48px]">{title}</h1>
          {intro && <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-white/70 sm:text-[18px]">{intro}</p>}
        </div>
      </section>
      <div className="container-x py-12 sm:py-16">{children}</div>
    </>
  );
}
