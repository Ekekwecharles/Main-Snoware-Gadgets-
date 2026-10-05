import { NextResponse, type NextRequest } from "next/server";
import { descendantIds, getAllCategories, listProducts, type ListingFilters } from "@/lib/catalog";

const SORTS = ["best-selling", "price-asc", "price-desc", "newest"] as const;
const PAGE_SIZE = 24;

/**
 * Product listing for the app: same filtering/sorting as the website's /shop and /c/* pages.
 * Query: category (slug), q, brand, condition, sort, inStock=1, used=1, page.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const list = (key: string) => sp.getAll(key).flatMap((v) => v.split(",")).filter(Boolean);
  const sort = sp.get("sort") as ListingFilters["sort"];

  let categoryIds: number[] | undefined;
  const categorySlug = sp.get("category");
  if (categorySlug) {
    const all = await getAllCategories();
    const root = all.find((c) => c.slug === categorySlug);
    if (!root) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    categoryIds = descendantIds(all, root.id);
  }

  const { cards, facets } = await listProducts({
    categoryIds,
    filters: {
      q: sp.get("q")?.slice(0, 80) || undefined,
      brand: list("brand"),
      condition: list("condition"),
      inStock: sp.get("inStock") === "1",
      usedOnly: sp.get("used") === "1",
      sort: sort && SORTS.includes(sort) ? sort : undefined,
    },
  });

  const page = Math.max(1, Number(sp.get("page")) || 1);
  const items = cards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return NextResponse.json({ items, total: cards.length, page, pageSize: PAGE_SIZE, hasMore: page * PAGE_SIZE < cards.length, facets });
}
