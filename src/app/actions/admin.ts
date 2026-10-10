"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/auth";
import { db } from "@/db";
import {
  banners,
  categories,
  deliveryZones,
  orders,
  productImages,
  productVariants,
  products,
  settings,
  orderStatusEnum,
} from "@/db/schema";
import { cloudinaryConfigured, deleteImage, uploadImage } from "@/lib/cloudinary";
import { sendOrderConfirmation, sendOrderStatusUpdate } from "@/lib/mail";
import { markOrderPaid } from "@/lib/orders";
import { slugify } from "@/lib/utils";
import { availabilityValues, conditionValues } from "@/lib/site";

async function guard() {
  const session = await requireAdmin();
  if (!session) throw new Error("Not authorised");
  return session;
}

function refreshStorefront() {
  revalidatePath("/", "layout");
}

/* ───────────── Products ───────────── */

const variantSchema = z.object({
  id: z.number().int().optional(),
  condition: z.enum(conditionValues),
  storage: z.string().trim().optional().nullable(),
  color: z.string().trim().optional().nullable(),
  colorHex: z.string().trim().optional().nullable(),
  price: z.coerce.number().int().positive("Price must be greater than 0"),
  compareAtPrice: z.coerce.number().int().nonnegative().optional().nullable(),
  availability: z.enum(availabilityValues).default("in_stock"),
  /** Optional quantity available; null/empty = no limit. */
  stock: z.coerce.number().int().nonnegative().nullable().default(null),
  sku: z.string().trim().optional().nullable(),
});

const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug: z.string().trim().optional(),
  categoryId: z.coerce.number().int().positive("Choose a category"),
  brandId: z.coerce.number().int().positive().optional().nullable(),
  shortDescription: z.string().trim().max(400).optional().nullable(),
  description: z.string().trim().optional().nullable(),
  highlights: z.array(z.string().trim().min(1)).default([]),
  specs: z.array(z.object({ label: z.string().trim().min(1), value: z.string().trim().min(1) })).default([]),
  badge: z.string().trim().max(24).optional().nullable(),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  variants: z.array(variantSchema).min(1, "Add at least one variant"),
});

export type ProductFormInput = z.input<typeof productSchema>;
export type AdminResult = { ok: boolean; message: string; id?: number };

export async function saveProduct(id: number | null, input: ProductFormInput): Promise<AdminResult> {
  await guard();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const slug = slugify(d.slug || d.name);

  const clash = await db.query.products.findFirst({ where: id ? and(eq(products.slug, slug), ne(products.id, id)) : eq(products.slug, slug) });
  if (clash) return { ok: false, message: `Another product already uses the URL “${slug}”. Change the name or slug.` };

  const values = {
    name: d.name,
    slug,
    categoryId: d.categoryId,
    brandId: d.brandId ?? null,
    shortDescription: d.shortDescription || null,
    description: d.description || null,
    highlights: d.highlights,
    specs: d.specs,
    badge: d.badge || null,
    featured: d.featured,
    isActive: d.isActive,
    updatedAt: new Date(),
  };

  const productId = await db.transaction(async (trx) => {
    let pid = id;
    if (pid) await trx.update(products).set(values).where(eq(products.id, pid));
    else [{ id: pid }] = await trx.insert(products).values(values).returning({ id: products.id });

    const existing = await trx.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, pid!));
    const keep = new Set(d.variants.filter((v) => v.id).map((v) => v.id!));
    for (const e of existing) if (!keep.has(e.id)) await trx.delete(productVariants).where(eq(productVariants.id, e.id));
    for (const v of d.variants) {
      const row = {
        productId: pid!,
        condition: v.condition,
        storage: v.storage || null,
        color: v.color || null,
        colorHex: v.colorHex || null,
        price: v.price,
        compareAtPrice: v.compareAtPrice || null,
        availability: v.availability,
        stock: v.stock,
        sku: v.sku || null,
      };
      if (v.id && existing.some((e) => e.id === v.id)) await trx.update(productVariants).set(row).where(eq(productVariants.id, v.id));
      else await trx.insert(productVariants).values(row);
    }
    return pid!;
  });

  refreshStorefront();
  revalidatePath("/admin/products");
  return { ok: true, message: id ? "Product saved." : "Product created.", id: productId };
}

export async function deleteProduct(id: number) {
  await guard();
  const imgs = await db.select().from(productImages).where(eq(productImages.productId, id));
  // Keep order history intact: archive if the product has been ordered, otherwise delete.
  const [{ count }] = await db.execute<{ count: number }>(sql`select count(*)::int as count from order_items where product_id = ${id}`).then((r) => r.rows);
  if (count > 0) {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  } else {
    await db.delete(products).where(eq(products.id, id));
    await Promise.all(imgs.filter((i) => i.publicId).map((i) => deleteImage(i.publicId!)));
  }
  refreshStorefront();
  redirect("/admin/products");
}

const PRODUCT_IMAGE_FOLDER = "snoware/products";

/**
 * Step 1 of the photo editor: uploads files to Cloudinary only. Nothing is attached to the
 * product until `saveProductImages` runs, so the admin can still reorder or remove them first.
 */
export async function uploadImagesToCloud(formData: FormData): Promise<{ ok: true; images: { url: string; publicId: string }[] } | { ok: false; message: string }> {
  await guard();
  if (!cloudinaryConfigured()) return { ok: false, message: "Cloudinary isn't configured. Add CLOUDINARY_* keys to your environment." };
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { ok: false, message: "Choose at least one image." };
  for (const f of files) {
    if (!f.type.startsWith("image/")) return { ok: false, message: `${f.name} isn't an image.` };
    if (f.size > 8 * 1024 * 1024) return { ok: false, message: `${f.name} is larger than 8MB.` };
  }
  const images = [];
  for (const f of files) images.push(await uploadImage(f, PRODUCT_IMAGE_FOLDER));
  return { ok: true, images };
}

const photoSchema = z.object({
  order: z.array(
    z.union([
      z.object({ id: z.number().int().positive() }),
      z.object({ url: z.url(), publicId: z.string().min(1) }),
    ]),
  ),
  /** Staged uploads the admin removed before saving — deleted from Cloudinary. */
  discardedPublicIds: z.array(z.string()).default([]),
});

/**
 * Step 2: applies the final photo list in one go — new uploads are attached, the order becomes the
 * sort order (first = main photo), and any existing photo missing from the list is deleted.
 */
export async function saveProductImages(productId: number, input: z.input<typeof photoSchema>): Promise<AdminResult> {
  await guard();
  const parsed = photoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid photo data." };
  const { order, discardedPublicIds } = parsed.data;

  // Only accept new images that were uploaded to our own Cloudinary account and product folder.
  const ownUpload = (url: string, publicId: string) =>
    url.startsWith(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`) && publicId.startsWith(`${PRODUCT_IMAGE_FOLDER}/`);
  for (const item of order) if ("url" in item && !ownUpload(item.url, item.publicId)) return { ok: false, message: "Unrecognised image source." };

  const product = await db.query.products.findFirst({ where: eq(products.id, productId) });
  if (!product) return { ok: false, message: "Product not found." };
  const existing = await db.select().from(productImages).where(eq(productImages.productId, productId));
  const existingIds = new Set(existing.map((i) => i.id));
  const keptIds = new Set(order.flatMap((i) => ("id" in i ? [i.id] : [])));
  for (const id of keptIds) if (!existingIds.has(id)) return { ok: false, message: "A photo no longer exists. Refresh and try again." };

  const removed = existing.filter((i) => !keptIds.has(i.id));
  await db.transaction(async (trx) => {
    for (const img of removed) await trx.delete(productImages).where(eq(productImages.id, img.id));
    for (const [sortOrder, item] of order.entries()) {
      if ("id" in item) await trx.update(productImages).set({ sortOrder }).where(eq(productImages.id, item.id));
      else await trx.insert(productImages).values({ productId, url: item.url, publicId: item.publicId, alt: product.name, sortOrder });
    }
    await trx.update(products).set({ updatedAt: new Date() }).where(eq(products.id, productId));
  });

  // Clean up files only after the database commit succeeded.
  const toDestroy = [...removed.map((i) => i.publicId), ...discardedPublicIds.filter((p) => p.startsWith(`${PRODUCT_IMAGE_FOLDER}/`))];
  await Promise.all(toDestroy.filter((p): p is string => !!p).map((p) => deleteImage(p)));

  refreshStorefront();
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true, message: "Photos saved." };
}

/* ───────────── Orders ───────────── */

/** The admin has seen a bank transfer land: mark the order paid (stock, sales, cart) and email the customer. */
export async function confirmTransferPayment(orderId: number): Promise<AdminResult> {
  await guard();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) return { ok: false, message: "Order not found." };
  if (order.paymentStatus === "paid") return { ok: true, message: "This order was already marked paid." };
  const updated = await markOrderPaid(orderId, new Date());
  if (updated) await sendOrderConfirmation(updated.paid, updated.items);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/order/${order.reference}`);
  return { ok: true, message: "Payment confirmed — the customer has been emailed." };
}

export async function updateOrderStatus(orderId: number, status: (typeof orderStatusEnum.enumValues)[number], notify: boolean) {
  await guard();
  const [order] = await db.update(orders).set({ status }).where(eq(orders.id, orderId)).returning();
  if (order && notify) await sendOrderStatusUpdate(order);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return { ok: true, message: notify ? "Status updated and customer notified." : "Status updated." };
}

/* ───────────── Categories ───────────── */

export async function saveCategory(_prev: AdminResult | null, formData: FormData): Promise<AdminResult> {
  await guard();
  const parsed = z
    .object({
      id: z.coerce.number().optional(),
      name: z.string().trim().min(2),
      parentId: z.coerce.number().optional(),
      description: z.string().trim().optional(),
      sortOrder: z.coerce.number().int().default(0),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Enter a category name." };
  const d = parsed.data;
  const values = { name: d.name, slug: slugify(d.name), parentId: d.parentId || null, description: d.description || null, sortOrder: d.sortOrder };
  try {
    if (d.id) await db.update(categories).set(values).where(eq(categories.id, d.id));
    else await db.insert(categories).values(values);
  } catch {
    return { ok: false, message: "A category with that name already exists." };
  }
  refreshStorefront();
  revalidatePath("/admin/categories");
  return { ok: true, message: "Category saved." };
}

/* ───────────── Banners ───────────── */

export async function saveBanner(_prev: AdminResult | null, formData: FormData): Promise<AdminResult> {
  await guard();
  const parsed = z
    .object({
      id: z.coerce.number().optional(),
      placement: z.enum(["hero", "promo"]),
      eyebrow: z.string().trim().optional(),
      title: z.string().trim().min(2, "Title is required"),
      subtitle: z.string().trim().optional(),
      priceText: z.string().trim().optional(),
      ctaLabel: z.string().trim().optional(),
      ctaHref: z.string().trim().optional(),
      secondaryLabel: z.string().trim().optional(),
      secondaryHref: z.string().trim().optional(),
      theme: z.enum(["light", "dark", "red", "navy", "blue"]),
      sortOrder: z.coerce.number().int().default(0),
      isActive: z.string().optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { id, isActive, ...d } = parsed.data;

  let image: string | undefined;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!cloudinaryConfigured()) return { ok: false, message: "Cloudinary isn't configured, so images can't be uploaded yet." };
    image = (await uploadImage(file, "snoware/banners")).url;
  }
  const values = {
    ...Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v === "" ? null : v])),
    placement: d.placement,
    title: d.title,
    theme: d.theme,
    sortOrder: d.sortOrder,
    isActive: isActive === "on",
    ...(image ? { image } : {}),
  };
  if (formData.get("removeImage") === "on") Object.assign(values, { image: null });

  if (id) await db.update(banners).set(values).where(eq(banners.id, id));
  else await db.insert(banners).values(values as typeof banners.$inferInsert);
  refreshStorefront();
  revalidatePath("/admin/banners");
  return { ok: true, message: "Banner saved." };
}

export async function deleteBanner(id: number) {
  await guard();
  await db.delete(banners).where(eq(banners.id, id));
  refreshStorefront();
  revalidatePath("/admin/banners");
}

/* ───────────── Delivery zones ───────────── */

export async function saveZone(_prev: AdminResult | null, formData: FormData): Promise<AdminResult> {
  await guard();
  const parsed = z
    .object({
      id: z.coerce.number().optional(),
      name: z.string().trim().min(2, "Name is required"),
      state: z.string().trim().min(2, "State/region is required"),
      fee: z.coerce.number().int().nonnegative(),
      eta: z.string().trim().min(2, "Delivery time is required"),
      sortOrder: z.coerce.number().int().default(0),
      isActive: z.string().optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { id, isActive, ...d } = parsed.data;
  const values = { ...d, isActive: isActive === "on" };
  if (id) await db.update(deliveryZones).set(values).where(eq(deliveryZones.id, id));
  else await db.insert(deliveryZones).values(values);
  revalidatePath("/admin/delivery");
  revalidatePath("/checkout");
  return { ok: true, message: "Delivery zone saved." };
}

export async function deleteZone(id: number) {
  await guard();
  // Past orders keep the zone name; detach the foreign key before deleting.
  await db.update(orders).set({ zoneId: null }).where(eq(orders.zoneId, id));
  await db.delete(deliveryZones).where(eq(deliveryZones.id, id));
  revalidatePath("/admin/delivery");
}

/* ───────────── Settings ───────────── */

export async function saveSettings(_prev: AdminResult | null, formData: FormData): Promise<AdminResult> {
  await guard();
  const keys = ["store_address", "store_hours", "store_map_query", "announcement", "app_latest_version", "app_min_version"] as const;
  for (const key of ["app_latest_version", "app_min_version"]) {
    const value = String(formData.get(key) ?? "").trim();
    if (value && !/^\d+(\.\d+){0,2}$/.test(value)) return { ok: false, message: "App versions must look like 1.2.0 (or be left empty)." };
  }
  for (const key of keys) {
    const value = String(formData.get(key) ?? "").trim();
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  refreshStorefront();
  return { ok: true, message: "Settings saved." };
}
