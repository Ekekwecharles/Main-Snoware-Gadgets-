"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { updateProfile, type FormState } from "@/lib/auth-core";
import { toggleWishlistItem } from "@/lib/wishlist";

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Please sign in again." };
  const result = await updateProfile(session.user.id, Object.fromEntries(formData));
  if (result?.ok) revalidatePath("/account", "layout");
  return result;
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
  const saved = await toggleWishlistItem(session.user.id, productId);
  revalidatePath("/account/wishlist");
  return { ok: true as const, signedIn: true, saved };
}
