"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, X, User, Package, Store, MessageCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { DeviceIcon } from "@/components/brand/device-icon";
import { megaMenu, site } from "@/lib/site";
import { cn } from "@/lib/utils";

type Props = { open: boolean; onClose: () => void; user: { name?: string | null; role: string } | null };

export function MobileNav({ open, onClose, user }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal aria-label="Menu">
      <div className="absolute inset-0 animate-fade-in bg-ink/50" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-ink text-white shadow-lift animate-slide-in-left">
        <div className="flex h-16 items-center justify-between px-4">
          <Logo tone="light" />
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Close menu">
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-6" aria-label="Mobile">
          <ul>
            {megaMenu.map((g) => {
              const isOpen = expanded === g.label;
              return (
                <li key={g.label} className="border-b border-white/10">
                  <button
                    onClick={() => setExpanded(isOpen ? null : g.label)}
                    className="flex w-full items-center justify-between px-3 py-4 text-left text-[16px] font-medium"
                    aria-expanded={isOpen}
                  >
                    {g.label}
                    <ChevronDown className={cn("h-5 w-5 text-white/60 transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <ul className="grid animate-fade-in grid-cols-3 gap-1 px-1 pb-4">
                      {g.items.map((item) => (
                        <li key={item.label}>
                          <Link href={item.href} onClick={onClose} className="flex flex-col items-center gap-2 rounded-xl p-2 text-center hover:bg-white/5">
                            <DeviceIcon icon={item.icon} className="h-10 w-10 text-white/80" />
                            <span className="text-[12px] leading-tight text-white/85">{item.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          <ul className="mt-4 space-y-1 px-1">
            <li>
              <Link href={user ? "/account" : "/sign-in"} onClick={onClose} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5">
                <User className="h-5 w-5 text-white/60" /> {user ? `Hi, ${user.name?.split(" ")[0] ?? "there"}` : "Sign in / Create account"}
              </Link>
            </li>
            {user?.role === "admin" && (
              <li>
                <Link href="/admin" onClick={onClose} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5">
                  <Package className="h-5 w-5 text-white/60" /> Admin dashboard
                </Link>
              </li>
            )}
            <li>
              <Link href="/store" onClick={onClose} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5">
                <Store className="h-5 w-5 text-white/60" /> Visit our store
              </Link>
            </li>
            <li>
              <a href={site.whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/5">
                <MessageCircle className="h-5 w-5 text-white/60" /> Chat on WhatsApp
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
