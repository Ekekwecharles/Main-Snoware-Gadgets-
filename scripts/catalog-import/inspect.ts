/**
 * Read-only: prints the catalogue currently in the database (categories, brands, products and their options).
 *   npx tsx scripts/catalog-import/inspect.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

async function main() {
  const { db } = await import("../../src/db");
  console.log("DB host:", new URL(process.env.DATABASE_URL!).host);
  const cats = await db.query.categories.findMany();
  const brands = await db.query.brands.findMany();
  console.log("CATEGORIES:", cats.map((c) => `${c.id}:${c.slug}${c.parentId ? `<${c.parentId}` : ""}`).join(", "));
  console.log("BRANDS:", brands.map((b) => `${b.id}:${b.name}`).join(", "));
  const prods = await db.query.products.findMany({ with: { variants: true, images: true, category: true } });
  for (const p of prods) {
    console.log(
      `#${p.id} [${p.category.slug}] ${p.name} (${p.slug}) active=${p.isActive} imgs=${p.images.length} :: ` +
        p.variants.map((v) => `${v.condition}/${v.storage ?? "-"}/${v.color ?? "-"}=${v.price}/${v.availability}`).join("; "),
    );
  }
  process.exit(0);
}
main();
