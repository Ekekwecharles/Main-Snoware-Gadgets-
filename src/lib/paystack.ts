import "server-only";
import crypto from "node:crypto";

const PAYSTACK_API = "https://api.paystack.co";

/**
 * Card payments are offered only when explicitly switched on (PAYSTACK_ENABLED=true) with a key set,
 * so test keys left in the environment can never take "payments" on the live site.
 */
export function paystackEnabled() {
  return process.env.PAYSTACK_ENABLED === "true" && Boolean(process.env.PAYSTACK_SECRET_KEY);
}

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

type PaystackResponse<T> = { status: boolean; message: string; data: T };

async function paystack<T>(path: string, init?: RequestInit): Promise<PaystackResponse<T>> {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  return res.json();
}

export async function initializeTransaction(input: {
  email: string;
  /** Whole naira — converted to kobo here */
  amount: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  return paystack<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amount * 100,
      reference: input.reference,
      callback_url: input.callbackUrl,
      currency: "NGN",
      metadata: input.metadata,
    }),
  });
}

export type PaystackTransaction = {
  status: "success" | "failed" | "abandoned" | "ongoing" | "pending" | "reversed";
  reference: string;
  /** kobo */
  amount: number;
  currency: string;
  paid_at: string | null;
};

export async function verifyTransaction(reference: string) {
  return paystack<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function isValidWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const hash = crypto.createHmac("sha512", secret()).update(rawBody).digest("hex");
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
