import "server-only";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, productVariants, products } from "@/db/schema";
import { verifyTransaction } from "@/lib/paystack";
import { sendAdminNewOrderAlert, sendOrderConfirmation } from "@/lib/mail";
import { clearCart, publishCart } from "@/lib/cart";

/**
 * Confirms a Paystack payment and marks the order paid exactly once.
 * Called from both the redirect callback and the webhook — whichever arrives first wins;
 * the conditional UPDATE makes the second call a no-op so stock, sales counts and emails aren't duplicated.
 */
export async function confirmPayment(reference: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.reference, reference) });
  if (!order) return { ok: false as const, reason: "not_found" as const };
  if (order.paymentStatus === "paid") return { ok: true as const, order, alreadyPaid: true };

  const res = await verifyTransaction(reference);
  const tx = res.data;
  if (!res.status || !tx || tx.status !== "success") {
    if (tx && ["failed", "abandoned", "reversed"].includes(tx.status)) {
      await db.update(orders).set({ paymentStatus: "failed" }).where(and(eq(orders.id, order.id), eq(orders.paymentStatus, "unpaid")));
    }
    return { ok: false as const, reason: "not_successful" as const, order };
  }
  // Guard against tampered amounts or currency.
  if (tx.amount !== order.total * 100 || tx.currency !== "NGN") {
    console.error(`[paystack] amount mismatch for ${reference}: got ${tx.amount} ${tx.currency}, expected ${order.total * 100} NGN`);
    return { ok: false as const, reason: "amount_mismatch" as const, order };
  }

  const updated = await db.transaction(async (trx) => {
    const [paid] = await trx
      .update(orders)
      .set({ paymentStatus: "paid", status: "paid", paidAt: tx.paid_at ? new Date(tx.paid_at) : new Date() })
      .where(and(eq(orders.id, order.id), sql`${orders.paymentStatus} <> 'paid'`))
      .returning();
    if (!paid) return null; // another request already confirmed it

    const items = await trx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    for (const item of items) {
      // Decrease the optional quantity only where one is set; NULL (no limit) stays NULL.
      if (item.variantId)
        await trx
          .update(productVariants)
          .set({ stock: sql`GREATEST(${productVariants.stock} - ${item.quantity}, 0)` })
          .where(and(eq(productVariants.id, item.variantId), isNotNull(productVariants.stock)));
      if (item.productId)
        await trx
          .update(products)
          .set({ salesCount: sql`${products.salesCount} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
    }
    return { paid, items };
  });

  if (!updated) {
    const fresh = await db.query.orders.findFirst({ where: eq(orders.id, order.id) });
    return { ok: true as const, order: fresh ?? order, alreadyPaid: true };
  }

  // The order is paid, so empty the shopper's account cart on every device (website and app).
  if (updated.paid.userId) {
    const userId = updated.paid.userId;
    await clearCart(userId)
      .then(() => publishCart(userId, null))
      .catch((err) => console.error("[orders] clearing cart failed", err));
  }

  await Promise.all([sendOrderConfirmation(updated.paid, updated.items), sendAdminNewOrderAlert(updated.paid, updated.items)]);
  return { ok: true as const, order: updated.paid, alreadyPaid: false };
}

export async function getOrderByReference(reference: string) {
  return db.query.orders.findFirst({
    where: eq(orders.reference, reference),
    with: { items: true },
  });
}
