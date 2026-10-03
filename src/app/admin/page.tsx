import Link from "next/link";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { AlertTriangle, ArrowRight, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { db } from "@/db";
import { orderItems, orders, users } from "@/db/schema";
import { Card, PageHeader, StatusPill } from "@/components/admin/ui";
import { formatNaira } from "@/lib/utils";

export const dynamic = "force-dynamic";

function dateRanges() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  return { since30: new Date(now.getTime() - 30 * 86_400_000), startOfDay };
}

export default async function AdminDashboard() {
  const { since30, startOfDay } = dateRanges();

  const [[revenue30], [today], [toFulfil], [customerCount], recent, toSource] = await Promise.all([
    db
      .select({ total: sql<number>`coalesce(sum(${orders.total}),0)::int`, count: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, since30))),
    db
      .select({ total: sql<number>`coalesce(sum(${orders.total}),0)::int`, count: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(eq(orders.paymentStatus, "paid"), gte(orders.createdAt, startOfDay))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(eq(orders.paymentStatus, "paid"), sql`${orders.status} in ('paid','processing')`)),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "customer")),
    db.query.orders.findMany({ where: eq(orders.paymentStatus, "paid"), orderBy: [desc(orders.createdAt)], limit: 8 }),
    // "On order" items in paid orders that haven't shipped yet — what still needs buying from vendors.
    db
      .select({
        id: orderItems.id,
        name: orderItems.name,
        variantLabel: orderItems.variantLabel,
        quantity: orderItems.quantity,
        orderId: orders.id,
        reference: orders.reference,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(eq(orderItems.onOrder, true), eq(orders.paymentStatus, "paid"), sql`${orders.status} in ('paid','processing')`))
      .orderBy(orders.createdAt)
      .limit(12),
  ]);

  const stats = [
    { label: "Revenue (30 days)", value: formatNaira(revenue30.total), sub: `${revenue30.count} paid orders`, icon: TrendingUp, tone: "bg-emerald-50 text-success" },
    { label: "Today", value: formatNaira(today.total), sub: `${today.count} orders today`, icon: ShoppingCart, tone: "bg-sky/10 text-sky" },
    { label: "To fulfil", value: String(toFulfil.count), sub: "Paid, not yet shipped", icon: Package, tone: "bg-amber-50 text-amber-700" },
    { label: "Customers", value: String(customerCount.count), sub: "Registered accounts", icon: Users, tone: "bg-violet-50 text-violet-700" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Here's how Snoware Gadgets is doing." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="flex items-start justify-between">
              <p className="text-[13.5px] font-medium text-muted">{s.label}</p>
              <span className={`rounded-xl p-2 ${s.tone}`}><s.icon className="h-4.5 w-4.5" /></span>
            </div>
            <p className="mt-3 font-display text-[26px] font-extrabold">{s.value}</p>
            <p className="text-[13px] text-muted">{s.sub}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[17px] font-bold">Recent orders</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-sky hover:underline">View all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {recent.length ? (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[520px] text-[14px]">
                <thead>
                  <tr className="text-left text-[12px] text-muted uppercase">
                    <th className="px-2 py-2 font-semibold">Order</th>
                    <th className="px-2 py-2 font-semibold">Customer</th>
                    <th className="px-2 py-2 font-semibold">Status</th>
                    <th className="px-2 py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recent.map((o) => (
                    <tr key={o.id} className="hover:bg-mist/60">
                      <td className="px-2 py-3"><Link href={`/admin/orders/${o.id}`} className="font-mono text-[13px] font-semibold hover:underline">{o.reference}</Link></td>
                      <td className="px-2 py-3">{o.fullName}</td>
                      <td className="px-2 py-3"><StatusPill status={o.status} /></td>
                      <td className="px-2 py-3 text-right font-semibold">{formatNaira(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-muted">No paid orders yet. They'll appear here as soon as customers check out.</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-1 flex items-center gap-2 text-[17px] font-bold"><AlertTriangle className="h-4.5 w-4.5 text-amber-600" /> To source from vendors</h2>
          <p className="mb-3 text-[12.5px] text-muted">“Available on order” items in paid orders that haven&apos;t shipped yet.</p>
          {toSource.length ? (
            <ul className="divide-y divide-line">
              {toSource.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/admin/orders/${item.orderId}`} className="min-w-0 hover:underline">
                    <p className="truncate text-[14px] font-medium">{item.name}</p>
                    <p className="truncate text-[12.5px] text-muted">
                      {[item.variantLabel, item.reference].filter(Boolean).join(" · ")}
                    </p>
                  </Link>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-[12px] font-bold text-amber-800">× {item.quantity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-muted">Nothing to source right now.</p>
          )}
        </Card>
      </div>
    </>
  );
}
