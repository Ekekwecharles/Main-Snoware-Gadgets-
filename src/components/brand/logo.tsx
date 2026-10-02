import Link from "next/link";
import { cn } from "@/lib/utils";

/** Power-button "o" from the Snoware logo. */
function PowerO({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("inline-block", className)} fill="none">
      <path d="M7.05 6.4a8 8 0 1 0 9.9 0" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M12 3v8.2" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export function Snowflake({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {[0, 60, 120].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 24 24)`}>
          <path d="M24 4v40" />
          <path d="M24 10l-4-4M24 10l4-4M24 38l-4 4M24 38l4 4" />
          <path d="M24 17l-6-5M24 17l6-5M24 31l-6 5M24 31l6 5" />
        </g>
      ))}
    </svg>
  );
}

type LogoProps = { tone?: "light" | "dark"; className?: string; showTagline?: boolean; href?: string | null };

/** Wordmark recreated from snoware.png so it stays crisp at every size. */
export function Logo({ tone = "light", className, showTagline = true, href = "/" }: LogoProps) {
  const mark = (
    <span className={cn("inline-flex flex-col leading-none select-none", className)}>
      <span className="font-display text-[1.6rem] font-extrabold tracking-[-0.04em]">
        <span className="text-brand-600">Sn</span>
        <PowerO className="mx-[0.02em] -mt-[0.12em] h-[0.78em] w-[0.78em] text-brand-600" />
        <span className={tone === "light" ? "text-white" : "text-navy-900"}>ware</span>
      </span>
      {showTagline && (
        <span
          className={cn(
            "mt-0.5 self-end font-display text-[0.62rem] font-bold uppercase tracking-[0.32em]",
            tone === "light" ? "text-white/60" : "text-navy-700/70",
          )}
        >
          Gadgets
        </span>
      )}
    </span>
  );
  if (!href) return mark;
  return (
    <Link href={href} aria-label="Snoware Gadgets — home" className="inline-flex shrink-0">
      {mark}
    </Link>
  );
}
