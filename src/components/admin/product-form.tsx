"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Category, Product, ProductVariant } from "@/db/schema";
import { deleteProduct, saveProduct, saveProductImages, type ProductFormInput } from "@/app/actions/admin";
import { ImageManager, type PhotoItem } from "./image-manager";
import { availabilityOptions, conditions, onOrderLeadTime, type AvailabilityValue, type ConditionValue } from "@/lib/site";
import { cn } from "@/lib/utils";
import { buttonClass, Card, inputClass, Label, secondaryButtonClass, textareaClass } from "./ui";

type VariantRow = {
  key: string;
  id?: number;
  condition: ConditionValue;
  storage: string;
  color: string;
  colorHex: string;
  price: string;
  compareAtPrice: string;
  availability: AvailabilityValue;
  /** Optional quantity; "" = no limit. */
  stock: string;
  sku: string;
};

const newRow = (partial: Partial<VariantRow> = {}): VariantRow => ({
  key: Math.random().toString(36).slice(2),
  condition: "new",
  storage: "",
  color: "",
  colorHex: "#1d1d1f",
  price: "",
  compareAtPrice: "",
  availability: "in_stock",
  stock: "",
  sku: "",
  ...partial,
});

type Props = {
  categories: Category[];
  brands: { id: number; name: string }[];
  product?: Product & { variants: ProductVariant[] };
  images?: { id: number; url: string; publicId: string | null }[];
};

export function ProductForm({ categories, brands, product, images = [] }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [photos, setPhotos] = useState<PhotoItem[]>(() => images.map((img) => ({ key: `img-${img.id}`, id: img.id, url: img.url, publicId: img.publicId })));
  const [removedPhotos, setRemovedPhotos] = useState<PhotoItem[]>([]);
  const photosDirty = removedPhotos.length > 0 || photos.map((p) => p.key).join() !== images.map((img) => `img-${img.id}`).join();

  // Warn before leaving the page with unsaved photo changes.
  useEffect(() => {
    if (!photosDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [photosDirty]);
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.length
      ? product.variants.map((v) =>
          newRow({
            id: v.id,
            condition: v.condition,
            storage: v.storage ?? "",
            color: v.color ?? "",
            colorHex: v.colorHex ?? "#1d1d1f",
            price: String(v.price),
            compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : "",
            availability: v.availability,
            stock: v.stock == null ? "" : String(v.stock),
            sku: v.sku ?? "",
          }),
        )
      : [newRow()],
  );
  const [highlights, setHighlights] = useState<string[]>(product?.highlights.length ? product.highlights : [""]);
  const [specs, setSpecs] = useState(product?.specs.length ? product.specs : [{ label: "", value: "" }]);

  const parents = categories.filter((c) => !c.parentId);
  const setVariant = (key: string, patch: Partial<VariantRow>) => setVariants((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const submit = (fd: FormData) => {
    const input: ProductFormInput = {
      name: String(fd.get("name")),
      slug: String(fd.get("slug") ?? ""),
      categoryId: Number(fd.get("categoryId")),
      brandId: fd.get("brandId") ? Number(fd.get("brandId")) : null,
      shortDescription: String(fd.get("shortDescription") ?? ""),
      description: String(fd.get("description") ?? ""),
      badge: String(fd.get("badge") ?? ""),
      featured: fd.get("featured") === "on",
      isActive: fd.get("isActive") === "on",
      highlights: highlights.map((h) => h.trim()).filter(Boolean),
      specs: specs.filter((s) => s.label.trim() && s.value.trim()),
      variants: variants.map((v) => ({
        id: v.id,
        condition: v.condition,
        storage: v.storage,
        color: v.color,
        colorHex: v.color ? v.colorHex : null,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        availability: v.availability,
        stock: v.stock === "" ? null : Number(v.stock),
        sku: v.sku,
      })),
    };
    startTransition(async () => {
      const res = await saveProduct(product?.id ?? null, input);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      if (photosDirty && res.id) {
        const photoRes = await saveProductImages(res.id, {
          order: photos.map((p) => (p.id ? { id: p.id } : { url: p.url, publicId: p.publicId! })),
          discardedPublicIds: removedPhotos.filter((p) => !p.id && p.publicId).map((p) => p.publicId!),
        });
        if (!photoRes.ok) {
          toast.error(`Product saved, but photos weren't: ${photoRes.message}`);
          return;
        }
        // Saved photos are now the baseline; the page refresh below re-mounts the form with them.
        setRemovedPhotos([]);
      }
      toast.success(res.message);
      if (!product && res.id) router.push(`/admin/products/${res.id}`);
      else router.refresh();
    });
  };

  return (
    <form action={submit} className="space-y-6">
      <ImageManager
        items={photos}
        removed={removedPhotos}
        dirty={photosDirty}
        onChange={(next, removed) => {
          setPhotos(next);
          setRemovedPhotos(removed);
        }}
      />
      <Card>
        <h2 className="mb-5 text-[17px] font-bold">Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="name">Product name</Label>
            <input id="name" name="name" required defaultValue={product?.name} placeholder="e.g. iPhone 17 Pro Max" className={inputClass} />
          </div>
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <select id="categoryId" name="categoryId" required defaultValue={product?.categoryId ?? ""} className={inputClass}>
              <option value="" disabled>Choose…</option>
              {parents.map((p) => (
                <optgroup key={p.id} label={p.name}>
                  <option value={p.id}>{p.name} (general)</option>
                  {categories.filter((c) => c.parentId === p.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="brandId">Brand</Label>
            <select id="brandId" name="brandId" defaultValue={product?.brandId ?? ""} className={inputClass}>
              <option value="">No brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="shortDescription" hint="shown under the title">Short description</Label>
            <textarea id="shortDescription" name="shortDescription" rows={2} defaultValue={product?.shortDescription ?? ""} className={textareaClass} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description" hint="Overview tab">Full description</Label>
            <textarea id="description" name="description" rows={5} defaultValue={product?.description ?? ""} className={textareaClass} />
          </div>
          <div>
            <Label htmlFor="badge" hint="optional, e.g. New, Hot deal">Badge</Label>
            <input id="badge" name="badge" maxLength={24} defaultValue={product?.badge ?? ""} className={inputClass} />
          </div>
          <div>
            <Label htmlFor="slug" hint="leave blank to generate">URL slug</Label>
            <input id="slug" name="slug" defaultValue={product?.slug ?? ""} className={inputClass} />
          </div>
          <div className="flex flex-wrap gap-6 md:col-span-2">
            <label className="flex items-center gap-2 text-[14px] font-medium">
              <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} className="h-4 w-4 accent-ink" /> Visible on store
            </label>
            <label className="flex items-center gap-2 text-[14px] font-medium">
              <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} className="h-4 w-4 accent-ink" /> Feature on homepage
            </label>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[17px] font-bold">Variants, prices &amp; availability</h2>
          <button type="button" onClick={() => setVariants((v) => [...v, newRow()])} className={secondaryButtonClass}>
            <Plus className="h-4 w-4" /> Add variant
          </button>
        </div>
        <p className="mb-5 text-[13px] text-muted">One row per combination customers can buy — e.g. 256GB · Black · UK Used. Prices are in naira. For <b>Open Box</b>, say in the description (or Badge) whether it's unused or lightly used.
          <br />
          <b>Availability:</b> <i>In stock</i> = ready to ship · <i>Available on order</i> = you source it after purchase (customers see “ships in {onOrderLeadTime}”) · <i>Sold out</i> = can't be bought.
          <br />
          <b>Qty:</b> leave empty for no limit (bulk orders welcome). Enter a number to cap orders at it — customers see “18 in stock” or “Only 3 left”, it goes down with each paid order, and the item shows as sold out at 0.</p>
        <div className="space-y-3">
          {variants.map((v) => (
            <div key={v.key} className="grid grid-cols-2 gap-3 rounded-xl bg-mist/70 p-3 sm:grid-cols-4 xl:grid-cols-[1.1fr_0.9fr_1.3fr_1fr_1fr_1.25fr_0.8fr_auto]">
              <select aria-label="Condition" value={v.condition} onChange={(e) => setVariant(v.key, { condition: e.target.value as VariantRow["condition"] })} className={inputClass}>
                {conditions.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input aria-label="Capacity or size" placeholder="Capacity / size" value={v.storage} onChange={(e) => setVariant(v.key, { storage: e.target.value })} className={inputClass} />
              <div className="flex gap-2">
                <input aria-label="Colour swatch" type="color" value={v.colorHex} onChange={(e) => setVariant(v.key, { colorHex: e.target.value })} className="h-11 w-11 shrink-0 cursor-pointer rounded-xl border border-line bg-white p-1" />
                <input aria-label="Colour name" placeholder="Colour" value={v.color} onChange={(e) => setVariant(v.key, { color: e.target.value })} className={inputClass} />
              </div>
              <input aria-label="Price" inputMode="numeric" placeholder="Price ₦" required value={v.price} onChange={(e) => setVariant(v.key, { price: e.target.value.replace(/\D/g, "") })} className={inputClass} />
              <input aria-label="Compare-at price" inputMode="numeric" placeholder="Was ₦ (optional)" value={v.compareAtPrice} onChange={(e) => setVariant(v.key, { compareAtPrice: e.target.value.replace(/\D/g, "") })} className={inputClass} />
              <select
                aria-label="Availability"
                value={v.availability}
                onChange={(e) => setVariant(v.key, { availability: e.target.value as AvailabilityValue })}
                className={cn(
                  inputClass,
                  v.availability === "on_order" && "border-amber-300 bg-amber-50 text-amber-900",
                  v.availability === "sold_out" && "border-brand-200 bg-brand-50 text-brand-800",
                )}
              >
                {availabilityOptions.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              <input
                aria-label="Quantity available (leave empty for no limit)"
                title="Quantity available — leave empty for no limit"
                inputMode="numeric"
                placeholder="Qty (no limit)"
                value={v.stock}
                onChange={(e) => setVariant(v.key, { stock: e.target.value.replace(/\D/g, "") })}
                className={inputClass}
              />
              <div className="flex gap-1">
                <button type="button" title="Duplicate" onClick={() => setVariants((rows) => [...rows, newRow({ ...v, id: undefined, key: undefined })])} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-white" aria-label="Duplicate variant">
                  <Copy className="h-4 w-4" />
                </button>
                <button type="button" title="Remove" disabled={variants.length === 1} onClick={() => setVariants((rows) => rows.filter((r) => r.key !== v.key))} className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-700 hover:bg-white disabled:opacity-30" aria-label="Remove variant">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-[17px] font-bold">Key highlights</h2>
          <div className="space-y-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex gap-2">
                <input value={h} onChange={(e) => setHighlights((list) => list.map((x, j) => (j === i ? e.target.value : x)))} placeholder="e.g. 48MP triple camera" className={inputClass} aria-label={`Highlight ${i + 1}`} />
                <button type="button" onClick={() => setHighlights((list) => list.filter((_, j) => j !== i))} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-mist" aria-label="Remove highlight">
                  <Trash2 className="h-4 w-4 text-muted" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setHighlights((l) => [...l, ""])} className="mt-3 text-[14px] font-semibold text-sky hover:underline">+ Add highlight</button>
        </Card>
        <Card>
          <h2 className="mb-4 text-[17px] font-bold">Specifications</h2>
          <div className="space-y-2">
            {specs.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input value={s.label} onChange={(e) => setSpecs((l) => l.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Label (e.g. Display)" className={inputClass} aria-label={`Spec ${i + 1} label`} />
                <input value={s.value} onChange={(e) => setSpecs((l) => l.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="Value" className={inputClass} aria-label={`Spec ${i + 1} value`} />
                <button type="button" onClick={() => setSpecs((l) => l.filter((_, j) => j !== i))} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-mist" aria-label="Remove spec">
                  <Trash2 className="h-4 w-4 text-muted" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setSpecs((l) => [...l, { label: "", value: "" }])} className="mt-3 text-[14px] font-semibold text-sky hover:underline">+ Add spec</button>
        </Card>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/95 p-4 shadow-lift backdrop-blur">
        {product ? (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete “${product.name}”? Products with past orders are hidden instead of deleted.`)) startTransition(() => deleteProduct(product.id));
            }}
            className="text-[14px] font-semibold text-brand-700 hover:underline"
          >
            Delete product
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {photosDirty && <span className="text-[13px] font-medium text-amber-700">Unsaved photo changes</span>}
          <button disabled={pending} className={buttonClass}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} {product ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>
    </form>
  );
}
