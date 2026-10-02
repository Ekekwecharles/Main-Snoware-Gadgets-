"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, Package, UserRound } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "My orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/profile", label: "Profile & security", icon: UserRound },
];

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-[14.5px] font-medium transition",
            pathname === l.href ? "bg-ink text-white" : "bg-mist hover:bg-line lg:bg-transparent lg:hover:bg-mist",
          )}
        >
          <l.icon className="h-4.5 w-4.5" /> {l.label}
        </Link>
      ))}
      {isAdmin && (
        <Link href="/admin" className="flex shrink-0 items-center gap-3 rounded-xl bg-brand-50 px-4 py-3 text-[14.5px] font-semibold text-brand-700 hover:bg-brand-100">
          <LayoutDashboard className="h-4.5 w-4.5" /> Admin dashboard
        </Link>
      )}
      <form action={signOutAction} className="shrink-0 lg:mt-4 lg:border-t lg:border-line lg:pt-4">
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14.5px] font-medium text-muted hover:bg-mist hover:text-ink">
          <LogOut className="h-4.5 w-4.5" /> Sign out
        </button>
      </form>
    </nav>
  );
}
