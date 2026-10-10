/**
 * Fills product descriptions from content/*.json files in this folder:
 *   { "<slug>": { "short": "...", "description": "...", "highlights": ["..."], "specs": [["Label", "Value"], ...] } }
 * Only empty fields are filled, so text edited in admin is never overwritten.
 *
 *   npx tsx scripts/catalog-import/apply-content.ts            – dry run: shows what would be filled
 *   npx tsx scripts/catalog-import/apply-content.ts --apply
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

type Content = { short?: string; description?: string; highlights?: string[]; specs?: [string, string][] };
const APPLY = process.argv.includes("--apply");
const dir = join("scripts", "catalog-import", "content");

async function main() {
  const content: Record<string, Content> = {};
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) Object.assign(content, JSON.parse(readFileSync(join(dir, f), "utf-8")));

  const { db } = await import("../../src/db");
  const { products } = await import("../../src/db/schema");
  const { eq, inArray } = await import("drizzle-orm");
  const rows = await db.select().from(products).where(inArray(products.slug, Object.keys(content)));
  const missing = Object.keys(content).filter((s) => !rows.some((r) => r.slug === s));
  if (missing.length) console.log(`⚠ No product with slug: ${missing.join(", ")}`);

  let changed = 0;
  for (const p of rows) {
    const c = content[p.slug];
    if (c.short && c.short.length > 400) throw new Error(`${p.slug}: short description is over 400 characters`);
    const set: Partial<typeof products.$inferInsert> = {};
    if (!p.shortDescription && c.short) set.shortDescription = c.short;
    if (!p.description && c.description) set.description = c.description;
    if (!p.highlights.length && c.highlights?.length) set.highlights = c.highlights;
    if (!p.specs.length && c.specs?.length) set.specs = c.specs.map(([label, value]) => ({ label, value }));
    if (!Object.keys(set).length) continue;
    changed++;
    console.log(`${APPLY ? "fill" : "would fill"}  ${p.slug}: ${Object.keys(set).join(", ")}`);
    if (APPLY) await db.update(products).set({ ...set, updatedAt: new Date() }).where(eq(products.id, p.id));
  }
  console.log(`\n${changed} product(s) ${APPLY ? "updated" : "would be updated"}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
