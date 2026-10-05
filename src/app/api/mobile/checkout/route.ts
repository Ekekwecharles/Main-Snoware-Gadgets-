import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/api-auth";
import { createCheckout } from "@/lib/checkout";

/**
 * Starts a Paystack payment from the app. Same validation and server-side pricing as the website.
 * Body: the website's checkout fields plus `returnUrl` (the app deep link to land on after paying).
 * Paystack returns the shopper to /api/mobile/checkout/return/…, which hands control back to the app.
 */
export async function POST(req: Request) {
  const user = await getApiUser(req);
  const body = await req.json().catch(() => null);
  const returnUrl = z.string().max(500).safeParse(body?.returnUrl);
  const encoded = Buffer.from(returnUrl.success ? returnUrl.data : "").toString("base64url") || "_";
  const result = await createCheckout(body, {
    userId: user?.id ?? null,
    callbackPath: `/api/mobile/checkout/return/${encoded}`,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
