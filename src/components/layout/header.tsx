"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Search, ShoppingBag, User, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { DeviceIcon } from "@/components/brand/device-icon";
import { megaMenu, type MenuGroup } from "@/lib/site";
import { useCart, cartCount } from "@/store/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "./search-overlay";
import { MobileNav } from "./mobile-nav";

type HeaderUser = { name?: string | null; role: "customer" | "admin" } | null;

const promoTone: Record<MenuGroup["promo"]["tone"], string> = {
  red: "bg-brand-600 hover:bg-brand-700",
  navy: "bg-navy-800 hover:bg-navy-700",
  blue: "bg-sky hover:bg-[#006ae0]",
};

export function Header({ user, announcement }: { user: HeaderUser; announcement?: string }) {
  const pathname = usePathname();
  const [active, setActive] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.open);
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(items) : 0;

  // Close menus on navigation (adjusting state during render, per React's guidance, instead of in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setActive(null);
    setMobileOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openMenu = (i: number) => {
    clearTimeout(closeTimer.current);
    setActive(i);
  };
  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActive(null), 120);
  };

  const group = active != null ? megaMenu[active] : null;

  return (
    <>
      {announcement && (
        <div className="bg-navy-900 text-white">
          <p className="container-x truncate py-2 text-center text-[12px] font-medium tracking-wide text-white/85">{announcement}</p>
        </div>
      )}
      <header className="sticky top-0 z-40 bg-ink/95 text-white backdrop-blur supports-[backdrop-filter]:bg-ink/85" onMouseLeave={scheduleClose}>
        <div className="container-x flex h-16 items-center gap-3 lg:h-[68px]">
          <button
            className="-ml-2 rounded-full p-2 text-white/90 hover:bg-white/10 lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <Logo tone="light" className="scale-90 sm:scale-100" />

          <nav aria-label="Main" className="mx-auto hidden h-full lg:flex">
            <ul className="flex h-full items-center">
              {megaMenu.map((g, i) => (
                <li key={g.label} className="h-full" onMouseEnter={() => openMenu(i)}>
                  <Link
                    href={g.href}
                    aria-expanded={active === i}
                    onFocus={() => openMenu(i)}
                    className={cn(
                      "flex h-full items-center gap-1 px-2.5 text-[13.5px] font-medium tracking-wide transition-colors xl:px-3.5",
                      active === i || pathname.startsWith(g.href) ? "text-[#4aa3ff]" : "text-white/90 hover:text-white",
                    )}
                  >
                    {g.label}
                    <ChevronDown className={cn("h-3.5 w-3.5 opacity-70 transition-transform", active === i && "rotate-180")} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-0.5 lg:ml-0">
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-full p-2.5 text-white/90 hover:bg-white/10 hover:text-white"
              aria-label="Search products"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href={user ? (user.role === "admin" ? "/admin" : "/account") : "/sign-in"}
              className="hidden rounded-full p-2.5 text-white/90 hover:bg-white/10 hover:text-white sm:inline-flex"
              aria-label={user ? "Your account" : "Sign in"}
              title={user?.name ?? "Sign in"}
            >
              <User className="h-5 w-5" />
            </Link>
            <button
              onClick={openCart}
              className="relative rounded-full p-2.5 text-white/90 hover:bg-white/10 hover:text-white"
              aria-label={`Open cart, ${count} items`}
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute top-1 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mega menu */}
        {group && (
          <div
            className="absolute inset-x-0 top-full hidden animate-fade-in lg:block"
            onMouseEnter={() => clearTimeout(closeTimer.current)}
            onMouseLeave={scheduleClose}
          >
            <div className="container-x">
              <div className="overflow-hidden rounded-b-2xl bg-ink shadow-lift ring-1 ring-white/5">
                <ul className="flex flex-wrap justify-center gap-1 px-6 py-7">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="group flex w-[132px] flex-col items-center gap-3 rounded-xl px-2 py-3 text-center transition-colors hover:bg-white/5"
                      >
                        <DeviceIcon icon={item.icon} className="h-14 w-14 text-white/85 transition-transform duration-300 group-hover:-translate-y-1 group-hover:text-white" />
                        <span className="text-[14px] leading-tight font-medium text-white/90 group-hover:text-white">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={group.promo.href}
                  className={cn("flex items-center justify-center gap-2 py-3 text-[13px] font-medium tracking-wide text-white transition-colors", promoTone[group.promo.tone])}
                >
                  {group.promo.text}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Dim page while mega menu is open */}
      {group && <div className="fixed inset-0 z-30 hidden bg-black/30 lg:block" onMouseEnter={scheduleClose} aria-hidden />}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} user={user} />
    </>
  );
}
