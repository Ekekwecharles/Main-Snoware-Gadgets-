"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({ action, label, confirmText }: { action: () => Promise<void>; label: string; confirmText: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => confirm(confirmText) && startTransition(() => action())}
      className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand-700 hover:underline disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" /> {pending ? "Deleting…" : label}
    </button>
  );
}
