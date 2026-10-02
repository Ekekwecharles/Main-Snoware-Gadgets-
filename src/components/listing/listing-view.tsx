import Link from "next/link";
import { ChevronRight, SearchX } from "lucide-react";
import type { Facets, ListingFilters, ProductCardData } from "@/lib/catalog";
import { ProductCard } from "@/components/product/product-card";
import { DeviceIcon, iconForCategory } from "@/components/brand/device-icon";
import { FilterPanel, MobileFilterButton, ActiveFilters } from "./filters";
import { SortSelect } from "./sort-select";
import { whatsappMessageLink } from "@/lib/site";

type Crumb = { label: string; href: string };

export function parseFilters(sp: Record<string, string | string[] | undefined>): ListingFilters {
  const list = (k: string) => {
    const v = sp[k];
    if (!v) return undefined;
    return (Array.isArray(v) ? v : v.split(",")).filter(Boolean);
  };
  const num = (k: string) => {
    const v = Number(sp[k]);
    return Number.isFinite(v) && v > 0 ? v : undefined;
  };
  const sort = sp.sort as ListingFilters["sort"];
  return {
    q: typeof sp.q === "string" ? sp.q : undefined,
    condition: list("condition"),
    brand: list("brand"),
    storage: list("storage"),
    color: list("color"),
    min: num("min"),
    max: num("max"),
    inStock: sp.instock === "1",
    sort: sort && ["best-selling", "price-asc", "price-desc", "newest"].includes(sort) ? sort : "best-selling",
  };
}

type Props = {
  title: string;
  description?: string | null;
  crumbs: Crumb[];
  cards: ProductCardData[];
  facets: Facets;
  filters: ListingFilters;
  subcategories?: { name: string; href: string; slug: string }[];
  hideConditionFilter?: boolean;
};

export function ListingView({ title, description, crumbs, cards, facets, filters, subcategories, hideConditionFilter }: Props) {
  const inStockCount = cards.filter((c) => c.inStock).length;
  return (
    <div className="container-x py-8 lg:py-10">
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-[13px]">
          <li>
            <Link href="/" className="text-sky hover:underline">Home</Link>
          </li>
          {crumbs.map((c, i) => (
            <li key={c.href} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted" />
              {i === crumbs.length - 1 ? (
                <span className="text-ink/70" aria-current="page">{c.label}</span>
              ) : (
                <Link href={c.href} className="text-sky hover:underline">{c.label}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <header className="mb-6">
        <h1 className="text-[30px] leading-tight font-extrabold sm:text-[38px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-muted">{description}</p>}
      </header>

      {subcategories && subcategories.length > 0 && (
        <div className="no-scrollbar -mx-4 mb-8 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {subcategories.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex shrink-0 items-center gap-2.5 rounded-full bg-mist py-2 pr-4 pl-2 text-[14px] font-medium transition hover:bg-ink hover:text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white group-hover:bg-white/10">
                <DeviceIcon icon={iconForCategory(s.slug)} className="h-5 w-5" strokeWidth={1.6} />
              </span>
              {s.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-24">
            <FilterPanel facets={facets} filters={filters} hideCondition={hideConditionFilter} />
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px] text-muted">
              <span className="font-semibold text-ink">{cards.length}</span> {cards.length === 1 ? "product" : "products"}
              {cards.length !== inStockCount && <> · {inStockCount} in stock</>}
              {filters.q && <> for “{filters.q}”</>}
            </p>
            <div className="flex items-center gap-2">
              <MobileFilterButton facets={facets} filters={filters} hideCondition={hideConditionFilter} />
              <SortSelect value={filters.sort ?? "best-selling"} />
            </div>
          </div>

          <ActiveFilters filters={filters} />

          {cards.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {cards.map((p, i) => (
                <li key={p.id}>
                  <ProductCard product={p} priority={i < 4} className="h-full" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center rounded-[var(--radius-card)] bg-mist px-6 py-16 text-center">
              <SearchX className="h-10 w-10 text-muted" />
              <p className="mt-4 text-[18px] font-semibold">No products match these filters</p>
              <p className="mt-1 max-w-sm text-[14px] text-muted">Try removing a filter — or tell us what you're looking for and we'll source it for you.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="?" className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-white">Clear filters</Link>
                <a
                  href={whatsappMessageLink(`Hi Snoware, I'm looking for ${filters.q ?? title}. Do you have it?`)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full px-5 py-2.5 text-[14px] font-semibold ring-1 ring-ink"
                >
                  Ask on WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
