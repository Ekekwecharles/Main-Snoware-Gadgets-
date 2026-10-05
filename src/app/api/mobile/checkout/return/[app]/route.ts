import type { NextRequest } from "next/server";
import { confirmPayment } from "@/lib/orders";

/** Deep-link scheme of the mobile app (mobile/app.config.ts → scheme). */
const APP_SCHEME = process.env.MOBILE_APP_SCHEME ?? "snowaregadgets";

/**
 * Only send shoppers back into our own app: its custom scheme, or Expo Go's exp:// URLs during development.
 * The target is base64url-encoded in the path because Paystack appends its own query string to the callback URL.
 */
function appReturnUrl(encoded: string) {
  try {
    const url = Buffer.from(encoded, "base64url").toString("utf8");
    if (url.startsWith(`${APP_SCHEME}://`)) return url;
    if (process.env.NODE_ENV !== "production" && /^exps?:\/\//.test(url)) return url;
  } catch {}
  return `${APP_SCHEME}://checkout-complete`;
}

/**
 * Paystack redirects here after an in-app payment. We confirm the payment (idempotent; the webhook
 * may also do it) and redirect to the app's deep link, which closes the in-app browser.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/mobile/checkout/return/[app]">) {
  const sp = req.nextUrl.searchParams;
  const reference = sp.get("reference") ?? sp.get("trxref");
  let status = "failed";
  if (reference) {
    const result = await confirmPayment(reference).catch((err) => {
      console.error("[mobile checkout return]", err);
      return null;
    });
    if (result?.ok) status = "success";
  }
  const target = new URL(appReturnUrl((await ctx.params).app));
  target.searchParams.set("status", status);
  target.searchParams.set("reference", reference ?? "");
  return new Response(null, { status: 302, headers: { Location: target.toString() } });
}
