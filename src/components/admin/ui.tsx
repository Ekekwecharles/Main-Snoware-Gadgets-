import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-extrabold sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1 text-[14.5px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl bg-white p-5 shadow-card sm:p-6", className)}>{children}</div>;
}

export const inputClass = "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[14.5px] outline-none transition focus:border-ink";
export const textareaClass = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14.5px] outline-none transition focus:border-ink";
export const buttonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[14px] font-semibold text-white transition hover:bg-ink-soft disabled:opacity-60";
export const secondaryButtonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold ring-1 ring-line transition hover:ring-ink disabled:opacity-60";

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold">
      {children} {hint && <span className="font-normal text-muted">— {hint}</span>}
    </label>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tones: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    paid: "bg-sky/10 text-sky",
    processing: "bg-indigo-50 text-indigo-700",
    shipped: "bg-violet-50 text-violet-700",
    ready_for_pickup: "bg-violet-50 text-violet-700",
    delivered: "bg-emerald-50 text-success",
    cancelled: "bg-brand-50 text-brand-700",
    unpaid: "bg-amber-50 text-amber-700",
    failed: "bg-brand-50 text-brand-700",
  };
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[12px] font-semibold capitalize", tones[status] ?? "bg-mist")}>{status.replace(/_/g, " ")}</span>;
}
