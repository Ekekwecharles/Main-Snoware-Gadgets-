import Link from "next/link";
import { and, count, desc, eq, ilike, isNotNull, ne, or, type SQL } from "drizzle-orm";
import { Search } from "lucide-react";
import { db } from "@/db";
import { orders, orderStatusEnum } from "@/db/schema";
import { Card, inputClass, PageHeader, StatusPill } from "@/components/admin/ui";
import { cn, formatNaira } from "@/lib/utils";
import { statusLabels } from "@/lib/order-status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

const tabs = [
  { value: "transfers", label: "Transfers to confirm" },
  { value: "", label: "All paid" },
  ...orderStatusEnum.enumValues.filter((s) => s !== "pending").map((s) => ({ value: s, label: statusLabels[s] })),
  { value: "unpaid", label: "Unpaid / abandoned" },
];

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  const sp = await props.searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const conds: (SQL | undefined)[] = [];
  if (status === "transfers")
    conds.push(eq(orders.paymentMethod, "bank_transfer"), eq(orders.paymentStatus, "unpaid"), ne(orders.status, "cancelled"));
  else if (status === "unpaid") conds.push(eq(orders.paymentStatus, "unpaid"));
  else {
    conds.push(eq(orders.paymentStatus, "paid"));
    if (status) conds.push(eq(orders.status, status as (typeof orderStatusEnum.enumValues)[number]));
  }
  if (q) conds.push(or(ilike(orders.reference, `%${q}%`), ilike(orders.fullName, `%${q}%`), ilike(orders.email, `%${q}%`), ilike(orders.phone, `%${q}%`)));

  const [list, [{ proofs }]] = await Promise.all([
    db.query.orders.findMany({ where: and(...conds), orderBy: [desc(orders.createdAt)], limit: 200, with: { items: true } }),
    // Transfers with a screenshot waiting — shown as a badge on the tab.
    db
      .select({ proofs: count() })
      .from(orders)
      .where(and(eq(orders.paymentMethod, "bank_transfer"), eq(orders.paymentStatus, "unpaid"), ne(orders.status, "cancelled"), isNotNull(orders.paymentProofAt))),
  ]);

  return (
    <>
      <PageHeader title="Orders" description="Update an order's status to notify the customer by email." />
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={`/admin/orders${t.value ? `?status=${t.value}` : ""}`}
            className={cn("shrink-0 rounded-full px-4 py-2 text-[13.5px] font-medium", status === t.value ? "bg-ink text-white" : "bg-white ring-1 ring-line hover:ring-ink")}
          >
            {t.label}
            {t.value === "transfers" && proofs > 0 && (
              <span className="ml-2 rounded-full bg-orange-500 px-1.5 py-0.5 text-[11px] font-bold text-white">{proofs}</span>
            )}
          </Link>
        ))}
      </div>
      <Card className="p-0 sm:p-0">
        <form className="border-b border-line p-4">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder="Search reference, name, email or phone…" className={`${inputClass} pl-10`} />
          </div>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[14px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-muted uppercase">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Fulfilment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((o) => (
                <tr key={o.id} className="hover:bg-mist/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono text-[13px] font-semibold hover:underline">{o.reference}</Link>
                    <p className="text-[12.5px] text-muted">{o.items.reduce((n, i) => n + i.quantity, 0)} item(s)</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{o.createdAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.fullName}</p>
                    <p className="text-[12.5px] text-muted">{o.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{o.deliveryMethod === "pickup" ? "Pickup" : o.zoneName}</td>
                  <td className="px-4 py-3">
                    <StatusPill
                      status={
                        o.paymentStatus === "paid"
                          ? o.status
                          : o.paymentMethod === "bank_transfer" && o.status !== "cancelled"
                            ? o.paymentProofAt
                              ? "proof_sent"
                              : "awaiting_transfer"
                            : o.status === "cancelled"
                              ? "cancelled"
                              : o.paymentStatus
                      }
                    />
                    <p className="mt-0.5 text-[12px] text-muted">{o.paymentMethod === "bank_transfer" ? "Bank transfer" : "Paystack"}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatNaira(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <p className="p-10 text-center text-muted">No orders here yet.</p>}
        </div>
      </Card>
    </>
  );
}
