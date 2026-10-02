"use client";

import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminResult } from "@/app/actions/admin";
import { buttonClass } from "./ui";

type Action = (prev: AdminResult | null, fd: FormData) => Promise<AdminResult>;

/** Small wrapper: runs an admin server action and toasts the result. */
export function ActionForm({ action, children, submitLabel = "Save", className }: { action: Action; children: React.ReactNode; submitLabel?: string; className?: string }) {
  const [state, formAction, pending] = useActionState(action, null);
  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);
  return (
    <form action={formAction} className={className}>
      {children}
      <button disabled={pending} className={`${buttonClass} mt-4`}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} {submitLabel}
      </button>
    </form>
  );
}
