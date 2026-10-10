import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, or } from "drizzle-orm";
import { ChevronRight, Package } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { isAwaitingTransfer, isVisibleToCustomer, orderStatusText } from "@/lib/order-status";
import { cn, formatNaira } from "@/lib/utils";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

export default async function AccountOrdersPage() {
  const session = await auth();
  const user = session!.user;
  // Include guest orders placed with the same (verified) email before the account existed.
  const list = await db.query.orders.findMany({
    where: or(eq(orders.userId, user.id), eq(orders.email, user.email!.toLowerCase())),
    orderBy: [desc(orders.createdAt)],
    with: { items: true },
  });
  const visible = list.filter(isVisibleToCustomer);

  if (!visible.length)
    return (
      <div className="flex flex-col items-center rounded-3xl bg-mist px-6 py-16 text-center">
        <Package className="h-10 w-10 text-muted" />
        <p className="mt-4 text-[18px] font-semibold">No orders yet</p>
        <p className="mt-1 text-muted">When you place an order, you'll be able to track it here.</p>
        <Link href="/shop" className="mt-6 rounded-full bg-ink px-6 py-3 font-semibold text-white">Start shopping</Link>
      </div>
    );

  return (
    <ul className="space-y-3">
      {visible.map((o) => (
        <li key={o.id}>
          <Link href={`/order/${o.reference}`} className="flex flex-wrap items-center gap-4 rounded-2xl p-5 ring-1 ring-line transition hover:shadow-card hover:ring-transparent">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[14px] font-semibold">{o.reference}</p>
              <p className="mt-0.5 text-[13.5px] text-muted">
                {o.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} · {o.items.reduce((n, i) => n + i.quantity, 0)} item(s)
              </p>
              <p className="mt-1 line-clamp-1 text-[14px]">{o.items.map((i) => i.name).join(", ")}</p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-[12.5px] font-semibold",
                isAwaitingTransfer(o) ? "bg-amber-50 text-amber-700" : o.status === "delivered" ? "bg-emerald-50 text-success" : o.status === "cancelled" ? "bg-brand-50 text-brand-700" : "bg-sky/10 text-sky",
              )}
            >
              {orderStatusText(o)}
            </span>
            <span className="text-[16px] font-bold">{formatNaira(o.total)}</span>
            <ChevronRight className="h-5 w-5 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
