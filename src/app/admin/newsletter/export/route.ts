import { desc } from "drizzle-orm";
import { requireAdmin } from "@/auth";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

export async function GET() {
  if (!(await requireAdmin())) return new Response("Not authorised", { status: 401 });
  const subs = await db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt));
  const csv = ["email,subscribed_at", ...subs.map((s) => `${s.email},${s.createdAt.toISOString()}`)].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="snoware-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
