import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { addItem, publishCart } from "@/lib/cart";
import { CART_ORIGIN_HEADER } from "@/lib/cart-types";
import { UNLIMITED_QTY } from "@/lib/site";

const bodySchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(UNLIMITED_QTY).default(1),
});

/** Add a variant to the cart (adds to any quantity already there). */
export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  const err = await addItem(user.id, parsed.data.variantId, parsed.data.quantity);
  if (err) return NextResponse.json({ error: err.error }, { status: err.status });
  return NextResponse.json(await publishCart(user.id, req.headers.get(CART_ORIGIN_HEADER)));
}
