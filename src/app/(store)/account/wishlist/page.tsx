import type { Metadata } from "next";
import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { Heart } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { products, wishlist } from "@/db/schema";
import { listProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product/product-card";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const session = await auth();
  const saved = await db.select({ productId: wishlist.productId }).from(wishlist).where(eq(wishlist.userId, session!.user.id));
  const ids = saved.map((s) => s.productId);

  if (!ids.length)
    return (
      <div className="flex flex-col items-center rounded-3xl bg-mist px-6 py-16 text-center">
        <Heart className="h-10 w-10 text-muted" />
        <p className="mt-4 text-[18px] font-semibold">Your wishlist is empty</p>
        <p className="mt-1 text-muted">Tap the heart on any product to save it for later.</p>
        <Link href="/shop" className="mt-6 rounded-full bg-ink px-6 py-3 font-semibold text-white">Browse products</Link>
      </div>
    );

  const rows = await db.select({ categoryId: products.categoryId }).from(products).where(inArray(products.id, ids));
  const { cards } = await listProducts({ categoryIds: [...new Set(rows.map((r) => r.categoryId))], filters: {} });
  const wished = cards.filter((c) => ids.includes(c.id));

  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {wished.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} className="h-full" />
        </li>
      ))}
    </ul>
  );
}
