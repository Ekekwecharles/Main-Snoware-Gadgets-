"use server";

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, wishlist } from "@/db/schema";
import type { FormState } from "./auth";

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Please sign in again." };
  const parsed = z
    .object({ name: z.string().trim().min(2, "Enter your name"), phone: z.string().trim().max(20).optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  await db.update(users).set({ name: parsed.data.name, phone: parsed.data.phone || null }).where(eq(users.id, session.user.id));
  revalidatePath("/account", "layout");
  return { ok: true, message: "Profile updated." };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Please sign in again." };
  const parsed = z
    .object({
      current: z.string().optional(),
      password: z.string().min(8, "Use at least 8 characters").regex(/[A-Za-z]/, "Include a letter").regex(/\d/, "Include a number"),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  if (!user) return { ok: false, message: "Account not found." };
  if (user.passwordHash && !(await bcrypt.compare(parsed.data.current ?? "", user.passwordHash))) {
    return { ok: false, message: "Your current password is incorrect." };
  }
  await db.update(users).set({ passwordHash: await bcrypt.hash(parsed.data.password, 12) }).where(eq(users.id, user.id));
  return { ok: true, message: user.passwordHash ? "Password changed." : "Password set — you can now also sign in with email." };
}

export async function toggleWishlist(productId: number) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, signedIn: false };
  const where = and(eq(wishlist.userId, session.user.id), eq(wishlist.productId, productId));
  const existing = await db.query.wishlist.findFirst({ where });
  if (existing) await db.delete(wishlist).where(where);
  else await db.insert(wishlist).values({ userId: session.user.id, productId });
  revalidatePath("/account/wishlist");
  return { ok: true as const, signedIn: true, saved: !existing };
}
