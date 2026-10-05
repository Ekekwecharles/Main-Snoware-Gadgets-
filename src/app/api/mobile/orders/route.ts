import { NextResponse } from "next/server";
import { getApiUser, unauthorized } from "@/lib/api-auth";
import { listUserOrders } from "@/lib/mobile-orders";

export async function GET(req: Request) {
  const user = await getApiUser(req);
  if (!user) return unauthorized();
  return NextResponse.json(await listUserOrders(user.id));
}
