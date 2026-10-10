/**
 * Imports data/price-list.json (made by parse_price_list.py) into the catalogue.
 *
 *   npx tsx scripts/catalog-import/import.ts          – dry run: writes data/import-plan.txt, changes nothing
 *   npx tsx scripts/catalog-import/import.ts --apply  – applies the plan to the database
 *
 * Rules (agreed with Snow, 2026-10-08):
 * - Same model in different conditions = one product with several options (variants).
 * - Existing products: matching options get the sheet price and go in stock; a sheet option with no
 *   storage/colour updates every existing option of that condition; options not in the sheet become
 *   sold out (never deleted). Photos, descriptions and other products are left alone.
 * - New products are created hidden (isActive = false) until they have photos and a description.
 * - Everything in the sheet is in stock. "Foreign used" / "Used" become UK Used.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { readFileSync, writeFileSync } from "node:fs";
import type { ConditionValue } from "../../src/lib/site";

type Row = { row: number; section: string; group: string | null; item: string; spec: string | null; price: number };
type SheetVariant = { condition: ConditionValue; storage: string | null; color: string | null; price: number; row: number };
type Planned = { name: string; category: string; brand: string | null; variants: SheetVariant[] };
type Resolved = { name: string; category: string; brand: string | null; condition?: ConditionValue; storage?: string | null; color?: string | null };

const APPLY = process.argv.includes("--apply");

/* ───────────── Conditions ───────────── */

function conditionFor(group: string | null, item: string): ConditionValue {
  const g = (group ?? "").toLowerCase();
  if (g.startsWith("brand new") || g === "condition not stated" || g === "wayfarer gen 2") return "new";
  if (g.startsWith("boxed")) return "boxed";
  if (g === "open box") return "open-box";
  if (g.startsWith("uk used") || g === "foreign used" || g === "used") return "uk-used";
  if (g === "consoles and games") return /\((uk )?used/i.test(item) ? "uk-used" : "new";
  throw new Error(`Unknown condition group "${group}" (item "${item}")`);
}

/* ───────────── Options (storage / colour) ───────────── */

const colourNames: Record<string, string> = { burgundy: "Burgundy", silver: "Silver", orange: "Cosmic Orange", black: "Black", white: "White" };
const colourHex: Record<string, string> = {
  Burgundy: "#6E2639",
  Silver: "#E3E4E5",
  "Cosmic Orange": "#F77E2D",
  Black: "#1D1D1F",
  White: "#F5F5F7",
  "Black Titanium": "#3A3A3C",
};

const tidy = (s: string) =>
  s
    .replace(/\b(\d+)(st|nd|rd|th) gen\b/gi, "$1$2 Gen")
    .replace(/\bWiFi\b/g, "Wi-Fi")
    .trim();

/** "256GB, Europe (burgundy)" → { storage: "256GB · Europe", color: "Burgundy" }; "16GB/512GB" → "16GB · 512GB". */
function parseSpec(spec: string | null): { storage: string | null; color: string | null } {
  if (!spec) return { storage: null, color: null };
  if (colourNames[spec.toLowerCase()]) return { storage: null, color: colourNames[spec.toLowerCase()] };
  let color: string | null = null;
  let s = spec.replace(/\(([^)]+)\)/g, (_m, inner: string) => {
    const c = colourNames[inner.trim().toLowerCase()];
    if (c) {
      color = c;
      return "";
    }
    return `, ${inner}`;
  });
  s = s
    .split(/,|\//)
    .map((p) => tidy(p))
    .filter(Boolean)
    .join(" · ");
  return { storage: s || null, color };
}

/* ───────────── Product names & categories ───────────── */

const SKIP = new Set(["Fire Stick (cracked edition)"]);

/** One-off names that don't follow a section's pattern. */
const overrides: Record<string, Resolved> = {
  // iPads
  "iPad Pro M5 13-inch": { name: 'iPad Pro 13" M5', category: "ipad", brand: "Apple" },
  "iPad Pro M5 11-inch": { name: 'iPad Pro 11" M5', category: "ipad", brand: "Apple" },
  "iPad Pro M4 13-inch": { name: 'iPad Pro 13" M4', category: "ipad", brand: "Apple" },
  "iPad Air 13-inch": { name: 'iPad Air 13"', category: "ipad", brand: "Apple" },
  "iPad Air 11-inch": { name: 'iPad Air 11"', category: "ipad", brand: "Apple" },
  "iPad 11th gen": { name: "iPad (11th Gen)", category: "ipad", brand: "Apple" },
  "iPad Mini 7 (WiFi only)": { name: "iPad mini 7 (Wi-Fi)", category: "ipad", brand: "Apple" },
  "iPad Air 5th gen (M1)": { name: "iPad Air (5th Gen, M1)", category: "ipad", brand: "Apple" },
  // Macs
  "MacBook Pro M5": { name: 'MacBook Pro 14" M5', category: "macbook", brand: "Apple" },
  "MacBook Pro M4": { name: 'MacBook Pro 14" M4', category: "macbook", brand: "Apple" },
  "MacBook Air M5": { name: 'MacBook Air 13" M5', category: "macbook", brand: "Apple" },
  "MacBook Air M4 15-inch (2025)": { name: 'MacBook Air 15" M4', category: "macbook", brand: "Apple" },
  "MacBook Air M4 (2025)": { name: 'MacBook Air 13" M4', category: "macbook", brand: "Apple" },
  "MacBook Air M2 (2022)": { name: 'MacBook Air 13" M2', category: "macbook", brand: "Apple" },
  "MacBook Air M1 (2020)": { name: 'MacBook Air 13" M1', category: "macbook", brand: "Apple" },
  "MacBook Neo": { name: "MacBook Neo", category: "macbook", brand: "Apple" },
  "Mac mini M4": { name: "Mac mini M4", category: "macbook", brand: "Apple" },
  "MacBook Pro M3 Pro": { name: "MacBook Pro M3 Pro", category: "macbook", brand: "Apple" },
  "MacBook Pro M1 Pro": { name: "MacBook Pro M1 Pro", category: "macbook", brand: "Apple" },
  "MacBook Pro M1": { name: 'MacBook Pro 13" M1', category: "macbook", brand: "Apple" },
  // Gaming laptops
  "Dell Alienware, RTX 5060": { name: "Dell Alienware RTX 5060 Gaming Laptop", category: "gaming-laptops", brand: "Dell" },
  "Dell Alienware 16 Aurora, RTX 5050": { name: "Dell Alienware 16 Aurora RTX 5050", category: "gaming-laptops", brand: "Dell" },
  "HP Victus 15-fa2309TX, RTX 5050 8GB": { name: "HP Victus 15 (fa2309TX) RTX 5050", category: "gaming-laptops", brand: "HP" },
  "HP Victus 15-fa2082wm, RTX 4050 6GB": { name: "HP Victus 15 (fa2082wm) RTX 4050", category: "gaming-laptops", brand: "HP" },
  "HP Victus 15-fa2013dx, RTX 3050 6GB": { name: "HP Victus 15 (fa2013dx) RTX 3050", category: "gaming-laptops", brand: "HP" },
  "HP Omen 16, RTX 5060 8GB": { name: "HP Omen 16 RTX 5060", category: "gaming-laptops", brand: "HP", storage: "Core Ultra 7 (14th Gen) · 16GB · 1TB" },
  "Dell Alienware 15, RTX 4050": { name: "Dell Alienware 15 RTX 4050", category: "gaming-laptops", brand: "Dell" },
  // Other laptops
  "HP 830 G8 (AMD Ryzen)": { name: "HP EliteBook 830 G8 (AMD Ryzen)", category: "office-student-laptops", brand: "HP" },
  "Dell 3190 2-in-1 (touch)": { name: "Dell Latitude 3190 2-in-1 (Touch)", category: "office-student-laptops", brand: "Dell" },
  // Apple Watch
  "Apple Watch Ultra 3 (Black Titanium, 1-year Apple warranty)": {
    name: "Apple Watch Ultra 3",
    category: "apple-watch",
    brand: "Apple",
    storage: "49mm · 1-year Apple warranty",
    color: "Black Titanium",
  },
  // Earbuds
  "AirPods Max (gen 2)": { name: "AirPods Max (2nd Gen)", category: "airpods", brand: "Apple" },
  "AirPods 4 (ANC)": { name: "AirPods 4 with ANC", category: "airpods", brand: "Apple" },
  "Samsung Buds 4 Pro": { name: "Samsung Galaxy Buds 4 Pro", category: "galaxy-buds", brand: "Samsung" },
  "Samsung Buds 3 Pro": { name: "Samsung Galaxy Buds 3 Pro", category: "galaxy-buds", brand: "Samsung" },
  // Speakers
  "Studio 9": { name: "Onyx Studio 9", category: "onyx", brand: "Onyx" },
  // PlayStation
  PS5: { name: "PlayStation 5 Slim (Disc Edition)", category: "ps5", brand: "Sony", storage: "1TB" },
  "PS4 Slim (brand new)": { name: "PlayStation 4 Slim 1TB", category: "ps4", brand: "Sony", storage: "1TB" },
  "PS4 Slim (UK used, with games)": { name: "PlayStation 4 Slim 1TB", category: "ps4", brand: "Sony", storage: "1TB · with games" },
  "PS4 Slim (used)": { name: "PlayStation 4 Slim 1TB", category: "ps4", brand: "Sony", storage: "1TB" },
  "PS4 Pro (UK used, with games)": { name: "PlayStation 4 Pro 1TB", category: "ps4", brand: "Sony", storage: "1TB · with games" },
  "PS4 Pro (used)": { name: "PlayStation 4 Pro 1TB", category: "ps4", brand: "Sony", storage: "1TB" },
  "PS4 Fat (UK used, with games)": { name: "PlayStation 4 (Original)", category: "ps4", brand: "Sony", storage: "With games" },
  "PS4 Fat (used)": { name: "PlayStation 4 (Original)", category: "ps4", brand: "Sony", storage: "Console only" },
  "EA FC 27": { name: "EA Sports FC 27", category: "ps5", brand: null },
  // Starlink
  "Starlink Standard": { name: "Starlink Standard Kit", category: "starlink", brand: "Starlink" },
  "Starlink Mini": { name: "Starlink Mini Kit", category: "starlink", brand: "Starlink" },
  // Ray-Ban Meta (each row is a frame/lens option of one product)
  "Matte Black, Transitions lens (clear to grey), Large": {
    name: "Ray-Ban Meta Wayfarer (Gen 2)",
    category: "ray-ban",
    brand: "Ray-Ban",
    color: "Matte Black · Transitions Lens (Large)",
  },
  "Clear lens or Full Dark": { name: "Ray-Ban Meta Wayfarer (Gen 2)", category: "ray-ban", brand: "Ray-Ban", color: "Clear or Full Dark Lens" },
  "Shiny Black with G15 Green, or Matte Black with Polar Gradient Graphite": {
    name: "Ray-Ban Meta Wayfarer (Gen 2)",
    category: "ray-ban",
    brand: "Ray-Ban",
    color: "Shiny Black G15 Green / Matte Black Polar Graphite",
  },
  // iPad accessories
  "Magic Keyboard 13-inch for iPad Pro M4/M5": { name: 'Magic Keyboard for iPad Pro 13" (M4/M5)', category: "accessories", brand: "Apple" },
  "Magic Keyboard 11-inch for iPad Pro M4/M5": { name: 'Magic Keyboard for iPad Pro 11" (M4/M5)', category: "accessories", brand: "Apple" },
  "Magic Keyboard for iPad 10th/11th gen": { name: "Magic Keyboard Folio for iPad (10th/11th Gen)", category: "accessories", brand: "Apple" },
  // Others
  "Xiaomi gaming monitor": { name: "Xiaomi Gaming Monitor", category: "gaming-monitors", brand: "Xiaomi" },
  "DJI Osmo Pocket 4": { name: "DJI Osmo Pocket 4", category: "accessories", brand: "DJI" },
};

/** Default naming per spreadsheet section. */
const sections: Record<string, (item: string) => Resolved> = {
  IPHONES: (i) => ({ name: i, category: "iphone", brand: "Apple" }),
  "SAMSUNG PHONES": (i) => ({ name: `Samsung ${i}`, category: "samsung-phones", brand: "Samsung" }),
  "GOOGLE PIXEL": (i) => ({ name: `Google ${i}`, category: "pixel-phones", brand: "Google" }),
  "SAMSUNG TABLETS": (i) => ({ name: `Samsung ${i}`, category: "samsung-tablets", brand: "Samsung" }),
  "OTHER LAPTOPS": (i) => ({ name: i.replace("(touch)", "(Touch)"), category: "office-student-laptops", brand: i.split(" ")[0] }),
  "APPLE WATCH": (i) => ({ name: i, category: "apple-watch", brand: "Apple", ...(/Ultra/.test(i) ? { storage: "49mm" } : {}) }),
  "SAMSUNG WATCHES": (i) => ({ name: `Samsung ${i}`, category: "samsung-watches", brand: "Samsung" }),
  "AIRPODS AND EARBUDS": (i) => ({ name: i, category: "airpods", brand: "Apple" }),
  "JBL HEADSETS": (i) => ({ name: i, category: "jbl", brand: "JBL" }),
  SPEAKERS: (i) => ({ name: `JBL ${i}`, category: "jbl", brand: "JBL" }),
};

function resolve(r: Row): Resolved {
  const o = overrides[r.item];
  if (o) return o;
  const s = sections[r.section];
  if (!s) throw new Error(`Row ${r.row}: no naming rule for "${r.item}" in section ${r.section}`);
  return s(r.item);
}

export function slugFor(name: string) {
  return name
    .toLowerCase()
    .replace(/\+/g, " plus")
    .replace(/"/g, " inch")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ───────────── Build the plan from the sheet ───────────── */

function buildPlan(rows: Row[]) {
  const plan = new Map<string, Planned>();
  const skipped: Row[] = [];
  for (const r of rows) {
    if (SKIP.has(r.item)) {
      skipped.push(r);
      continue;
    }
    const res = resolve(r);
    const spec = parseSpec(r.spec);
    const v: SheetVariant = {
      condition: res.condition ?? conditionFor(r.group, r.item),
      storage: res.storage !== undefined ? res.storage : spec.storage,
      color: res.color !== undefined ? res.color : spec.color,
      price: r.price,
      row: r.row,
    };
    const p = plan.get(res.name) ?? { name: res.name, category: res.category, brand: res.brand, variants: [] };
    const dupe = p.variants.find((x) => x.condition === v.condition && x.storage === v.storage && x.color === v.color);
    if (dupe) throw new Error(`Rows ${dupe.row} and ${r.row} are the same option of ${res.name} (${v.condition} ${v.storage ?? ""} ${v.color ?? ""})`);
    p.variants.push(v);
    plan.set(res.name, p);
  }
  return { plan: [...plan.values()], skipped };
}

/* ───────────── Compare with the database and apply ───────────── */

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();

async function main() {
  const rows: Row[] = JSON.parse(readFileSync("data/price-list.json", "utf-8"));
  const { plan, skipped } = buildPlan(rows);

  const { db } = await import("../../src/db");
  const { brands, categories, productVariants, products } = await import("../../src/db/schema");
  const { eq } = await import("drizzle-orm");

  const cats = await db.select().from(categories);
  const brandRows = await db.select().from(brands);
  const existing = await db.query.products.findMany({ with: { variants: true } });

  const out: string[] = [];
  const log = (s = "") => out.push(s);
  const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;
  const label = (v: { condition: string; storage: string | null; color: string | null }) =>
    [v.condition, v.storage, v.color].filter(Boolean).join(" / ");

  type Op =
    | { kind: "create"; p: Planned }
    | {
        kind: "update";
        p: Planned;
        productId: number;
        prices: { id: number; price: number; was: number; wasAvail: string }[];
        inserts: SheetVariant[];
        soldOut: { id: number; text: string }[];
      };
  const ops: Op[] = [];
  const newBrands = new Set<string>();

  for (const p of plan) {
    if (!cats.some((c) => c.slug === p.category)) throw new Error(`Category "${p.category}" does not exist (${p.name})`);
    if (p.brand && !brandRows.some((b) => norm(b.name) === norm(p.brand))) newBrands.add(p.brand);

    const match = existing.find((e) => e.slug === slugFor(p.name) || norm(e.name) === norm(p.name));
    if (!match) {
      ops.push({ kind: "create", p });
      continue;
    }
    const touched = new Set<number>();
    const prices: { id: number; price: number; was: number; wasAvail: string }[] = [];
    const inserts: SheetVariant[] = [];
    for (const sv of p.variants) {
      const hits = match.variants.filter(
        (ev) =>
          ev.condition === sv.condition &&
          (sv.storage === null || norm(ev.storage) === norm(sv.storage)) &&
          (sv.color === null || norm(ev.color) === norm(sv.color)),
      );
      if (!hits.length) inserts.push(sv);
      for (const h of hits) {
        touched.add(h.id);
        prices.push({ id: h.id, price: sv.price, was: h.price, wasAvail: h.availability });
      }
    }
    const soldOut = match.variants
      .filter((ev) => !touched.has(ev.id) && ev.availability !== "sold_out")
      .map((ev) => ({ id: ev.id, text: `${label(ev)} (was ${fmt(ev.price)})` }));
    ops.push({ kind: "update", p, productId: match.id, prices, inserts, soldOut });
  }

  /* Report */
  const creates = ops.filter((o) => o.kind === "create");
  const updates = ops.filter((o) => o.kind === "update");
  log(`IMPORT PLAN — ${new Date().toISOString()} — ${APPLY ? "APPLIED" : "DRY RUN (nothing changed)"}`);
  log(`Sheet rows: ${rows.length} | products: ${plan.length} | new: ${creates.length} | existing updated: ${updates.length}`);
  log(`Skipped rows: ${skipped.map((r) => `${r.row} ${r.item}`).join(", ") || "none"}`);
  log(`New brands: ${[...newBrands].join(", ") || "none"}`);
  log(`Existing products NOT in the sheet (left untouched): ${existing.filter((e) => !updates.some((u) => u.kind === "update" && u.productId === e.id)).map((e) => e.name).join("; ")}`);
  log();
  log("══════ EXISTING PRODUCTS ══════");
  for (const o of updates) {
    if (o.kind !== "update") continue;
    log(`\n■ ${o.p.name}  [${o.p.category}]`);
    for (const sv of o.p.variants) {
      const ids = new Set(o.prices.filter((x) => x.price === sv.price).map((x) => x.id));
      const hits = o.prices.filter((x) => ids.has(x.id) && x.price === sv.price);
      const ins = o.inserts.includes(sv);
      const before = [...new Set(hits.map((h) => fmt(h.was)))].join("/");
      log(`   ${ins ? "+ NEW OPTION" : `  ${hits.length} option(s) ${before} →`} ${label(sv)} = ${fmt(sv.price)}`);
    }
    for (const s of o.soldOut) log(`   ✕ sold out: ${s.text}`);
  }
  log();
  log("══════ NEW PRODUCTS (created hidden until photos + description are added) ══════");
  for (const o of creates) {
    log(`\n■ ${o.p.name}  [${o.p.category}] brand=${o.p.brand ?? "-"}  /p/${slugFor(o.p.name)}`);
    for (const v of o.p.variants) log(`     ${label(v)} = ${fmt(v.price)}`);
  }
  writeFileSync("data/import-plan.txt", out.join("\n"), "utf-8");
  console.log(out.slice(0, 6).join("\n"));
  console.log(`\nFull plan: data/import-plan.txt`);

  if (!APPLY) process.exit(0);

  /* Apply — first save every existing option's price/availability so the import can be reverted. */
  const backup = `data/backup-variants-${Date.now()}.json`;
  writeFileSync(
    backup,
    JSON.stringify(existing.flatMap((e) => e.variants.map((v) => ({ id: v.id, productId: e.id, price: v.price, availability: v.availability })))),
  );
  console.log(`Backup of current prices: ${backup}`);

  const brandId = new Map(brandRows.map((b) => [norm(b.name), b.id]));
  for (const name of newBrands) {
    const [b] = await db.insert(brands).values({ name, slug: slugFor(name) }).returning();
    brandId.set(norm(name), b.id);
  }
  const catId = new Map(cats.map((c) => [c.slug, c.id]));
  const variantRow = (productId: number, v: SheetVariant) => ({
    productId,
    condition: v.condition,
    storage: v.storage,
    color: v.color,
    colorHex: v.color ? (colourHex[v.color] ?? null) : null,
    price: v.price,
    availability: "in_stock" as const,
  });

  let n = 0;
  for (const o of ops) {
    await db.transaction(async (trx) => {
      if (o.kind === "create") {
        const [created] = await trx
          .insert(products)
          .values({
            name: o.p.name,
            slug: slugFor(o.p.name),
            categoryId: catId.get(o.p.category)!,
            brandId: o.p.brand ? brandId.get(norm(o.p.brand))! : null,
            isActive: false,
          })
          .returning({ id: products.id });
        await trx.insert(productVariants).values(o.p.variants.map((v) => variantRow(created.id, v)));
      } else {
        for (const x of o.prices) await trx.update(productVariants).set({ price: x.price, availability: "in_stock" }).where(eq(productVariants.id, x.id));
        if (o.inserts.length) await trx.insert(productVariants).values(o.inserts.map((v) => variantRow(o.productId, v)));
        for (const s of o.soldOut) await trx.update(productVariants).set({ availability: "sold_out" }).where(eq(productVariants.id, s.id));
        await trx.update(products).set({ updatedAt: new Date() }).where(eq(products.id, o.productId));
      }
    });
    n++;
  }
  console.log(`\nApplied ${n} products (${creates.length} created hidden, ${updates.length} updated).`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
