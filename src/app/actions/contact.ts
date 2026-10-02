"use server";

import { z } from "zod";
import { sendContactMessage } from "@/lib/mail";
import type { ActionResult } from "./newsletter";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.email("Enter a valid email"),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(3000),
  company: z.string().max(0).optional(), // honeypot — bots fill this in
});

export async function sendContactAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  await sendContactMessage(parsed.data);
  return { ok: true, message: "Thanks! We've received your message and will reply shortly — usually within a few hours." };
}
