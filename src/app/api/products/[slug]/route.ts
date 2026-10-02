import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/catalog";

export async function GET(_req: Request, ctx: RouteContext<"/api/products/[slug]">) {
  const { slug } = await ctx.params;
  const p = await getProductBySlug(slug);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand?.name ?? null,
    categorySlug: p.category.slug,
    shortDescription: p.shortDescription,
    highlights: p.highlights,
    image: p.images[0]?.url ?? null,
    images: p.images.map((i) => i.url),
    variants: p.variants.map((v) => ({
      id: v.id,
      condition: v.condition,
      storage: v.storage,
      color: v.color,
      colorHex: v.colorHex,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      stock: v.stock,
    })),
  });
}
