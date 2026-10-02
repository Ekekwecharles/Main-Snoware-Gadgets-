"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X, ArrowRight } from "lucide-react";
import { ProductImage } from "@/components/product/product-image";
import { formatNaira } from "@/lib/utils";

type Result = { id: number; name: string; slug: string; image: string | null; price: number; categorySlug: string; inStock: boolean };

const popular = ["iPhone 17 Pro Max", "UK used iPhone", "Galaxy S26 Ultra", "PS5", "Starlink Mini", "MacBook Air", "JBL"];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        setResults(await res.json());
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  if (!open) return null;

  // Stale results from a longer query are hidden rather than cleared in an effect.
  const visibleResults = q.trim().length >= 2 ? results : [];

  const submit = (term: string) => {
    if (!term.trim()) return;
    onClose();
    router.push(`/shop?q=${encodeURIComponent(term.trim())}`);
  };

  return (
    <div className="fixed inset-0 z-[60] animate-fade-in" role="dialog" aria-modal aria-label="Search">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-auto mt-0 max-w-2xl bg-white shadow-lift sm:mt-20 sm:rounded-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(q);
          }}
          className="flex items-center gap-3 border-b border-line px-5"
        >
          <Search className="h-5 w-5 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search iPhones, laptops, PS5, Starlink…"
            className="h-16 w-full bg-transparent text-[16px] outline-none placeholder:text-muted/70"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-mist" aria-label="Close search">
            <X className="h-5 w-5" />
          </button>
        </form>

        <div className="max-h-[70vh] overflow-y-auto p-3">
          {visibleResults.length > 0 ? (
            <ul>
              {visibleResults.map((r) => (
                <li key={r.id}>
                  <Link href={`/p/${r.slug}`} onClick={onClose} className="flex items-center gap-4 rounded-xl p-2 hover:bg-mist">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist">
                      <ProductImage src={r.image} alt={r.name} categorySlug={r.categorySlug} sizes="56px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{r.name}</p>
                      <p className="text-[13px] text-muted">
                        {r.inStock ? `From ${formatNaira(r.price)}` : "Sold out"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted" />
                  </Link>
                </li>
              ))}
              <li>
                <button onClick={() => submit(q)} className="mt-1 w-full rounded-xl p-3 text-left text-[14px] font-medium text-sky hover:bg-mist">
                  See all results for “{q}”
                </button>
              </li>
            </ul>
          ) : q.trim().length >= 2 && !loading ? (
            <p className="p-6 text-center text-[14px] text-muted">No products match “{q}”. Try a different term or ask us on WhatsApp.</p>
          ) : (
            <div className="p-3">
              <p className="mb-3 text-[12px] font-semibold tracking-wider text-muted uppercase">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {popular.map((p) => (
                  <button key={p} onClick={() => submit(p)} className="rounded-full border border-line px-3.5 py-1.5 text-[13px] hover:border-ink">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
