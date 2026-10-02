"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { site } from "@/lib/site";

export default function StoreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="text-[28px] font-extrabold sm:text-[34px]">Something went wrong on our side</h1>
      <p className="mt-2 max-w-md text-muted">Please try again in a moment. If it keeps happening, message us on WhatsApp and we'll help you complete your order.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-white">
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
        <Link href="/" className="rounded-full px-6 py-3 font-semibold ring-1 ring-ink">Go home</Link>
        <a href={site.whatsappLink} target="_blank" rel="noreferrer" className="rounded-full bg-[#25D366] px-6 py-3 font-semibold text-white">WhatsApp us</a>
      </div>
    </div>
  );
}
