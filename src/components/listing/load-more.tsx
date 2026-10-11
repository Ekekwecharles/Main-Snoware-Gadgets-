"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

/** Raises `?show=` so the server renders the next batch; the URL keeps the position if the shopper shares or goes back. */
export function LoadMore({ shown, total, step }: { shown: number; total: number; step: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const loadMore = () => {
    const next = new URLSearchParams(params.toString());
    next.set("show", String(shown + step));
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <p className="text-[13px] text-muted">
        Showing <span className="font-semibold text-ink">{shown}</span> of {total}
      </p>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${(shown / total) * 100}%` }} />
      </div>
      <button
        onClick={loadMore}
        disabled={pending}
        className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-full px-8 text-[14px] font-semibold whitespace-nowrap ring-1 ring-ink transition hover:bg-ink hover:text-white disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Loading…" : "Load more"}
      </button>
    </div>
  );
}
