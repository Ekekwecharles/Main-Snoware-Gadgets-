import "server-only";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { orders, users, type Order, type OrderItem } from "@/db/schema";
import { statusLabels } from "@/lib/order-status";

export function serializeOrder(o: Order & { items: OrderItem[] }) {
  return {
    reference: o.reference,
    status: o.status,
    statusLabel: statusLabels[o.status] ?? o.status,
    paymentStatus: o.paymentStatus,
    deliveryMethod: o.deliveryMethod,
    fullName: o.fullName,
    email: o.email,
    phone: o.phone,
    zoneName: o.zoneName,
    addressLine: o.addressLine,
    city: o.city,
    state: o.state,
    notes: o.notes,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    createdAt: o.createdAt.toISOString(),
    paidAt: o.paidAt?.toISOString() ?? null,
    items: o.items.map((i) => ({
      name: i.name,
      variantLabel: i.variantLabel,
      image: i.image,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      onOrder: i.onOrder,
    })),
  };
}

/** Same rule as the website's account page: the user's orders plus guest orders placed with their email. */
export async function listUserOrders(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return [];
  const list = await db.query.orders.findMany({
    where: or(eq(orders.userId, user.id), eq(orders.email, user.email.toLowerCase())),
    orderBy: [desc(orders.createdAt)],
    with: { items: true },
  });
  return list.filter((o) => o.paymentStatus === "paid" || o.status === "cancelled").map(serializeOrder);
}
