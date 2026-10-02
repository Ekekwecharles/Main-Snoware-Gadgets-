import { Snowflake } from "@/components/brand/logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-mist/70">
      <Snowflake className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 text-navy-900/[0.04]" />
      <div className="container-x relative flex min-h-[70vh] items-center justify-center py-14">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-lift sm:p-9">
          <h1 className="text-[26px] font-extrabold">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[14.5px] text-muted">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AuthField({ label, name, error, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-[13.5px] font-semibold">{label}</label>
      <input
        id={name}
        name={name}
        aria-invalid={!!error}
        className={`h-12 w-full rounded-xl border bg-white px-4 text-[15px] outline-none transition focus:border-ink ${error ? "border-brand-600" : "border-line"}`}
        {...rest}
      />
      {error && <p className="mt-1 text-[12.5px] text-brand-700">{error}</p>}
    </div>
  );
}

export function Notice({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <div role="status" className={`rounded-xl px-4 py-3 text-[14px] ${ok ? "bg-emerald-50 text-emerald-800" : "bg-brand-50 text-brand-800"}`}>
      {children}
    </div>
  );
}
