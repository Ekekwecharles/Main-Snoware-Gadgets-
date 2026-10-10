import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryPath, listProducts } from "@/lib/catalog";
import { ListingView, parseFilters } from "@/components/listing/listing-view";

export async function generateMetadata(props: PageProps<"/c/[...slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const path = await getCategoryPath(slug);
  if (!path) return {};
  return {
    title: `${path.current.name} Prices in Nigeria — New & Used`,
    description:
      path.current.description ??
      `Shop ${path.current.name} in Port Harcourt at Snoware Gadgets — new and UK-used, genuine devices with warranty, same-day delivery in Port Harcourt and fast delivery across Nigeria.`,
    // Filtered/sorted URLs (?sort=…, ?condition=…) all point Google at the plain category page.
    alternates: { canonical: `/c/${slug.join("/")}` },
  };
}

export default async function CategoryPage(props: PageProps<"/c/[...slug]">) {
  const [{ slug }, sp] = await Promise.all([props.params, props.searchParams]);
  const path = await getCategoryPath(slug);
  if (!path) notFound();

  const filters = parseFilters(sp);
  const { cards, facets } = await listProducts({ categoryIds: path.ids, filters });

  const crumbs = path.trail.map((c, i) => ({
    label: c.name,
    href: `/c/${slug.slice(0, i + 1).join("/")}`,
  }));

  return (
    <ListingView
      title={path.current.name}
      description={path.current.description}
      crumbs={crumbs}
      cards={cards}
      facets={facets}
      filters={filters}
      subcategories={path.children.map((c) => ({ name: c.name, slug: c.slug, href: `/c/${[...slug, c.slug].join("/")}` }))}
    />
  );
}
