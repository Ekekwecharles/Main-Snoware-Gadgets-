import { NextResponse } from "next/server";
import { isValidWebhookSignature } from "@/lib/paystack";
import { confirmPayment } from "@/lib/orders";

/** Paystack → Settings → API Keys & Webhooks → Webhook URL: https://YOUR-DOMAIN/api/paystack/webhook */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!isValidWebhookSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(raw) as { event: string; data?: { reference?: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    // Re-verifies with Paystack and is idempotent, so retries are safe.
    await confirmPayment(event.data.reference);
  }
  return NextResponse.json({ received: true });
}
