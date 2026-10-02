import type { Metadata } from "next";
import { Clock, MapPin, Phone, Store } from "lucide-react";
import { ContentPage } from "@/components/content/content-page";
import { getSettings } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Visit Our Store", description: "Find Snoware Gadgets — opening hours, directions and free in-store pickup." };

export default async function StorePage() {
  const s = await getSettings();
  return (
    <ContentPage eyebrow="Visit us" title="Our store" intro="See devices in person, test before you buy, or collect your online order for free.">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4 text-[15px]">
          <div className="flex gap-4 rounded-2xl bg-mist p-5">
            <MapPin className="h-6 w-6 shrink-0 text-brand-600" />
            <div><p className="font-semibold">Address</p><p className="text-ink/75">{s.store_address}</p></div>
          </div>
          <div className="flex gap-4 rounded-2xl bg-mist p-5">
            <Clock className="h-6 w-6 shrink-0 text-brand-600" />
            <div><p className="font-semibold">Opening hours</p><p className="text-ink/75">{s.store_hours}</p></div>
          </div>
          <div className="flex gap-4 rounded-2xl bg-mist p-5">
            <Phone className="h-6 w-6 shrink-0 text-brand-600" />
            <div><p className="font-semibold">Call or WhatsApp</p><a href={site.whatsappLink} className="text-sky hover:underline">{site.whatsapp}</a></div>
          </div>
          <div className="flex gap-4 rounded-2xl bg-navy-900 p-5 text-white">
            <Store className="h-6 w-6 shrink-0 text-brand-200" />
            <div>
              <p className="font-semibold">Free in-store pickup</p>
              <p className="text-white/70">Choose “Pick up in store” at checkout. We'll message you when it's ready — usually the same day.</p>
            </div>
          </div>
        </div>
        <div className="min-h-[360px] overflow-hidden rounded-[28px] ring-1 ring-line">
          <iframe
            title="Map to Snoware Gadgets"
            src={`https://www.google.com/maps?q=${encodeURIComponent(s.store_map_query)}&output=embed`}
            className="h-full min-h-[360px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </ContentPage>
  );
}
