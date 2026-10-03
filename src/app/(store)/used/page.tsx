import type { Metadata } from "next";
import { listProducts } from "@/lib/catalog";
import { ListingView, parseFilters } from "@/components/listing/listing-view";
import { conditionLabel } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pre-owned Phones — Boxed, Open Box, UK, US & Nigerian Used",
  description: "Inspected, graded pre-owned iPhones, Samsung, Pixel and more — Boxed (like new), Open Box, UK-used, US-used and Nigerian-used — with warranty at Snoware Gadgets.",
};

export default async function UsedPage(props: PageProps<"/used">) {
  const sp = await props.searchParams;
  const filters = { ...parseFilters(sp), usedOnly: true };
  const { cards, facets } = await listProducts({ filters });
  const single = filters.condition?.length === 1 ? conditionLabel(filters.condition[0]) : null;

  return (
    <ListingView
      title={single ? `${single} devices` : "Pre-owned phones & devices"}
      description="From Boxed (brand-new condition, 100% battery) and Open Box to UK, US and Nigerian used — every device is checked for battery health, Face ID / fingerprint, cameras, speakers and screen before sale, and covered by our warranty."
      crumbs={[{ label: "Pre-owned", href: "/used" }]}
      cards={cards}
      facets={{ ...facets, conditions: facets.conditions.filter((c) => c.value !== "new") }}
      filters={filters}
    />
  );
}
