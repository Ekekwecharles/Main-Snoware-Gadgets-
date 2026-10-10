/**
 * Uploads official product photos listed in product-images.json ({ "<product slug>": ["<image url>", ...] })
 * to Cloudinary and attaches them to the products. Products that already have photos are skipped.
 *
 *   npx tsx scripts/catalog-import/upload-images.ts             – upload missing photos
 *   npx tsx scripts/catalog-import/upload-images.ts --check     – only check every URL downloads as an image
 *   npx tsx scripts/catalog-import/upload-images.ts --activate  – also show hidden products that now have photos
 *   npx tsx scripts/catalog-import/upload-images.ts --redo a,b  – replace the photos of products a and b
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { readFileSync } from "node:fs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
const CHECK = process.argv.includes("--check");
const ACTIVATE = process.argv.includes("--activate");
const redoArg = process.argv.indexOf("--redo");
const REDO = new Set(redoArg > 0 ? process.argv[redoArg + 1].split(",") : []);
const MIN_BYTES = 5_000; // anything smaller is an icon or an error page (white-background JPEGs can be ~8KB)

/** Recognises PNG, JPEG, WebP, GIF and AVIF by their first bytes — some hosts label images as octet-stream. */
function looksLikeImage(b: Buffer) {
  const ascii = b.subarray(0, 12).toString("latin1");
  return (
    ascii.startsWith("\x89PNG") ||
    (b[0] === 0xff && b[1] === 0xd8) ||
    (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") ||
    ascii.startsWith("GIF8") ||
    ascii.slice(4, 8) === "ftyp"
  );
}

async function download(url: string) {
  // Ask for PNG/JPEG: image CDNs (Samsung's) otherwise send heavily compressed AVIF.
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "image/png,image/jpeg;q=0.9,image/*;q=0.5", referer: new URL(url).origin + "/" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (!looksLikeImage(bytes)) throw new Error(`not an image (${res.headers.get("content-type")})`);
  if (bytes.length < MIN_BYTES) throw new Error(`too small (${bytes.length} bytes)`);
  return bytes;
}

async function main() {
  const wanted: Record<string, string[]> = JSON.parse(readFileSync("scripts/catalog-import/product-images.json", "utf-8"));
  const { db } = await import("../../src/db");
  const { productImages, products } = await import("../../src/db/schema");
  const { eq, inArray } = await import("drizzle-orm");
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const all = await db.query.products.findMany({ where: inArray(products.slug, Object.keys(wanted)), with: { images: true } });
  const missing = Object.keys(wanted).filter((s) => !all.some((p) => p.slug === s));
  if (missing.length) console.log(`⚠ No product with slug: ${missing.join(", ")}`);

  let uploaded = 0;
  const failed: string[] = [];
  for (const p of all) {
    if (!CHECK && REDO.has(p.slug) && p.images.length) {
      await db.delete(productImages).where(eq(productImages.productId, p.id));
      for (const i of p.images) if (i.publicId) await cloudinary.uploader.destroy(i.publicId).catch(() => undefined);
      p.images = [];
    }
    if (!CHECK && p.images.length) continue;
    let sort = 0;
    for (const url of wanted[p.slug]) {
      try {
        const bytes = await download(url);
        if (CHECK) {
          console.log(`ok   ${p.slug}  ${Math.round(bytes.length / 1024)}KB  ${url}`);
          continue;
        }
        const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) =>
          cloudinary.uploader
            .upload_stream({ folder: "snoware/products", resource_type: "image" }, (err, r) => (err || !r ? reject(err ?? new Error("upload failed")) : resolve(r)))
            .end(bytes),
        );
        await db.insert(productImages).values({ productId: p.id, url: result.secure_url, publicId: result.public_id, alt: p.name, sortOrder: sort++ });
        uploaded++;
        console.log(`up   ${p.slug}  ${url}`);
      } catch (e) {
        failed.push(`${p.slug}  ${url}  — ${(e as Error).message}`);
        console.log(`FAIL ${p.slug}  ${url}  — ${(e as Error).message}`);
      }
    }
  }

  if (ACTIVATE && !CHECK) {
    const withPhotos = await db.query.products.findMany({ where: eq(products.isActive, false), with: { images: true } });
    const ready = withPhotos.filter((p) => p.images.length && wanted[p.slug]);
    for (const p of ready) await db.update(products).set({ isActive: true, updatedAt: new Date() }).where(eq(products.id, p.id));
    console.log(`Activated ${ready.length} product(s).`);
  }
  console.log(`\n${CHECK ? "Checked" : "Uploaded"} — ${uploaded} uploaded, ${failed.length} failed.`);
  if (failed.length) console.log(failed.join("\n"));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
