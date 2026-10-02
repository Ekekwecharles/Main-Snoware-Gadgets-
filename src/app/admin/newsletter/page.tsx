import { desc } from "drizzle-orm";
import { Download } from "lucide-react";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { buttonClass, Card, PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Newsletter" };

export default async function AdminNewsletterPage() {
  const subs = await db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt));
  return (
    <>
      <PageHeader
        title="Newsletter subscribers"
        description={`${subs.length} people signed up from the footer form.`}
        actions={
          <a href="/admin/newsletter/export" className={buttonClass}>
            <Download className="h-4 w-4" /> Export CSV
          </a>
        }
      />
      <Card className="p-0 sm:p-0">
        <ul className="divide-y divide-line">
          {subs.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-5 py-3 text-[14px]">
              <span>{s.email}</span>
              <span className="text-muted">{s.createdAt.toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>
            </li>
          ))}
        </ul>
        {!subs.length && <p className="p-10 text-center text-muted">No subscribers yet.</p>}
      </Card>
    </>
  );
}
