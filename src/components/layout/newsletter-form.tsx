"use client";

import { useActionState } from "react";
import { subscribeNewsletter } from "@/app/actions/newsletter";

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletter, null);
  return (
    <form action={action} className="mt-4">
      <div className="flex overflow-hidden rounded-full bg-white/10 ring-1 ring-white/15 focus-within:ring-white/40">
        <label htmlFor="newsletter-email" className="sr-only">Email address</label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="min-w-0 flex-1 bg-transparent px-5 py-3 text-[14px] outline-none placeholder:text-white/40"
        />
        <button disabled={pending} className="m-1 rounded-full bg-white px-5 text-[14px] font-semibold text-ink transition hover:bg-brand-600 hover:text-white disabled:opacity-60">
          {pending ? "…" : "Subscribe"}
        </button>
      </div>
      {state?.message && (
        <p className={`mt-2 text-[13px] ${state.ok ? "text-emerald-400" : "text-brand-200"}`} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
