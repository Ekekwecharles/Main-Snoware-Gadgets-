import { NextResponse } from "next/server";
import { getOrderByReference } from "@/lib/orders";
import { serializeOrder } from "@/lib/mobile-orders";

/** Order tracking by reference — like the website's /order/[reference] page, references are unguessable. */
export async function GET(_req: Request, ctx: RouteContext<"/api/mobile/orders/[reference]">) {
  const { reference } = await ctx.params;
  const order = await getOrderByReference(reference);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(serializeOrder(order));
}
