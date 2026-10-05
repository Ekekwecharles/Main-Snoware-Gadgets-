import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, carts, productVariants } from "@/db/schema";
import { isPurchasable, variantLabel } from "@/lib/catalog";
import { cartChannel, getPusher } from "@/lib/pusher";
import { maxOrderQty } from "@/lib/site";
import type { CartItem, CartSnapshot, CartUpdatedEvent } from "@/lib/cart-types";

/**
 * Server-side cart for signed-in users. The website and the mobile app both read and write it
 * through /api/cart, and every change is pushed to the user's other devices over Pusher.
 */

export async function getCart(userId: string): Promise<CartSnapshot> {
  const [rows, cart] = await Promise.all([
    db.query.cartItems.findMany({
      where: eq(cartItems.userId, userId),
      orderBy: (c, { asc }) => [asc(c.createdAt)],
      with: {
        variant: {
          with: { product: { with: { category: true, images: { orderBy: (img, { asc }) => [asc(img.sortOrder)], limit: 1 } } } },
        },
      },
    }),
    db.query.carts.findFirst({ where: eq(carts.userId, userId) }),
  ]);

  const items: CartItem[] = rows
    .filter((r) => r.variant.product.isActive)
    .map(({ variant: v, quantity }) => ({
      variantId: v.id,
      productId: v.productId,
      slug: v.product.slug,
      name: v.product.name,
      variantLabel: variantLabel(v),
      image: v.product.images[0]?.url ?? null,
      categorySlug: v.product.category.slug,
      price: v.price,
      quantity: Math.min(quantity, maxOrderQty(v.stock)),
      onOrder: v.availability === "on_order",
      stock: v.stock,
    }));
  return { items, notes: cart?.notes ?? "" };
}

async function loadVariant(variantId: number) {
  return db.query.productVariants.findFirst({ where: eq(productVariants.id, variantId), with: { product: true } });
}

export type CartError = { error: string; status: number };

async function buyableVariant(variantId: number): Promise<CartError | NonNullable<Awaited<ReturnType<typeof loadVariant>>>> {
  const v = await loadVariant(variantId);
  if (!v || !v.product.isActive) return { error: "This item is no longer available.", status: 404 };
  if (!isPurchasable(v)) return { error: "This item is sold out.", status: 409 };
  return v;
}

/** Adds to the existing quantity (like tapping "Add to cart" again). */
export async function addItem(userId: string, variantId: number, quantity: number) {
  const v = await buyableVariant(variantId);
  if ("error" in v) return v;
  const max = maxOrderQty(v.stock);
  await db
    .insert(cartItems)
    .values({ userId, variantId, quantity: Math.min(quantity, max) })
    .onConflictDoUpdate({
      target: [cartItems.userId, cartItems.variantId],
      set: { quantity: sql`LEAST(${cartItems.quantity} + ${quantity}, ${max})` },
    });
  return null;
}

/** Sets an exact quantity; 0 removes the line. */
export async function setItemQuantity(userId: string, variantId: number, quantity: number) {
  if (quantity <= 0) return removeItem(userId, variantId);
  const v = await loadVariant(variantId);
  if (!v || !v.product.isActive) return { error: "This item is no longer available.", status: 404 };
  const qty = Math.min(quantity, maxOrderQty(v.stock));
  if (qty <= 0) return removeItem(userId, variantId);
  await db
    .insert(cartItems)
    .values({ userId, variantId, quantity: qty })
    .onConflictDoUpdate({ target: [cartItems.userId, cartItems.variantId], set: { quantity: qty } });
  return null;
}

export async function removeItem(userId: string, variantId: number) {
  await db.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.variantId, variantId)));
  return null;
}

export async function clearCart(userId: string) {
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
  await db.update(carts).set({ notes: "", updatedAt: new Date() }).where(eq(carts.userId, userId));
}

export async function setNotes(userId: string, notes: string) {
  await db
    .insert(carts)
    .values({ userId, notes })
    .onConflictDoUpdate({ target: carts.userId, set: { notes, updatedAt: new Date() } });
}

/**
 * Merges a guest cart (from the browser or the app before signing in) into the account cart.
 * Per variant, the larger quantity wins so re-merging the same cart never doubles it.
 */
export async function mergeCart(userId: string, lines: { variantId: number; quantity: number }[], notes?: string) {
  if (lines.length) {
    const variants = await db.query.productVariants.findMany({
      where: inArray(productVariants.id, lines.map((l) => l.variantId)),
      with: { product: true },
    });
    const values = lines.flatMap((l) => {
      const v = variants.find((x) => x.id === l.variantId);
      if (!v || !v.product.isActive || !isPurchasable(v)) return [];
      return [{ userId, variantId: v.id, quantity: Math.min(l.quantity, maxOrderQty(v.stock)) }];
    });
    if (values.length)
      await db
        .insert(cartItems)
        .values(values)
        .onConflictDoUpdate({
          target: [cartItems.userId, cartItems.variantId],
          set: { quantity: sql`GREATEST(${cartItems.quantity}, excluded.quantity)` },
        });
  }
  if (notes) {
    const existing = await db.query.carts.findFirst({ where: eq(carts.userId, userId) });
    if (!existing?.notes) await setNotes(userId, notes);
  }
}

/** Pusher rejects payloads over 10KB; beyond that, clients are told to refetch instead. */
const MAX_EVENT_BYTES = 9000;

/** Tells every signed-in device that the cart changed, and returns the fresh cart for the caller. */
export async function publishCart(userId: string, origin: string | null) {
  const cart = await getCart(userId);
  const pusher = getPusher();
  if (pusher) {
    let event: CartUpdatedEvent = { origin, cart };
    if (Buffer.byteLength(JSON.stringify(event)) > MAX_EVENT_BYTES) event = { origin };
    await pusher.trigger(cartChannel(userId), "cart-updated", event).catch((err) => console.error("[pusher] trigger failed", err));
  }
  return cart;
}
