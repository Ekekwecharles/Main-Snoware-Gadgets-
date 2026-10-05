import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, verificationTokens, type User } from "@/db/schema";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/mail";

/**
 * Account logic shared by the website (server actions / Auth.js) and the mobile API,
 * so both sign people into the same `users` rows with the same rules.
 */

export type FormState = { ok?: boolean; message?: string; fieldErrors?: Record<string, string> } | null;

export const emailSchema = z.email("Enter a valid email address").transform((v) => v.toLowerCase().trim());
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

/** Creates a single-use token, replacing older ones for the same purpose. Only the hash is stored. */
export async function issueToken(purpose: "verify" | "reset", email: string, ttlMs: number) {
  const identifier = `${purpose}:${email}`;
  const token = crypto.randomBytes(32).toString("hex");
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier));
  await db.insert(verificationTokens).values({ identifier, token: hashToken(token), expires: new Date(Date.now() + ttlMs) });
  return token;
}

export async function consumeToken(purpose: "verify" | "reset", email: string, token: string) {
  const identifier = `${purpose}:${email}`;
  const [row] = await db
    .delete(verificationTokens)
    .where(and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, hashToken(token)), gt(verificationTokens.expires, new Date())))
    .returning();
  return !!row;
}

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of error.issues) out[i.path.join(".")] ??= i.message;
  return out;
}

/* ───────────── Email + password ───────────── */

const credentialsSchema = z.object({ email: emailSchema, password: z.string().min(1) });

export type CredentialsResult = { ok: true; user: User } | { ok: false; reason: "invalid" | "email_not_verified" };

export async function verifyCredentials(raw: unknown): Promise<CredentialsResult> {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const user = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
  if (!user?.passwordHash) return { ok: false, reason: "invalid" };
  if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) return { ok: false, reason: "invalid" };
  if (!user.emailVerified) return { ok: false, reason: "email_not_verified" };
  return { ok: true, user };
}

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: emailSchema,
  password: passwordSchema,
});

export async function registerUser(raw: unknown): Promise<FormState> {
  const parsed = signUpSchema.safeParse(raw);
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

export async function resendVerification(rawEmail: unknown): Promise<FormState> {
  const email = emailSchema.safeParse(rawEmail);
  if (!email.success) return { ok: false, message: "Enter a valid email address." };
  const user = await db.query.users.findFirst({ where: eq(users.email, email.data) });
  if (user && !user.emailVerified) {
    const token = await issueToken("verify", email.data, 24 * 60 * 60 * 1000);
    await sendVerificationEmail(email.data, token);
  }
  // Same response either way so emails can't be enumerated.
  return { ok: true, message: "If that account needs verifying, a new link is on its way." };
}

export async function requestPasswordReset(rawEmail: unknown): Promise<FormState> {
  const email = emailSchema.safeParse(rawEmail);
  if (!email.success) return { ok: false, fieldErrors: { email: "Enter a valid email address" } };
  const user = await db.query.users.findFirst({ where: eq(users.email, email.data) });
  if (user) {
    const token = await issueToken("reset", email.data, 60 * 60 * 1000);
    await sendPasswordResetEmail(email.data, token);
  }
  return { ok: true, message: "If an account exists for that email, we've sent a reset link. It expires in 1 hour." };
}

/* ───────────── Profile ───────────── */

const profileSchema = z.object({ name: z.string().trim().min(2, "Enter your name"), phone: z.string().trim().max(20).optional() });

export async function updateProfile(userId: string, raw: unknown): Promise<FormState> {
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  await db.update(users).set({ name: parsed.data.name, phone: parsed.data.phone || null }).where(eq(users.id, userId));
  return { ok: true, message: "Profile updated." };
}
