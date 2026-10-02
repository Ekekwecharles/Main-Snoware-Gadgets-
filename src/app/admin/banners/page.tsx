import Image from "next/image";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { banners, type Banner } from "@/db/schema";
import { Card, inputClass, Label, PageHeader, textareaClass } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/action-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteBanner, saveBanner } from "@/app/actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Banners" };

export default async function AdminBannersPage() {
  const list = await db.select().from(banners).orderBy(asc(banners.placement), asc(banners.sortOrder));
  const groups = [
    { key: "hero", title: "Homepage slideshow", note: "Large slides at the top of the homepage. Without an image, a decorative device illustration is shown." },
    { key: "promo", title: "Promo tiles", note: "The 2×2 grid of offers under the slideshow." },
  ] as const;

  return (
    <>
      <PageHeader title="Banners" description="Change homepage promotions without touching code." />
      <div className="space-y-10">
        {groups.map((g) => (
          <section key={g.key}>
            <h2 className="text-[19px] font-bold">{g.title}</h2>
            <p className="mb-4 text-[13.5px] text-muted">{g.note}</p>
            <div className="grid gap-4 xl:grid-cols-2">
              {list
                .filter((b) => b.placement === g.key)
                .map((b) => (
                  <Card key={b.id}>
                    <details>
                      <summary className="flex cursor-pointer items-center gap-3">
                        {b.image && <Image src={b.image} alt="" width={48} height={48} className="h-12 w-12 rounded-lg bg-mist object-contain" />}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{b.title}</span>
                          <span className="text-[12.5px] text-muted">{b.theme} theme · order {b.sortOrder} · {b.isActive ? "Visible" : "Hidden"}</span>
                        </span>
                      </summary>
                      <div className="mt-4 border-t border-line pt-4">
                        <ActionForm action={saveBanner}>
                          <input type="hidden" name="id" value={b.id} />
                          <BannerFields banner={b} placement={g.key} />
                        </ActionForm>
                        <DeleteButton action={deleteBanner.bind(null, b.id)} label="Delete banner" confirmText="Delete this banner?" />
                      </div>
                    </details>
                  </Card>
                ))}
              <Card>
                <details>
                  <summary className="cursor-pointer font-semibold text-sky">+ Add {g.key === "hero" ? "slide" : "promo tile"}</summary>
                  <div className="mt-4 border-t border-line pt-4">
                    <ActionForm action={saveBanner} submitLabel="Add">
                      <BannerFields placement={g.key} />
                    </ActionForm>
                  </div>
                </details>
              </Card>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function BannerFields({ banner, placement }: { banner?: Banner; placement: "hero" | "promo" }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="placement" value={placement} />
      <div><Label>Eyebrow</Label><input name="eyebrow" defaultValue={banner?.eyebrow ?? ""} placeholder="e.g. Just landed" className={inputClass} /></div>
      <div><Label>Title</Label><input name="title" required defaultValue={banner?.title} className={inputClass} /></div>
      <div className="sm:col-span-2"><Label>Subtitle</Label><textarea name="subtitle" rows={2} defaultValue={banner?.subtitle ?? ""} className={textareaClass} /></div>
      {placement === "hero" && <div><Label>Price line</Label><input name="priceText" defaultValue={banner?.priceText ?? ""} placeholder="From ₦…" className={inputClass} /></div>}
      <div>
        <Label>Theme</Label>
        <select name="theme" defaultValue={banner?.theme ?? "light"} className={inputClass}>
          {["light", "dark", "red", "navy", "blue"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div><Label>Button text</Label><input name="ctaLabel" defaultValue={banner?.ctaLabel ?? ""} className={inputClass} /></div>
      <div><Label>Button link</Label><input name="ctaHref" defaultValue={banner?.ctaHref ?? ""} placeholder="/c/apple/iphone" className={inputClass} /></div>
      {placement === "hero" && (
        <>
          <div><Label>2nd button text</Label><input name="secondaryLabel" defaultValue={banner?.secondaryLabel ?? ""} className={inputClass} /></div>
          <div><Label>2nd button link</Label><input name="secondaryHref" defaultValue={banner?.secondaryHref ?? ""} className={inputClass} /></div>
        </>
      )}
      <div><Label>Sort order</Label><input name="sortOrder" type="number" defaultValue={banner?.sortOrder ?? 0} className={inputClass} /></div>
      <div>
        <Label hint="transparent PNG works best">Image</Label>
        <input name="image" type="file" accept="image/*" className="block w-full text-[13px] file:mr-3 file:rounded-full file:border-0 file:bg-mist file:px-4 file:py-2 file:font-semibold" />
      </div>
      <div className="flex flex-wrap gap-5 sm:col-span-2">
        <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" name="isActive" defaultChecked={banner?.isActive ?? true} className="h-4 w-4 accent-ink" /> Visible</label>
        {banner?.image && <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" name="removeImage" className="h-4 w-4 accent-ink" /> Remove image</label>}
      </div>
    </div>
  );
}
