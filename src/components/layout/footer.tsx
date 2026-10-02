import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo, Snowflake } from "@/components/brand/logo";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/brand/social-icons";
import { footerLinks, site } from "@/lib/site";
import { NewsletterForm } from "./newsletter-form";

export function Footer({ storeAddress }: { storeAddress: string }) {
  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-white">
      <Snowflake className="pointer-events-none absolute -top-16 -right-16 h-80 w-80 text-white/[0.03]" />

      <div className="container-x relative">
        <div className="flex flex-col gap-6 border-b border-white/10 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo tone="light" />
            <p className="mt-3 max-w-sm text-[14px] text-white/60">{site.tagline}</p>
          </div>
          <div className="flex items-center gap-3">
            <SocialLink href={site.socials.instagram} label="Instagram"><InstagramIcon className="h-5 w-5" /></SocialLink>
            <SocialLink href={site.socials.tiktok} label="TikTok"><TikTokIcon className="h-5 w-5" /></SocialLink>
            <SocialLink href={site.whatsappLink} label="WhatsApp"><WhatsAppIcon className="h-5 w-5" /></SocialLink>
          </div>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.4fr]">
          <FooterColumn title="Company" links={footerLinks.company} />
          <FooterColumn title="Shop" links={footerLinks.shop} />
          <div>
            <FooterColumn title="Policies" links={footerLinks.policies} />
            <ul className="mt-6 space-y-2.5 text-[14px] text-white/70">
              <li className="flex gap-2.5"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/40" /> <a href={site.whatsappLink} className="hover:text-white">{site.whatsapp}</a></li>
              <li className="flex gap-2.5"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-white/40" /> <a href={`mailto:${site.email}`} className="break-all hover:text-white">{site.email}</a></li>
              <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/40" /> <Link href="/store" className="hover:text-white">{storeAddress}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[15px] font-semibold">Get the best deals first</h3>
            <p className="mt-2 text-[14px] text-white/60">New arrivals, price drops and restocks — straight to your inbox. No spam.</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-[12.5px] text-white/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved. · RC {site.rcNumber}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span>Secure payments by</span>
            <span className="rounded-md bg-white/10 px-2 py-1 font-semibold text-white/80">Paystack</span>
            <span className="rounded-md bg-white/10 px-2 py-1 font-semibold text-white/80">Visa</span>
            <span className="rounded-md bg-white/10 px-2 py-1 font-semibold text-white/80">Mastercard</span>
            <span className="rounded-md bg-white/10 px-2 py-1 font-semibold text-white/80">Verve</span>
            <span className="rounded-md bg-white/10 px-2 py-1 font-semibold text-white/80">Transfer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[14px] text-white/65 transition-colors hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${site.name} on ${label}`}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-brand-600"
    >
      {children}
    </a>
  );
}
