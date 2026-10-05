import { asc } from "drizzle-orm";
import { db } from "@/db";
import { deliveryZones, type DeliveryZone } from "@/db/schema";
import { Card, inputClass, Label, PageHeader } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/action-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteZone, saveZone } from "@/app/actions/admin";
import { formatNaira } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Delivery zones" };

export default async function AdminDeliveryPage() {
  const zones = await db.select().from(deliveryZones).orderBy(asc(deliveryZones.sortOrder), asc(deliveryZones.name));
  return (
    <>
      <PageHeader title="Delivery zones" description="Customers pick one of these at checkout; the fee is added to their total. In-store pickup is always free." />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          {zones.map((z) => (
            <Card key={z.id} className="p-4 sm:p-5">
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="font-semibold">{z.name}</span> <span className="text-[13px] text-muted">· {z.state} · {z.eta}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {!z.isActive && <span className="rounded-full bg-mist px-2 py-0.5 text-[12px] text-muted">Hidden</span>}
                    <span className="font-bold">{formatNaira(z.fee)}</span>
                  </span>
                </summary>
                <div className="mt-4 border-t border-line pt-4">
                  <ActionForm action={saveZone}>
                    <input type="hidden" name="id" value={z.id} />
                    <ZoneFields zone={z} />
                  </ActionForm>
                  <DeleteButton action={deleteZone.bind(null, z.id)} label="Delete zone" confirmText={`Delete ${z.name}?`} />
                </div>
              </details>
            </Card>
          ))}
        </div>
        <Card className="h-fit">
          <h2 className="mb-4 text-[17px] font-bold">Add delivery zone</h2>
          <ActionForm action={saveZone} submitLabel="Add zone">
            <ZoneFields />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}

function ZoneFields({ zone }: { zone?: DeliveryZone }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div><Label>Area name</Label><input name="name" required defaultValue={zone?.name} placeholder="e.g. GRA, Old GRA, D-Line" className={inputClass} /></div>
      <div><Label>State / region</Label><input name="state" required defaultValue={zone?.state} placeholder="e.g. Port Harcourt (group shown at checkout)" className={inputClass} /></div>
      <div><Label>Fee (₦)</Label><input name="fee" type="number" min={0} required defaultValue={zone?.fee} className={inputClass} /></div>
      <div><Label>Delivery time</Label><input name="eta" required defaultValue={zone?.eta} placeholder="1–2 business days" className={inputClass} /></div>
      <div><Label>Sort order</Label><input name="sortOrder" type="number" defaultValue={zone?.sortOrder ?? 0} className={inputClass} /></div>
      <label className="flex items-center gap-2 self-end pb-3 text-[14px]"><input type="checkbox" name="isActive" defaultChecked={zone?.isActive ?? true} className="h-4 w-4 accent-ink" /> Available at checkout</label>
    </div>
  );
}
