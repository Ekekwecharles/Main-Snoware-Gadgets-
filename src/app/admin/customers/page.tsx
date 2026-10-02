import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { Card, PageHeader } from "@/components/admin/ui";
import { formatNaira } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      verified: users.emailVerified,
      createdAt: users.createdAt,
      orderCount: sql<number>`count(${orders.id}) filter (where ${orders.paymentStatus} = 'paid')::int`,
      spent: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.paymentStatus} = 'paid'), 0)::int`,
    })
    .from(users)
    .leftJoin(orders, eq(orders.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
    .limit(500);

  return (
    <>
      <PageHeader title="Customers" description={`${rows.length} registered accounts`} />
      <Card className="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[14px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-muted uppercase">
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Orders</th>
                <th className="px-4 py-3 text-right font-semibold">Total spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-mist/60">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {u.name ?? "—"} {u.role === "admin" && <span className="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">Admin</span>}
                    </p>
                    <p className="text-[12.5px] text-muted">{u.email} {!u.verified && "· unverified"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{u.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{u.createdAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}</td>
                  <td className="px-4 py-3">{u.orderCount}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatNaira(u.spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="p-10 text-center text-muted">No customers yet.</p>}
        </div>
      </Card>
    </>
  );
}
