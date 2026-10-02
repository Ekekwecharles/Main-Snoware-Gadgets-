"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExternalLink, FolderTree, Image as ImageIcon, LayoutDashboard, LogOut, Mail, Menu, Package, Settings, ShoppingCart, Truck, Users, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { signOutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/delivery", label: "Delivery zones", icon: Truck },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/settings", label: "Store settings", icon: Settings },
];

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo tone="light" href="/admin" />
        <button onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-white/10 lg:hidden" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Admin">
        {nav.map((n) => {
          const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition", active ? "bg-white text-ink" : "text-white/70 hover:bg-white/10 hover:text-white")}
            >
              <n.icon className="h-4.5 w-4.5" /> {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-white/70 hover:bg-white/10 hover:text-white">
          <ExternalLink className="h-4.5 w-4.5" /> View store
        </Link>
        <form action={signOutAction}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-white/70 hover:bg-white/10 hover:text-white">
            <LogOut className="h-4.5 w-4.5" /> Sign out
          </button>
        </form>
        <p className="truncate px-3 pt-2 text-[12px] text-white/40">Signed in as {userName}</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 bg-ink px-4 text-white lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-full p-1.5 hover:bg-white/10" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-semibold">Snoware Admin</span>
      </div>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 bg-ink text-white lg:block">{content}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-slide-in-left bg-ink text-white">{content}</aside>
        </div>
      )}
    </>
  );
}
