"use server";

import { z } from "zod";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

export type ActionResult = { ok: boolean; message: string } | null;

export async function subscribeNewsletter(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { ok: false, message: "Please enter a valid email address." };
  await db.insert(newsletterSubscribers).values({ email: parsed.data }).onConflictDoNothing();
  return { ok: true, message: "You're in! Watch your inbox for our next deal." };
}
