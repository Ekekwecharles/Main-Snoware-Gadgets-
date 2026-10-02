import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getAllCategories, getBrands } from "@/lib/catalog";
import { PageHeader, secondaryButtonClass } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  const { id } = await props.params;
  const product = await db.query.products.findFirst({
    where: eq(products.id, Number(id)),
    with: { variants: { orderBy: (v, { asc }) => [asc(v.id)] }, images: { orderBy: (i, { asc }) => [asc(i.sortOrder)] } },
  });
  if (!product) notFound();
  const [categories, brands] = await Promise.all([getAllCategories(), getBrands()]);

  return (
    <>
      <PageHeader
        title={product.name}
        description={product.isActive ? "Live on the store" : "Hidden from the store"}
        actions={
          <Link href={`/p/${product.slug}`} target="_blank" className={secondaryButtonClass}>
            <ExternalLink className="h-4 w-4" /> View on store
          </Link>
        }
      />
      {/* Keyed on updatedAt so the form re-initialises from fresh data after each save. */}
      <ProductForm
        key={product.updatedAt.toISOString()}
        categories={categories}
        brands={brands}
        product={product}
        images={product.images.map((i) => ({ id: i.id, url: i.url, publicId: i.publicId }))}
      />
    </>
  );
}
