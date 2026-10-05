import "server-only";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { deliveryZones, orderItems, orders, productVariants } from "@/db/schema";
import { initializeTransaction } from "@/lib/paystack";
import { variantLabel } from "@/lib/catalog";
import { absoluteUrl, generateOrderReference } from "@/lib/utils";
import { UNLIMITED_QTY } from "@/lib/site";
import { eq } from "drizzle-orm";

const checkoutSchema = z
  .object({
    email: z.email("Enter a valid email"),
    fullName: z.string().trim().min(2, "Enter your full name"),
    phone: z.string().trim().regex(/^(\+?234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number"),
    deliveryMethod: z.enum(["delivery", "pickup"]),
    zoneId: z.coerce.number().optional(),
    addressLine: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    notes: z.string().trim().max(1000).optional(),
    items: z
      .array(
        z.object({
          variantId: z.number().int().positive(),
          quantity: z.number().int().min(1).max(UNLIMITED_QTY, "For orders this large, please contact us on WhatsApp"),
        }),
      )
      .min(1, "Your cart is empty"),
  })
  .superRefine((d, ctx) => {
    if (d.deliveryMethod === "delivery") {
      if (!d.zoneId) ctx.addIssue({ code: "custom", path: ["zoneId"], message: "Choose your delivery location" });
      if (!d.addressLine || d.addressLine.length < 5) ctx.addIssue({ code: "custom", path: ["addressLine"], message: "Enter your street address" });
      if (!d.city) ctx.addIssue({ code: "custom", path: ["city"], message: "Enter your city / area" });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutResult =
  | { ok: true; url: string; reference: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; priceChanged?: boolean };

/**
 * Creates an unpaid order from the given items and starts a Paystack payment.
 * Shared by the website's checkout action and the mobile checkout API.
 * `callbackPath` is where Paystack sends the shopper after paying.
 */
export async function createCheckout(
  input: unknown,
  opts: { userId: string | null; callbackPath?: string },
): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;

  // Re-price everything from the database — never trust client prices.
  const variantIds = data.items.map((i) => i.variantId);
  const variants = await db.query.productVariants.findMany({
    where: inArray(productVariants.id, variantIds),
    with: { product: { with: { images: { orderBy: (img, { asc }) => [asc(img.sortOrder)], limit: 1 } } } },
  });

  const lines: { v: (typeof variants)[number]; quantity: number }[] = [];
  for (const item of data.items) {
    const v = variants.find((x) => x.id === item.variantId);
    if (!v || !v.product.isActive) return { ok: false, error: "An item in your cart is no longer available. Please remove it and try again." };
    const label = `${v.product.name}${variantLabel(v) ? ` (${variantLabel(v)})` : ""}`;
    if (v.availability === "sold_out" || v.stock === 0)
      return { ok: false, error: `${label} just sold out. Please remove it from your cart.` };
    // Only enforce a cap when the admin has set a quantity for this variant.
    if (v.stock != null && item.quantity > v.stock)
      return { ok: false, error: `Only ${v.stock} of ${label} left. Please reduce the quantity in your cart.` };
    lines.push({ v, quantity: item.quantity });
  }

  const subtotal = lines.reduce((n, l) => n + l.v.price * l.quantity, 0);
  let deliveryFee = 0;
  let zone: typeof deliveryZones.$inferSelect | undefined;
  if (data.deliveryMethod === "delivery") {
    zone = await db.query.deliveryZones.findFirst({ where: eq(deliveryZones.id, data.zoneId!) });
    if (!zone || !zone.isActive) return { ok: false, error: "Please choose a valid delivery location.", fieldErrors: { zoneId: "Choose your delivery location" } };
    deliveryFee = zone.fee;
  }
  const total = subtotal + deliveryFee;
  const reference = generateOrderReference();

  const order = await db.transaction(async (trx) => {
    const [o] = await trx
      .insert(orders)
      .values({
        reference,
        userId: opts.userId,
        email: data.email.toLowerCase(),
        fullName: data.fullName,
        phone: data.phone,
        deliveryMethod: data.deliveryMethod,
        zoneId: zone?.id,
        zoneName: zone?.name,
        addressLine: data.deliveryMethod === "delivery" ? data.addressLine : null,
        city: data.deliveryMethod === "delivery" ? data.city : null,
        state: data.deliveryMethod === "delivery" ? (data.state ?? zone?.state) : null,
        notes: data.notes || null,
        subtotal,
        deliveryFee,
        total,
      })
      .returning();
    await trx.insert(orderItems).values(
      lines.map((l) => ({
        orderId: o.id,
        productId: l.v.productId,
        variantId: l.v.id,
        name: l.v.product.name,
        variantLabel: variantLabel(l.v),
        image: l.v.product.images[0]?.url ?? null,
        unitPrice: l.v.price,
        quantity: l.quantity,
        onOrder: l.v.availability === "on_order",
      })),
    );
    return o;
  });

  try {
    const res = await initializeTransaction({
      email: order.email,
      amount: total,
      reference,
      callbackUrl: absoluteUrl(opts.callbackPath ?? "/checkout/verify"),
      metadata: { order_id: order.id, customer: data.fullName, phone: data.phone },
    });
    if (!res.status) throw new Error(res.message);
    return { ok: true, url: res.data.authorization_url, reference };
  } catch (err) {
    console.error("[checkout] Paystack initialise failed", err);
    return { ok: false, error: "We couldn't connect to Paystack. Please try again in a moment." };
  }
}
