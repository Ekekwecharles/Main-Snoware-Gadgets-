"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  consumeToken,
  emailSchema,
  fieldErrors,
  passwordSchema,
  registerUser,
  requestPasswordReset,
  resendVerification,
  type FormState,
} from "@/lib/auth-core";

export type { FormState };

/* ───────────── Sign up ───────────── */

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return registerUser(Object.fromEntries(formData));
}

export async function resendVerificationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return resendVerification(formData.get("email"));
}

export async function verifyEmail(email: string, token: string) {
  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success || !token) return false;
  const ok = await consumeToken("verify", parsedEmail.data, token);
  if (!ok) return false;
  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.email, parsedEmail.data));
  return true;
}

/* ───────────── Sign in / out ───────────── */

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const callbackUrl = String(formData.get("callbackUrl") || "/account");
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/account",
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      if ("code" in err && err.code === "email_not_verified")
        return { ok: false, message: "Please verify your email first. Check your inbox for the link.", fieldErrors: { unverified: "1" } };
      return { ok: false, message: "Incorrect email or password." };
    }
    throw err; // Let Next.js handle the redirect thrown on success.
  }
}

export async function googleSignInAction(formData: FormData) {
  const callbackUrl = String(formData.get("callbackUrl") || "/account");
  await signIn("google", { redirectTo: callbackUrl.startsWith("/") ? callbackUrl : "/account" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/* ───────────── Password reset ───────────── */

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return requestPasswordReset(formData.get("email"));
}

const resetSchema = z
  .object({ email: emailSchema, token: z.string().min(10), password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const { email, token, password } = parsed.data;
  const ok = await consumeToken("reset", email, token);
  if (!ok) return { ok: false, message: "This reset link is invalid or has expired. Please request a new one." };
  // Completing a reset proves inbox ownership, so the email counts as verified too.
  await db.update(users).set({ passwordHash: await bcrypt.hash(password, 12), emailVerified: new Date() }).where(eq(users.email, email));
  return { ok: true, message: "Your password has been reset. You can now sign in." };
}
