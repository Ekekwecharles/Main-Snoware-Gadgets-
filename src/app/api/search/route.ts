import { NextResponse, type NextRequest } from "next/server";
import { searchProducts } from "@/lib/catalog";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = await searchProducts(q.slice(0, 80));
  return NextResponse.json(
    results.map((r) => ({ id: r.id, name: r.name, slug: r.slug, image: r.image, price: r.price, categorySlug: r.categorySlug, inStock: r.inStock })),
  );
}
