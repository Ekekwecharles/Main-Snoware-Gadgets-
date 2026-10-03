import "server-only";
import { and, asc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  banners,
  brands,
  categories,
  products,
  settings,
  deliveryZones,
} from "@/db/schema";
import type { Category } from "@/db/schema";
import { conditionLabel } from "@/lib/site";

export type ProductCardData = {
  id: number;
  name: string;
  slug: string;
  badge: string | null;
  image: string | null;
  categorySlug: string;
  brand: string | null;
  price: number;
  compareAtPrice: number | null;
  /** True when at least one variant can be bought (in stock or on order). */
  inStock: boolean;
  /** Every buyable variant is "available on order". */
  onOrderOnly: boolean;
  conditions: string[];
  storages: string[];
  colors: { name: string; hex: string | null }[];
  defaultVariantId: number | null;
  defaultVariantLabel: string;
  defaultVariantOnOrder: boolean;
  /** Optional quantity limit of the default variant (null = unlimited). */
  defaultVariantStock: number | null;
  salesCount: number;
  createdAt: Date;
};

type ProductWithRelations = Awaited<ReturnType<typeof loadProducts>>[number];

async function loadProducts(where?: SQL) {
  return db.query.products.findMany({
    where: where
      ? and(eq(products.isActive, true), where)
      : eq(products.isActive, true),
    with: {
      variants: true,
      images: { orderBy: (img, { asc }) => [asc(img.sortOrder)] },
      brand: true,
      category: true,
    },
  });
}

export function variantLabel(v: {
  condition: string;
  storage: string | null;
  color: string | null;
}) {
  const cond = v.condition === "new" ? null : conditionLabel(v.condition);
  return [v.storage, v.color, cond].filter(Boolean).join(" · ");
}

/** A variant can be bought unless it's marked sold out or its optional quantity has run out. */
export const isPurchasable = (v: { availability: string; stock: number | null }) =>
  v.availability !== "sold_out" && (v.stock == null || v.stock > 0);

function toCard(p: ProductWithRelations): ProductCardData {
  const buyable = p.variants.filter(isPurchasable);
  const pool = buyable.length ? buyable : p.variants;
  const cheapest = [...pool].sort((a, b) => a.price - b.price)[0];
  const colors = new Map<string, string | null>();
  for (const v of p.variants) if (v.color) colors.set(v.color, v.colorHex);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    badge: p.badge,
    image: p.images[0]?.url ?? null,
    categorySlug: p.category.slug,
    brand: p.brand?.name ?? null,
    price: cheapest?.price ?? 0,
    compareAtPrice: cheapest?.compareAtPrice ?? null,
    inStock: buyable.length > 0,
    onOrderOnly: buyable.length > 0 && buyable.every((v) => v.availability === "on_order"),
    conditions: [...new Set(p.variants.map((v) => v.condition))],
    storages: [
      ...new Set(
        p.variants.map((v) => v.storage).filter((s): s is string => !!s),
      ),
    ],
    colors: [...colors].map(([name, hex]) => ({ name, hex })),
    defaultVariantId: cheapest?.id ?? null,
    defaultVariantLabel: cheapest ? variantLabel(cheapest) : "",
    defaultVariantOnOrder: cheapest?.availability === "on_order",
    defaultVariantStock: cheapest?.stock ?? null,
    salesCount: p.salesCount,
    createdAt: p.createdAt,
  };
}

/* ───────────── Categories ───────────── */

export async function getAllCategories() {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export function descendantIds(all: Category[], rootId: number) {
  const ids = new Set([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of all) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }
  return [...ids];
}

export async function getCategoryPath(slugs: string[]) {
  const all = await getAllCategories();
  const trail: Category[] = [];
  let parentId: number | null = null;
  for (const slug of slugs) {
    const match = all.find(
      (c) => c.slug === slug && (trail.length === 0 || c.parentId === parentId),
    );
    if (!match) return null;
    trail.push(match);
    parentId = match.id;
  }
  const current = trail[trail.length - 1];
  return {
    trail,
    current,
    children: all.filter((c) => c.parentId === current.id),
    ids: descendantIds(all, current.id),
  };
}

/* ───────────── Product listing ───────────── */

export type ListingFilters = {
  q?: string;
  condition?: string[];
  brand?: string[];
  storage?: string[];
  color?: string[];
  min?: number;
  max?: number;
  inStock?: boolean;
  usedOnly?: boolean;
  sort?: "best-selling" | "price-asc" | "price-desc" | "newest";
};

export type Facets = {
  brands: { value: string; count: number }[];
  conditions: { value: string; count: number }[];
  storages: { value: string; count: number }[];
  colors: { value: string; hex: string | null; count: number }[];
  priceRange: [number, number];
};

function countBy<T>(
  cards: ProductCardData[],
  pick: (c: ProductCardData) => T[],
  key: (t: T) => string,
) {
  const counts = new Map<string, { item: T; count: number }>();
  for (const card of cards)
    for (const item of pick(card)) {
      const k = key(item);
      const prev = counts.get(k);
      counts.set(k, { item, count: (prev?.count ?? 0) + 1 });
    }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

/**
 * Loads products for a category set and filters/sorts in memory. The catalogue is a few
 * hundred SKUs, so this keeps faceting simple; move filters into SQL if it grows to thousands.
 */
export async function listProducts(opts: {
  categoryIds?: number[];
  filters: ListingFilters;
}) {
  const { filters } = opts;
  const q = filters.q?.trim();
  const rows = await loadProducts(
    and(
      opts.categoryIds
        ? inArray(products.categoryId, opts.categoryIds)
        : undefined,
      q
        ? or(
            ilike(products.name, `%${q}%`),
            ilike(products.shortDescription, `%${q}%`),
          )
        : undefined,
    ),
  );

  let cards = rows
    .filter(
      (p) => !filters.usedOnly || p.variants.some((v) => v.condition !== "new"),
    )
    .map((p) => {
      if (!filters.usedOnly) return toCard(p);
      // On the "Used" page, price/stock reflect used variants only.
      return toCard({
        ...p,
        variants: p.variants.filter((v) => v.condition !== "new"),
      });
    });

  const facets: Facets = {
    brands: countBy(
      cards,
      (c) => (c.brand ? [c.brand] : []),
      (b) => b,
    ).map((x) => ({ value: x.item, count: x.count })),
    conditions: countBy(
      cards,
      (c) => c.conditions,
      (s) => s,
    ).map((x) => ({ value: x.item, count: x.count })),
    storages: countBy(
      cards,
      (c) => c.storages,
      (s) => s,
    ).map((x) => ({ value: x.item, count: x.count })),
    colors: countBy(
      cards,
      (c) => c.colors,
      (c) => c.name,
    ).map((x) => ({ value: x.item.name, hex: x.item.hex, count: x.count })),
    priceRange: cards.length
      ? [
          Math.min(...cards.map((c) => c.price)),
          Math.max(...cards.map((c) => c.price)),
        ]
      : [0, 0],
  };

  const has = (list: string[] | undefined, values: string[]) =>
    !list?.length || values.some((v) => list.includes(v));
  cards = cards.filter(
    (c) =>
      has(filters.brand, c.brand ? [c.brand] : []) &&
      has(filters.condition, c.conditions) &&
      has(filters.storage, c.storages) &&
      has(
        filters.color,
        c.colors.map((x) => x.name),
      ) &&
      (filters.min == null || c.price >= filters.min) &&
      (filters.max == null || c.price <= filters.max) &&
      (!filters.inStock || c.inStock),
  );

  const sorters: Record<
    NonNullable<ListingFilters["sort"]>,
    (a: ProductCardData, b: ProductCardData) => number
  > = {
    "best-selling": (a, b) => b.salesCount - a.salesCount,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  };
  const sorter = sorters[filters.sort ?? "best-selling"];
  // Sold-out items always sink to the bottom so shoppers see what they can buy first.
  cards.sort((a, b) => Number(b.inStock) - Number(a.inStock) || sorter(a, b));

  return { cards, facets };
}

export async function getFeaturedProducts(limit = 8) {
  const rows = await loadProducts(eq(products.featured, true));
  return rows
    .map(toCard)
    .sort(
      (a, b) =>
        Number(b.inStock) - Number(a.inStock) || b.salesCount - a.salesCount,
    )
    .slice(0, limit);
}

export async function getProductsByCategorySlug(slug: string, limit = 8) {
  const all = await getAllCategories();
  const root = all.find((c) => c.slug === slug);
  if (!root) return [];
  const rows = await loadProducts(
    inArray(products.categoryId, descendantIds(all, root.id)),
  );
  return rows
    .map(toCard)
    .sort(
      (a, b) =>
        Number(b.inStock) - Number(a.inStock) || b.salesCount - a.salesCount,
    )
    .slice(0, limit);
}

export async function getUsedHighlights(limit = 8) {
  const rows = await loadProducts();
  return rows
    .filter((p) => p.variants.some((v) => v.condition !== "new" && isPurchasable(v)))
    .map((p) =>
      toCard({
        ...p,
        variants: p.variants.filter((v) => v.condition !== "new"),
      }),
    )
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, limit);
}

export async function searchProducts(q: string, limit = 6) {
  if (q.trim().length < 2) return [];
  const rows = await loadProducts(ilike(products.name, `%${q.trim()}%`));
  return rows
    .map(toCard)
    .sort(
      (a, b) =>
        Number(b.inStock) - Number(a.inStock) || b.salesCount - a.salesCount,
    )
    .slice(0, limit);
}

/* ───────────── Product detail ───────────── */

export async function getProductBySlug(slug: string) {
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.isActive, true)),
    with: {
      variants: { orderBy: (v, { asc }) => [asc(v.price)] },
      images: { orderBy: (img, { asc }) => [asc(img.sortOrder)] },
      brand: true,
      category: true,
    },
  });
  if (!product) return null;
  const all = await getAllCategories();
  const trail: Category[] = [];
  let cursor: Category | undefined = all.find(
    (c) => c.id === product.categoryId,
  );
  while (cursor) {
    trail.unshift(cursor);
    cursor = cursor.parentId
      ? all.find((c) => c.id === cursor!.parentId)
      : undefined;
  }
  return { ...product, trail };
}

export type ProductDetail = NonNullable<
  Awaited<ReturnType<typeof getProductBySlug>>
>;

export async function getRelatedProducts(
  productId: number,
  categoryId: number,
  limit = 8,
) {
  const rows = await loadProducts(eq(products.categoryId, categoryId));
  return rows
    .filter((p) => p.id !== productId)
    .map(toCard)
    .sort(
      (a, b) =>
        Number(b.inStock) - Number(a.inStock) || b.salesCount - a.salesCount,
    )
    .slice(0, limit);
}

/* ───────────── Content & settings ───────────── */

export async function getBanners(placement: "hero" | "promo") {
  return db.query.banners.findMany({
    where: and(eq(banners.placement, placement), eq(banners.isActive, true)),
    orderBy: (b, { asc }) => [asc(b.sortOrder)],
  });
}

export async function getBrands() {
  return db.select().from(brands).orderBy(asc(brands.name));
}

export const settingDefaults = {
  store_address: "Address coming soon — message us on WhatsApp for directions",
  store_hours: "Mon – Sat: 9:00am – 7:00pm",
  store_map_query: "Port Harcourt, Nigeria",
  announcement:
    "Free in-store pickup · Fast delivery nationwide · Pay securely with Paystack",
};

export type SettingKey = keyof typeof settingDefaults;

export async function getSettings(): Promise<Record<SettingKey, string>> {
  try {
    const rows = await db.select().from(settings);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { ...settingDefaults, ...map } as Record<SettingKey, string>;
  } catch (err) {
    // Keep the shell (header/footer) rendering even if the database is unreachable.
    console.error("[settings] falling back to defaults", err);
    return settingDefaults;
  }
}

export async function getDeliveryZones() {
  return db.query.deliveryZones.findMany({
    where: eq(deliveryZones.isActive, true),
    orderBy: (z, { asc }) => [asc(z.sortOrder), asc(z.state), asc(z.name)],
  });
}
