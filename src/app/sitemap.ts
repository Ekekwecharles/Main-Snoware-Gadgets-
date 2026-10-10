import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { descendantIds, getAllCategories } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["/", "/shop", "/used", "/about", "/contact", "/store", "/trade-in", "/warranty", "/faq", "/shipping", "/app", "/policies/terms", "/policies/refund", "/policies/privacy"];
  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({ url: absoluteUrl(p), changeFrequency: "weekly", priority: p === "/" ? 1 : 0.5 }));

  try {
    const [cats, prods] = await Promise.all([
      getAllCategories(),
      db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.isActive, true)),
    ]);
    const pathFor = (id: number): string => {
      const c = cats.find((x) => x.id === id)!;
      return c.parentId ? `${pathFor(c.parentId)}/${c.slug}` : c.slug;
    };
    for (const c of cats) if (descendantIds(cats, c.id).length) entries.push({ url: absoluteUrl(`/c/${pathFor(c.id)}`), changeFrequency: "daily", priority: 0.7 });
    for (const p of prods) entries.push({ url: absoluteUrl(`/p/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "daily", priority: 0.8 });
  } catch {
    // Database unavailable at build time — static pages are still listed.
  }
  return entries;
}
