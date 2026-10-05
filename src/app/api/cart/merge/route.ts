import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { mergeCart, publishCart } from "@/lib/cart";
import { CART_ORIGIN_HEADER } from "@/lib/cart-types";
import { UNLIMITED_QTY } from "@/lib/site";

const bodySchema = z.object({
  items: z
    .array(z.object({ variantId: z.number().int().positive(), quantity: z.number().int().min(1).max(UNLIMITED_QTY) }))
    .max(200),
  notes: z.string().max(1000).optional(),
});

/** Called right after sign-in to fold a guest cart into the account cart. */
export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  await mergeCart(user.id, parsed.data.items, parsed.data.notes);
  return NextResponse.json(await publishCart(user.id, req.headers.get(CART_ORIGIN_HEADER)));
}
