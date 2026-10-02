import type { Metadata } from "next";
import { auth } from "@/auth";
import { getDeliveryZones, getSettings } from "@/lib/catalog";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [session, zones, settings] = await Promise.all([auth(), getDeliveryZones(), getSettings()]);
  return (
    <div className="bg-mist/60">
      <div className="container-x py-8 lg:py-12">
        <h1 className="mb-8 text-[30px] font-extrabold sm:text-[36px]">Checkout</h1>
        <CheckoutForm
          zones={zones.map((z) => ({ id: z.id, name: z.name, state: z.state, fee: z.fee, eta: z.eta }))}
          storeAddress={settings.store_address}
          storeHours={settings.store_hours}
          defaults={{ email: session?.user?.email ?? "", fullName: session?.user?.name ?? "" }}
          signedIn={!!session?.user}
        />
      </div>
    </div>
  );
}
