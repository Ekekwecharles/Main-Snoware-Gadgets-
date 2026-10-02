import type { Metadata } from "next";
import { ContentPage } from "@/components/content/content-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Warranty & Used Device Grading" };

export default function WarrantyPage() {
  return (
    <ContentPage eyebrow="Peace of mind" title="Warranty & how we grade used devices" intro="Whether you buy new or pre-owned, you're covered.">
      <div className="prose-snow max-w-3xl">
        <h2>Warranty cover</h2>
        <ul>
          <li><b>Brand-new devices:</b> 12 months against manufacturing defects.</li>
          <li><b>UK-used &amp; US-used devices:</b> 6 months against hardware faults.</li>
          <li><b>Nigerian-used devices:</b> 3 months against hardware faults.</li>
          <li><b>Accessories:</b> 30 days for original chargers, cables and earbuds.</li>
        </ul>
        <p>
          Warranty covers faults that aren't caused by misuse. It doesn't cover physical or liquid damage, unauthorised repairs, or software
          problems caused by jailbreaking or rooting. Keep your order reference — it's your proof of purchase.
        </p>

        <h2>Our used-device inspection</h2>
        <p>Before a pre-owned device goes on sale, we check:</p>
        <ul>
          <li>Battery health and charging</li>
          <li>Face ID, Touch ID or fingerprint sensor</li>
          <li>Front and rear cameras, flash, microphones and speakers</li>
          <li>Display, touch response, dead pixels and burn-in</li>
          <li>Network signal, Wi-Fi, Bluetooth, GPS and NFC</li>
          <li>Buttons, ports and SIM tray</li>
          <li>Activation lock — every device is signed out of iCloud / Google</li>
        </ul>

        <h2>Condition labels</h2>
        <p><b>UK Used / US Used:</b> imported pre-owned units, typically in very good to excellent cosmetic condition, with only light signs of use.</p>
        <p><b>Nigerian Used:</b> locally pre-owned devices at our lowest prices. They work perfectly but may show visible marks.</p>

        <h2>Making a claim</h2>
        <p>
          Message us on WhatsApp at <a href={site.whatsappLink}>{site.whatsapp}</a> or email <a href={`mailto:${site.email}`}>{site.email}</a> with
          your order reference and a description of the problem. We'll arrange an inspection and repair, replace or refund as appropriate.
        </p>
        <p className="text-[13px] text-muted">These terms are a starting draft — review and adjust them to match your business before launch.</p>
      </div>
    </ContentPage>
  );
}
