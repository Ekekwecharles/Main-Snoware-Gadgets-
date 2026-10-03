import type { Metadata } from "next";
import { ContentPage } from "@/components/content/content-page";
import { getDeliveryZones } from "@/lib/catalog";
import { formatNaira } from "@/lib/utils";

export const metadata: Metadata = { title: "Shipping & Delivery" };

export default async function ShippingPage() {
  const zones = await getDeliveryZones();
  return (
    <ContentPage
      eyebrow="Delivery"
      title="Shipping & delivery"
      intro="Fast, tracked delivery across Nigeria, or free pickup from our store."
    >
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="mb-4 text-[22px] font-bold">
            Delivery fees by location
          </h2>
          <div className="overflow-hidden rounded-2xl ring-1 ring-line">
            <table className="w-full text-[14.5px]">
              <thead className="bg-mist text-left text-[12.5px] text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Delivery time</th>
                  <th className="px-4 py-3 text-right">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {zones.map((z) => (
                  <tr key={z.id}>
                    <td className="px-4 py-3">
                      <span className="font-medium">{z.name}</span>{" "}
                      <span className="text-muted">· {z.state}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{z.eta}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatNaira(z.fee)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-emerald-50/60">
                  <td className="px-4 py-3 font-medium">In-store pickup</td>
                  <td className="px-4 py-3 text-muted">Same day</td>
                  <td className="px-4 py-3 text-right font-semibold text-success">
                    Free
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="prose-snow">
          <h2>How it works</h2>
          <ul>
            <li>
              Orders paid before 2pm (Mon–Sat) are dispatched the same day in
              Port Harcourt.
            </li>
            <li>Our rider or courier will call you before delivery.</li>
            <li>
              Please inspect your package when it arrives and report any issue
              within 24 hours.
            </li>
            <li>
              Delivery times are estimates and can be affected by weather,
              public holidays or security situations.
            </li>
          </ul>
          <h2>Pickup</h2>
          <p>
            Choose “Pick up in store” at checkout. We'll message you when your
            order is ready. Please bring your order reference and a valid ID.
          </p>
        </div>
      </div>
    </ContentPage>
  );
}
