import type { Metadata } from "next";
import { Clock, Mail, MapPin } from "lucide-react";
import { ContentPage } from "@/components/content/content-page";
import { ContactForm } from "@/components/content/contact-form";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/brand/social-icons";
import { getSettings } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const s = await getSettings();
  const channels = [
    { icon: WhatsAppIcon, label: "WhatsApp", value: site.whatsapp, href: site.whatsappLink, tone: "bg-[#25D366] text-white" },
    { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}`, tone: "bg-ink text-white" },
    { icon: InstagramIcon, label: "Instagram", value: site.socials.handle, href: site.socials.instagram, tone: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white" },
    { icon: TikTokIcon, label: "TikTok", value: site.socials.handle, href: site.socials.tiktok, tone: "bg-ink text-white" },
  ];

  return (
    <ContentPage eyebrow="We're here to help" title="Contact Snoware Gadgets" intro="Questions about a product, an order or a trade-in? WhatsApp is the fastest way to reach us.">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          {channels.map((c) => (
            <a key={c.label} href={c.href} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-2xl p-4 ring-1 ring-line transition hover:shadow-card hover:ring-transparent">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full ${c.tone}`}>
                <c.icon className="h-5.5 w-5.5" />
              </span>
              <span>
                <span className="block text-[13px] text-muted">{c.label}</span>
                <span className="font-semibold break-all">{c.value}</span>
              </span>
            </a>
          ))}
          <div className="flex gap-4 rounded-2xl bg-mist p-4">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <div className="text-[14.5px]">
              <p className="font-semibold">{s.store_address}</p>
              <p className="mt-1 flex items-center gap-1.5 text-muted"><Clock className="h-4 w-4" /> {s.store_hours}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl p-6 shadow-card ring-1 ring-line sm:p-8">
          <h2 className="mb-5 text-[22px] font-bold">Send us a message</h2>
          <ContactForm />
        </div>
      </div>
    </ContentPage>
  );
}
