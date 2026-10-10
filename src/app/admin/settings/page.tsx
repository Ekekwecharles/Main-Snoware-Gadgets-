import { getSettings } from "@/lib/catalog";
import { Card, inputClass, Label, PageHeader, textareaClass } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/action-form";
import { saveSettings } from "@/app/actions/admin";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Store settings" };

export default async function AdminSettingsPage() {
  const s = await getSettings();
  return (
    <>
      <PageHeader title="Store settings" description="Shown in the footer, store page, checkout pickup option and emails." />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <ActionForm action={saveSettings} submitLabel="Save settings">
            <div className="space-y-4">
              <div>
                <Label htmlFor="store_address">Store / pickup address</Label>
                <textarea id="store_address" name="store_address" rows={2} defaultValue={s.store_address} className={textareaClass} />
              </div>
              <div>
                <Label htmlFor="store_hours">Opening hours</Label>
                <input id="store_hours" name="store_hours" defaultValue={s.store_hours} className={inputClass} />
              </div>
              <div>
                <Label htmlFor="store_map_query" hint="used for the Google Map on the store page">Map search text</Label>
                <input id="store_map_query" name="store_map_query" defaultValue={s.store_map_query} placeholder="e.g. Artillery, Aba Road, Port Harcourt" className={inputClass} />
              </div>
              <div>
                <Label htmlFor="announcement" hint="thin bar above the header — leave empty to hide">Announcement bar</Label>
                <input id="announcement" name="announcement" defaultValue={s.announcement} className={inputClass} />
              </div>
              <div className="border-t border-line pt-4">
                <h2 className="text-[15px] font-bold">Android app updates</h2>
                <p className="mt-1 text-[13px] text-muted">
                  After you upload a new APK to GitHub, enter its version (the <code className="rounded bg-mist px-1">version</code> in
                  mobile/app.config.ts). Phones with an older version are asked to update.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="app_latest_version" hint="e.g. 1.1.0 — empty = no prompt">Latest app version</Label>
                  <input id="app_latest_version" name="app_latest_version" defaultValue={s.app_latest_version} placeholder="1.0.0" className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="app_min_version" hint="older versions can't be used until updated">Minimum allowed version</Label>
                  <input id="app_min_version" name="app_min_version" defaultValue={s.app_min_version} placeholder="optional" className={inputClass} />
                </div>
              </div>
            </div>
          </ActionForm>
        </Card>
        <Card className="h-fit text-[14px]">
          <h2 className="mb-3 text-[17px] font-bold">Business details</h2>
          <p className="mb-3 text-muted">These are set in <code className="rounded bg-mist px-1">src/lib/site.ts</code>.</p>
          <dl className="space-y-2">
            <div><dt className="text-muted">WhatsApp</dt><dd className="font-medium">{site.whatsapp}</dd></div>
            <div><dt className="text-muted">Email</dt><dd className="font-medium">{site.email}</dd></div>
            <div><dt className="text-muted">Instagram / TikTok</dt><dd className="font-medium">{site.socials.handle}</dd></div>
            <div><dt className="text-muted">RC number</dt><dd className="font-medium">{site.rcNumber}</dd></div>
          </dl>
        </Card>
      </div>
    </>
  );
}
