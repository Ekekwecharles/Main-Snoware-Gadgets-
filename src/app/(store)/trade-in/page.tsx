import type { Metadata } from "next";
import { Camera, MessageCircle, Repeat, Wallet } from "lucide-react";
import { ContentPage } from "@/components/content/content-page";
import { WhatsAppIcon } from "@/components/brand/social-icons";
import { whatsappMessageLink } from "@/lib/site";

export const metadata: Metadata = { title: "Trade-In", description: "Swap your old phone, tablet or laptop towards a new one at Snoware Gadgets." };

const steps = [
  { icon: Camera, title: "Send photos", text: "WhatsApp us clear photos of your device (front, back, sides) plus its model, storage and battery health." },
  { icon: MessageCircle, title: "Get a quote", text: "We'll reply with a trade-in value, usually within an hour during opening times." },
  { icon: Repeat, title: "Swap in store", text: "Bring your device. We confirm its condition and apply the value to your new purchase." },
  { icon: Wallet, title: "Pay the balance", text: "Pay the difference by card, transfer or cash — and walk out with your upgrade." },
];

export default function TradeInPage() {
  return (
    <ContentPage eyebrow="Trade-in" title="Upgrade for less with your old device" intro="We accept iPhones, Samsung Galaxy phones, Google Pixels, iPads and MacBooks in good working condition.">
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-[var(--radius-card)] bg-mist p-6">
            <span className="text-[13px] font-bold text-brand-600">Step {i + 1}</span>
            <s.icon className="mt-3 h-7 w-7" />
            <h2 className="mt-4 text-[17px] font-bold">{s.title}</h2>
            <p className="mt-1 text-[14px] text-ink/70">{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex flex-col items-center gap-4 rounded-[28px] bg-[#25D366]/10 px-6 py-10 text-center">
        <h2 className="text-[24px] font-extrabold">Get your trade-in quote now</h2>
        <a href={whatsappMessageLink("Hi Snoware, I'd like a trade-in quote. My device is: ")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-7 py-3 font-semibold text-white">
          <WhatsAppIcon className="h-5 w-5" /> Start on WhatsApp
        </a>
        <p className="max-w-lg text-[13px] text-muted">Final value depends on inspection. Devices must be fully paid off, unlocked, and signed out of iCloud / Google accounts.</p>
      </div>
    </ContentPage>
  );
}
