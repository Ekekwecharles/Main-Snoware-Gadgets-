import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { clearCart, getCart, publishCart, setNotes } from "@/lib/cart";
import { CART_ORIGIN_HEADER } from "@/lib/cart-types";

/** The signed-in user's cart — shared by the website (cookie) and the mobile app (bearer token). */
export async function GET(req: Request) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  return NextResponse.json(await getCart(user.id));
}

/** Update the order notes. */
export async function PATCH(req: Request) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  const parsed = z.object({ notes: z.string().max(1000) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid notes" }, { status: 400 });
  await setNotes(user.id, parsed.data.notes);
  return NextResponse.json(await publishCart(user.id, req.headers.get(CART_ORIGIN_HEADER)));
}

/** Empty the cart. */
export async function DELETE(req: Request) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  await clearCart(user.id);
  return NextResponse.json(await publishCart(user.id, req.headers.get(CART_ORIGIN_HEADER)));
}
