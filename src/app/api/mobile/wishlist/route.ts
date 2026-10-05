import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { getWishlistCards, toggleWishlistItem } from "@/lib/wishlist";

export async function GET(req: Request) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  return NextResponse.json(await getWishlistCards(user.id));
}

/** Toggle a product in the wishlist. Body: { productId }. */
export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  const parsed = z.object({ productId: z.number().int().positive() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  const saved = await toggleWishlistItem(user.id, parsed.data.productId);
  revalidatePath("/account/wishlist");
  return NextResponse.json({ saved });
}
