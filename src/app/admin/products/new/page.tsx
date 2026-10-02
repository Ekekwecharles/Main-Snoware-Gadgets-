import { getAllCategories, getBrands } from "@/lib/catalog";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([getAllCategories(), getBrands()]);
  return (
    <>
      <PageHeader title="Add product" description="Add photos, details and variants, then press Create product." />
      <ProductForm categories={categories} brands={brands} />
    </>
  );
}
