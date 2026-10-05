import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { products, wishlist } from "@/db/schema";
import { listProducts } from "@/lib/catalog";

/** Adds or removes a product from the user's wishlist. Returns true when it is now saved. */
export async function toggleWishlistItem(userId: string, productId: number) {
  const where = and(eq(wishlist.userId, userId), eq(wishlist.productId, productId));
  const existing = await db.query.wishlist.findFirst({ where });
  if (existing) await db.delete(wishlist).where(where);
  else await db.insert(wishlist).values({ userId, productId });
  return !existing;
}

export async function getWishlistCards(userId: string) {
  const saved = await db.select({ productId: wishlist.productId }).from(wishlist).where(eq(wishlist.userId, userId));
  const ids = saved.map((s) => s.productId);
  if (!ids.length) return [];
  const rows = await db.select({ categoryId: products.categoryId }).from(products).where(inArray(products.id, ids));
  const { cards } = await listProducts({ categoryIds: [...new Set(rows.map((r) => r.categoryId))], filters: {} });
  return cards.filter((c) => ids.includes(c.id));
}
