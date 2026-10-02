"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { sendContactAction } from "@/app/actions/contact";
import { AuthField, Notice } from "@/components/auth/auth-shell";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactAction, null);
  if (state?.ok) return <Notice ok>{state.message}</Notice>;
  return (
    <form action={action} className="space-y-4">
      {state?.message && <Notice>{state.message}</Notice>}
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField label="Name" name="name" required autoComplete="name" />
        <AuthField label="Phone (optional)" name="phone" type="tel" autoComplete="tel" />
      </div>
      <AuthField label="Email" name="email" type="email" required autoComplete="email" />
      <div>
        <label htmlFor="message" className="mb-1.5 block text-[13.5px] font-semibold">Message</label>
        <textarea id="message" name="message" rows={5} required className="w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-ink" />
      </div>
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <button disabled={pending} className="flex h-12 items-center gap-2 rounded-full bg-ink px-7 font-semibold text-white disabled:opacity-60">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Send message
      </button>
    </form>
  );
}
