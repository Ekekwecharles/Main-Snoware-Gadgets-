/**
 * Removes a product the same way the admin "Delete" button does: deleted (with its Cloudinary photos)
 * if it has never been ordered, otherwise hidden so order history stays intact.
 *   npx tsx scripts/catalog-import/remove-product.ts <slug>
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

async function main() {
  const slug = process.argv[2];
  if (!slug) throw new Error("Usage: remove-product.ts <slug>");
  const { db } = await import("../../src/db");
  const { productImages, products } = await import("../../src/db/schema");
  const { eq, sql } = await import("drizzle-orm");
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const product = await db.query.products.findFirst({ where: eq(products.slug, slug) });
  if (!product) throw new Error(`No product with slug "${slug}"`);
  const imgs = await db.select().from(productImages).where(eq(productImages.productId, product.id));
  const [{ count }] = await db
    .execute<{ count: number }>(sql`select count(*)::int as count from order_items where product_id = ${product.id}`)
    .then((r) => r.rows);
  if (count > 0) {
    await db.update(products).set({ isActive: false }).where(eq(products.id, product.id));
    console.log(`"${product.name}" has ${count} order line(s) — hidden instead of deleted.`);
  } else {
    await db.delete(products).where(eq(products.id, product.id));
    for (const i of imgs) if (i.publicId) await cloudinary.uploader.destroy(i.publicId).catch(() => undefined);
    console.log(`Deleted "${product.name}" and ${imgs.length} photo(s).`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
