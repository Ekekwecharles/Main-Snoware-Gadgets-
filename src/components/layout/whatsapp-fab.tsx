"use client";

import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { whatsappMessageLink } from "@/lib/site";

export function WhatsAppFab() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) return null;
  return (
    <a
      href={whatsappMessageLink("Hi Snoware Gadgets! I'd like to make an enquiry.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-lift transition hover:pr-5 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="h-7 w-7" />
      <span className="hidden max-w-0 overflow-hidden text-[14px] font-semibold whitespace-nowrap transition-all duration-300 group-hover:max-w-40 sm:inline">
        Chat with us
      </span>
    </a>
  );
}
