import type { Metadata } from "next";
import { getAllCategories, listProducts } from "@/lib/catalog";
import { ListingView, parseFilters } from "@/components/listing/listing-view";

export const metadata: Metadata = {
  title: "Shop All Gadgets",
  description: "Browse every phone, laptop, console, speaker and accessory at Snoware Gadgets.",
};

export default async function ShopPage(props: PageProps<"/shop">) {
  const sp = await props.searchParams;
  const filters = parseFilters(sp);
  const [{ cards, facets }, categories] = await Promise.all([listProducts({ filters }), getAllCategories()]);
  const top = categories.filter((c) => !c.parentId);

  return (
    <ListingView
      title={filters.q ? `Results for “${filters.q}”` : "Shop all gadgets"}
      description={filters.q ? null : "Every device we stock — new and used — in one place."}
      crumbs={[{ label: filters.q ? "Search" : "Shop all", href: "/shop" }]}
      cards={cards}
      facets={facets}
      filters={filters}
      subcategories={filters.q ? undefined : top.map((c) => ({ name: c.name, slug: c.slug, href: `/c/${c.slug}` }))}
    />
  );
}
