"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { cloudinaryConfigured, deletePrivateFile, uploadPrivateFile } from "@/lib/cloudinary";
import { sendPaymentProofAlert } from "@/lib/mail";
import { getOrderByReference } from "@/lib/orders";

const MAX_BYTES = 5 * 1024 * 1024; // the page shrinks big photos first; Vercel rejects requests over ~4.5MB anyway

/** Reads the first bytes so a renamed file can't pass as an image. */
function detectType(b: Buffer): { ext: string; mime: string } | null {
  const head = b.subarray(0, 12).toString("latin1");
  if (head.startsWith("\x89PNG")) return { ext: "png", mime: "image/png" };
  if (b[0] === 0xff && b[1] === 0xd8) return { ext: "jpg", mime: "image/jpeg" };
  if (head.startsWith("RIFF") && head.slice(8, 12) === "WEBP") return { ext: "webp", mime: "image/webp" };
  if (head.slice(4, 12) === "ftypheic" || head.slice(4, 12) === "ftypheix" || head.slice(4, 12) === "ftypmif1") return { ext: "heic", mime: "image/heic" };
  if (head.startsWith("%PDF")) return { ext: "pdf", mime: "application/pdf" };
  return null;
}

/**
 * A customer uploads their bank-transfer screenshot from the order page. The order reference is
 * unguessable, so holding it is what authorises the upload (same as viewing the order page).
 * The file is stored privately and emailed to the shop straight away.
 */
export async function uploadPaymentProof(reference: string, formData: FormData): Promise<{ ok: boolean; message: string }> {
  const order = await getOrderByReference(String(reference));
  if (!order || order.paymentMethod !== "bank_transfer") return { ok: false, message: "Order not found." };
  if (order.paymentStatus === "paid") return { ok: false, message: "This order is already paid — no need to upload anything." };
  if (order.status === "cancelled") return { ok: false, message: "This order was cancelled. Please contact us on WhatsApp." };
  if (order.paymentProofAt && Date.now() - order.paymentProofAt.getTime() < 20_000)
    return { ok: false, message: "We just received a screenshot. Please wait a few seconds before sending another." };

  const file = formData.get("proof");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose your payment screenshot first." };
  if (file.size > MAX_BYTES) return { ok: false, message: "That file is too large. Please upload a screenshot under 5MB." };
  const bytes = Buffer.from(await file.arrayBuffer());
  const type = detectType(bytes);
  if (!type) return { ok: false, message: "Please upload an image (JPG, PNG) or a PDF receipt." };

  let stored: { publicId: string; format: string } | null = null;
  if (cloudinaryConfigured()) {
    try {
      stored = await uploadPrivateFile(bytes, "snoware/payment-proofs");
    } catch (err) {
      console.error("[payment proof] upload failed", err);
      return { ok: false, message: "Upload failed. Please try again, or send the screenshot to us on WhatsApp." };
    }
  }

  const [updated] = await db
    .update(orders)
    .set({ paymentProofPublicId: stored?.publicId ?? null, paymentProofFormat: stored?.format ?? null, paymentProofAt: new Date() })
    .where(eq(orders.id, order.id))
    .returning();
  if (order.paymentProofPublicId && order.paymentProofPublicId !== stored?.publicId) await deletePrivateFile(order.paymentProofPublicId);

  await sendPaymentProofAlert(updated, order.items, { filename: `${order.reference}-payment.${type.ext}`, content: bytes, contentType: type.mime });

  revalidatePath(`/order/${order.reference}`);
  revalidatePath(`/admin/orders/${order.id}`);
  return { ok: true, message: "Screenshot received! We'll confirm your payment and email you shortly." };
}
