import Link from "next/link";
import { desc, ilike } from "drizzle-orm";
import { Plus, Search } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { buttonClass, Card, inputClass, PageHeader } from "@/components/admin/ui";
import { ProductImage } from "@/components/product/product-image";
import { formatNaira } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };

export default async function AdminProductsPage(props: PageProps<"/admin/products">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const list = await db.query.products.findMany({
    where: q ? ilike(products.name, `%${q}%`) : undefined,
    orderBy: [desc(products.updatedAt)],
    with: { variants: true, images: { limit: 1, orderBy: (i, { asc }) => [asc(i.sortOrder)] }, category: true },
  });

  return (
    <>
      <PageHeader
        title="Products"
        description={`${list.length} products`}
        actions={
          <Link href="/admin/products/new" className={buttonClass}>
            <Plus className="h-4 w-4" /> Add product
          </Link>
        }
      />
      <Card className="p-0 sm:p-0">
        <form className="border-b border-line p-4">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder="Search products…" className={`${inputClass} pl-10`} />
          </div>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[14px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] text-muted uppercase">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Availability</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((p) => {
                const prices = p.variants.map((v) => v.price);
                // A variant whose optional quantity hit 0 counts as sold out, whatever its availability says.
                const status = (v: (typeof p.variants)[number]) => (v.stock === 0 ? "sold_out" : v.availability);
                const count = (a: string) => p.variants.filter((v) => status(v) === a).length;
                const [inStock, onOrder, soldOut] = [count("in_stock"), count("on_order"), count("sold_out")];
                const tracked = p.variants.filter((v) => v.stock != null && v.stock > 0);
                const qtyLeft = tracked.reduce((n, v) => n + (v.stock ?? 0), 0);
                return (
                  <tr key={p.id} className="hover:bg-mist/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-mist">
                          <ProductImage src={p.images[0]?.url} alt={p.name} categorySlug={p.category.slug} sizes="44px" />
                        </span>
                        <span>
                          <span className="block font-semibold hover:underline">{p.name}</span>
                          <span className="text-[12.5px] text-muted">{p.variants.length} variant(s){!p.images.length && " · no photos"}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{p.category.name}</td>
                    <td className="px-4 py-3">{prices.length ? (Math.min(...prices) === Math.max(...prices) ? formatNaira(prices[0]) : `${formatNaira(Math.min(...prices))} – ${formatNaira(Math.max(...prices))}`) : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 text-[12px] font-semibold">
                        {inStock > 0 && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-success">{inStock} in stock</span>}
                        {onOrder > 0 && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">{onOrder} on order</span>}
                        {soldOut > 0 && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-brand-700">{soldOut} sold out</span>}
                      </div>
                      {tracked.length > 0 && <p className="mt-1 text-[12px] text-muted">{qtyLeft} units left (limited variants)</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${p.isActive ? "bg-emerald-50 text-success" : "bg-mist text-muted"}`}>{p.isActive ? "Live" : "Hidden"}</span>
                      {p.featured && <span className="ml-1.5 rounded-full bg-sky/10 px-2.5 py-0.5 text-[12px] font-semibold text-sky">Featured</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!list.length && <p className="p-10 text-center text-muted">No products found.</p>}
        </div>
      </Card>
    </>
  );
}
