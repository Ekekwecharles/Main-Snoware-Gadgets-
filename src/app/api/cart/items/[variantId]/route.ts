import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { publishCart, removeItem, setItemQuantity } from "@/lib/cart";
import { CART_ORIGIN_HEADER } from "@/lib/cart-types";
import { UNLIMITED_QTY } from "@/lib/site";

type Ctx = RouteContext<"/api/cart/items/[variantId]">;

async function variantIdFrom(ctx: Ctx) {
  const id = Number((await ctx.params).variantId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Set the exact quantity for a line (0 removes it). */
export async function PUT(req: Request, ctx: Ctx) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  const variantId = await variantIdFrom(ctx);
  const parsed = z.object({ quantity: z.number().int().min(0).max(UNLIMITED_QTY) }).safeParse(await req.json().catch(() => null));
  if (!variantId || !parsed.success) return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  const err = await setItemQuantity(user.id, variantId, parsed.data.quantity);
  if (err) return NextResponse.json({ error: err.error }, { status: err.status });
  return NextResponse.json(await publishCart(user.id, req.headers.get(CART_ORIGIN_HEADER)));
}

export async function DELETE(req: Request, ctx: Ctx) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  const variantId = await variantIdFrom(ctx);
  if (!variantId) return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  await removeItem(user.id, variantId);
  return NextResponse.json(await publishCart(user.id, req.headers.get(CART_ORIGIN_HEADER)));
}
