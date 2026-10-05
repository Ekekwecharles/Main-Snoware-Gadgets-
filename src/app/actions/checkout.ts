"use server";

import { auth } from "@/auth";
import { createCheckout, type CheckoutInput, type CheckoutResult } from "@/lib/checkout";

export type { CheckoutInput, CheckoutResult };

export async function startCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const session = await auth();
  return createCheckout(input, { userId: session?.user?.id ?? null });
}
