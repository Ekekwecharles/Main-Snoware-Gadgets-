import { NextResponse } from "next/server";
import { getDeliveryZones, getSettings } from "@/lib/catalog";
import { site } from "@/lib/site";

/** Delivery zones and public store details used on the app's checkout and account screens. */
export async function GET() {
  const [zones, settings] = await Promise.all([getDeliveryZones(), getSettings()]);
  return NextResponse.json({
    zones: zones.map(({ id, name, state, fee, eta }) => ({ id, name, state, fee, eta })),
    store: {
      address: settings.store_address,
      hours: settings.store_hours,
      email: site.email,
      whatsapp: site.whatsapp,
      whatsappLink: site.whatsappLink,
    },
  });
}
