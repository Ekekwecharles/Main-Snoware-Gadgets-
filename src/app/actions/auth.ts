"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/mail";

export type FormState = { ok?: boolean; message?: string; fieldErrors?: Record<string, string> } | null;

const emailSchema = z.email("Enter a valid email address").transform((v) => v.toLowerCase().trim());
const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

/** Creates a single-use token, replacing older ones for the same purpose. Only the hash is stored. */
async function issueToken(purpose: "verify" | "reset", email: string, ttlMs: number) {
  const identifier = `${purpose}:${email}`;
  const token = crypto.randomBytes(32).toString("hex");
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier));
  await db.insert(verificationTokens).values({ identifier, token: hashToken(token), expires: new Date(Date.now() + ttlMs) });
  return token;
}

async function consumeToken(purpose: "verify" | "reset", email: string, token: string) {
  const identifier = `${purpose}:${email}`;
  const [row] = await db
    .delete(verificationTokens)
    .where(and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, hashToken(token)), gt(verificationTokens.expires, new Date())))
    .returning();
  return !!row;
}

function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of error.issues) out[i.path.join(".")] ??= i.message;
  return out;
}

/* ───────────── Sign up ───────────── */

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: emailSchema,
  password: passwordSchema,
});

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const { name, email, password } = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing?.passwordHash) {
    return { ok: false, fieldErrors: { email: "An account with this email already exists. Sign in instead." } };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  if (existing) {
    // Account created earlier via Google — add a password to it.
    await db.update(users).set({ passwordHash, name: existing.name ?? name }).where(eq(users.id, existing.id));
    if (existing.emailVerified) return { ok: true, message: "Password added. You can now sign in with your email and password." };
  } else {
    await db.insert(users).values({ name, email, passwordHash });
  }

  const token = await issueToken("verify", email, 24 * 60 * 60 * 1000);
  await sendVerificationEmail(email, token);
  return { ok: true, message: `We've sent a verification link to ${email}. Open it to activate your account.` };
}

export async function resendVerificationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { ok: false, message: "Enter a valid email address." };
  const user = await db.query.users.findFirst({ where: eq(users.email, email.data) });
  if (user && !user.emailVerified) {
    const token = await issueToken("verify", email.data, 24 * 60 * 60 * 1000);
    await sendVerificationEmail(email.data, token);
  }
  // Same response either way so emails can't be enumerated.
  return { ok: true, message: "If that account needs verifying, a new link is on its way." };
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
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { ok: false, fieldErrors: { email: "Enter a valid email address" } };
  const user = await db.query.users.findFirst({ where: eq(users.email, email.data) });
  if (user) {
    const token = await issueToken("reset", email.data, 60 * 60 * 1000);
    await sendPasswordResetEmail(email.data, token);
  }
  return { ok: true, message: "If an account exists for that email, we've sent a reset link. It expires in 1 hour." };
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
