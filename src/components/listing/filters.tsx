"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import type { Facets, ListingFilters } from "@/lib/catalog";
import { conditionLabel } from "@/lib/site";
import { cn, formatNaira } from "@/lib/utils";

function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const toggle = (key: string, value: string) =>
    update((p) => {
      const current = (p.get(key) ?? "").split(",").filter(Boolean);
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      if (next.length) p.set(key, next.join(","));
      else p.delete(key);
    });

  return { update, toggle, pending };
}

type PanelProps = { facets: Facets; filters: ListingFilters; hideCondition?: boolean };

export function FilterPanel({ facets, filters, hideCondition }: PanelProps) {
  const { update, toggle, pending } = useFilterNav();

  return (
    <div className={cn("space-y-1 transition-opacity", pending && "opacity-60")}>
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-[20px] font-bold">Filter by</h2>
        <button
          onClick={() => update((p) => ["condition", "brand", "storage", "color", "min", "max", "instock"].forEach((k) => p.delete(k)))}
          className="text-[13px] font-medium text-sky hover:underline"
        >
          Clear all
        </button>
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-xl bg-mist px-4 py-3 text-[14px] font-medium">
        In stock only
        <input
          type="checkbox"
          checked={!!filters.inStock}
          onChange={(e) => update((p) => (e.target.checked ? p.set("instock", "1") : p.delete("instock")))}
          className="h-4.5 w-4.5 accent-brand-600"
        />
      </label>

      {!hideCondition && facets.conditions.length > 1 && (
        <FilterSection title="Condition">
          {facets.conditions.map((c) => (
            <CheckRow key={c.value} label={conditionLabel(c.value)} count={c.count} checked={!!filters.condition?.includes(c.value)} onChange={() => toggle("condition", c.value)} />
          ))}
        </FilterSection>
      )}

      {facets.brands.length > 1 && (
        <FilterSection title="Brand">
          {facets.brands.map((b) => (
            <CheckRow key={b.value} label={b.value} count={b.count} checked={!!filters.brand?.includes(b.value)} onChange={() => toggle("brand", b.value)} />
          ))}
        </FilterSection>
      )}

      {facets.storages.length > 1 && (
        <FilterSection title="Capacity / Size">
          <div className="flex flex-wrap gap-2 pt-1">
            {facets.storages.map((s) => {
              const on = !!filters.storage?.includes(s.value);
              return (
                <button
                  key={s.value}
                  onClick={() => toggle("storage", s.value)}
                  aria-pressed={on}
                  className={cn("rounded-full border px-3 py-1.5 text-[13px] transition", on ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}
                >
                  {s.value}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {facets.colors.length > 1 && (
        <FilterSection title="Colour">
          <div className="flex flex-wrap gap-2 pt-1">
            {facets.colors.map((c) => {
              const on = !!filters.color?.includes(c.value);
              return (
                <button
                  key={c.value}
                  onClick={() => toggle("color", c.value)}
                  aria-pressed={on}
                  title={c.value}
                  className={cn("flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-[12.5px] transition", on ? "border-ink ring-1 ring-ink" : "border-line hover:border-ink")}
                >
                  <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: c.hex ?? "#ccc" }} />
                  {c.value}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {facets.priceRange[1] > 0 && (
        <FilterSection title="Price">
          <p className="mb-2 text-[12.5px] text-muted">
            {formatNaira(facets.priceRange[0])} – {formatNaira(facets.priceRange[1])}
          </p>
          {/* Keyed so the inputs reset when the URL's price range changes (e.g. "Clear all"). */}
          <PriceForm key={`${filters.min ?? ""}-${filters.max ?? ""}`} initialMin={filters.min} initialMax={filters.max} update={update} />
        </FilterSection>
      )}
    </div>
  );
}

function PriceForm({ initialMin, initialMax, update }: { initialMin?: number; initialMax?: number; update: (mutate: (p: URLSearchParams) => void) => void }) {
  const [min, setMin] = useState(initialMin?.toString() ?? "");
  const [max, setMax] = useState(initialMax?.toString() ?? "");
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        update((p) => {
          if (min) p.set("min", min);
          else p.delete("min");
          if (max) p.set("max", max);
          else p.delete("max");
        });
      }}
    >
      <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder="Min ₦" aria-label="Minimum price" className="h-10 w-full min-w-0 rounded-lg border border-line px-3 text-[13.5px] outline-none focus:border-ink" />
      <span className="text-muted">–</span>
      <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder="Max ₦" aria-label="Maximum price" className="h-10 w-full min-w-0 rounded-lg border border-line px-3 text-[13.5px] outline-none focus:border-ink" />
      <button className="h-10 shrink-0 rounded-lg bg-ink px-3 text-[13px] font-semibold text-white">Go</button>
    </form>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-line py-3">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-1.5 text-[14.5px] font-semibold" aria-expanded={open}>
        {title}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-2 space-y-1">{children}</div>}
    </div>
  );
}

function CheckRow({ label, count, checked, onChange }: { label: string; count: number; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-[14px] hover:bg-mist">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded accent-ink" />
      <span className="flex-1">{label}</span>
      <span className="text-[12px] text-muted">{count}</span>
    </label>
  );
}

export function MobileFilterButton(props: PanelProps) {
  const [open, setOpen] = useState(false);
  const activeCount = [props.filters.condition, props.filters.brand, props.filters.storage, props.filters.color].reduce((n, l) => n + (l?.length ?? 0), 0) + (props.filters.min || props.filters.max ? 1 : 0) + (props.filters.inStock ? 1 : 0);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium ring-1 ring-line hover:ring-ink lg:hidden">
        <SlidersHorizontal className="h-4 w-4" /> Filters
        {activeCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">{activeCount}</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal aria-label="Filters">
          <div className="absolute inset-0 animate-fade-in bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] animate-slide-up flex-col rounded-t-3xl bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="text-[17px] font-semibold">Filters</span>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-mist" aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FilterPanel {...props} />
            </div>
            <div className="border-t border-line p-4">
              <button onClick={() => setOpen(false)} className="h-12 w-full rounded-full bg-ink text-[15px] font-semibold text-white">
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ActiveFilters({ filters }: { filters: ListingFilters }) {
  const { toggle, update } = useFilterNav();
  const chips: { label: string; onRemove: () => void }[] = [
    ...(filters.condition ?? []).map((v) => ({ label: conditionLabel(v), onRemove: () => toggle("condition", v) })),
    ...(filters.brand ?? []).map((v) => ({ label: v, onRemove: () => toggle("brand", v) })),
    ...(filters.storage ?? []).map((v) => ({ label: v, onRemove: () => toggle("storage", v) })),
    ...(filters.color ?? []).map((v) => ({ label: v, onRemove: () => toggle("color", v) })),
  ];
  if (filters.min || filters.max)
    chips.push({
      label: `${filters.min ? formatNaira(filters.min) : "₦0"} – ${filters.max ? formatNaira(filters.max) : "any"}`,
      onRemove: () => update((p) => (p.delete("min"), p.delete("max"))),
    });
  if (filters.inStock) chips.push({ label: "In stock", onRemove: () => update((p) => p.delete("instock")) });
  if (!chips.length) return null;
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {chips.map((c) => (
        <button key={c.label} onClick={c.onRemove} className="inline-flex items-center gap-1.5 rounded-full bg-mist py-1.5 pr-2.5 pl-3.5 text-[13px] font-medium hover:bg-line">
          {c.label} <X className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
