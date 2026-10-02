"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, GripVertical, Loader2, Star, Trash2, Undo2, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadImagesToCloud } from "@/app/actions/admin";
import { cn } from "@/lib/utils";
import { Card } from "./ui";

/** A photo in the editor: existing photos have an `id`; new, unsaved uploads only have `publicId`. */
export type PhotoItem = { key: string; id?: number; url: string; publicId?: string | null };

type Props = {
  items: PhotoItem[];
  removed: PhotoItem[];
  onChange: (items: PhotoItem[], removed: PhotoItem[]) => void;
  dirty: boolean;
};

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Controlled photo editor. Reordering, choosing the main photo and deleting are staged locally;
 * the product form saves them together with the rest of the product.
 */
export function ImageManager({ items, removed, onChange, dirty }: Props) {
  const [uploading, startUpload] = useTransition();
  const [dragKey, setDragKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const setItems = (next: PhotoItem[]) => onChange(next, removed);

  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    startUpload(async () => {
      const res = await uploadImagesToCloud(fd);
      if (inputRef.current) inputRef.current.value = "";
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      const added = res.images.map((img) => ({ key: img.publicId, url: img.url, publicId: img.publicId }));
      onChange([...items, ...added], removed);
      toast.success(`${added.length} photo(s) added — remember to save.`);
    });
  };

  const remove = (key: string) => {
    const item = items.find((i) => i.key === key);
    if (!item) return;
    onChange(
      items.filter((i) => i.key !== key),
      [...removed, item],
    );
  };

  const restore = (key: string) => {
    const item = removed.find((i) => i.key === key);
    if (!item) return;
    onChange(
      [...items, item],
      removed.filter((i) => i.key !== key),
    );
  };

  const onDragEnter = (overKey: string) => {
    if (!dragKey || dragKey === overKey) return;
    const from = items.findIndex((i) => i.key === dragKey);
    const to = items.findIndex((i) => i.key === overKey);
    if (from !== -1 && to !== -1) setItems(move(items, from, to));
  };

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="flex items-center gap-2 text-[17px] font-bold">
            Photos
            {dirty && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-semibold text-amber-700">Unsaved changes</span>}
          </h2>
          <p className="text-[13px] text-muted">
            Drag photos (or use the arrows) to reorder. The first photo is the main one shown in the shop. Changes apply when you press <b>Save changes</b>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-semibold text-white disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Add photos"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line text-[14px] text-muted hover:border-ink hover:text-ink"
        >
          <Upload className="h-6 w-6" /> No photos yet — click to upload
        </button>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((img, i) => {
            const isMain = i === 0;
            return (
              <li
                key={img.key}
                draggable
                onDragStart={(e) => {
                  setDragKey(img.key);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnter={() => onDragEnter(img.key)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={() => setDragKey(null)}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-xl bg-white ring-1 transition",
                  isMain ? "ring-2 ring-ink" : "ring-line",
                  dragKey === img.key && "opacity-40",
                )}
              >
                <div className="relative aspect-square cursor-grab bg-mist active:cursor-grabbing">
                  <Image src={img.url} alt="" fill sizes="200px" className="pointer-events-none object-contain p-2" />
                  <span className="absolute top-2 left-2 flex items-center gap-1">
                    {isMain ? (
                      <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">Main</span>
                    ) : (
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-muted">{i + 1}</span>
                    )}
                    {!img.id && <span className="rounded-full bg-sky px-2 py-0.5 text-[11px] font-semibold text-white">New</span>}
                  </span>
                  <GripVertical className="absolute top-2 right-2 h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" aria-hidden />
                </div>

                <div className="flex items-center justify-between gap-1 border-t border-line p-1.5">
                  <div className="flex">
                    <IconButton label="Move left" disabled={i === 0} onClick={() => setItems(move(items, i, i - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </IconButton>
                    <IconButton label="Move right" disabled={i === items.length - 1} onClick={() => setItems(move(items, i, i + 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </IconButton>
                  </div>
                  <div className="flex">
                    <IconButton label={isMain ? "Main photo" : "Set as main photo"} disabled={isMain} onClick={() => setItems(move(items, i, 0))}>
                      <Star className={cn("h-4 w-4", isMain && "fill-amber-400 text-amber-400")} />
                    </IconButton>
                    <IconButton label="Remove photo" danger onClick={() => remove(img.key)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {removed.length > 0 && (
        <div className="mt-5 rounded-xl bg-brand-50/60 p-3">
          <p className="mb-2 text-[13px] font-medium text-brand-800">
            {removed.length} photo(s) will be deleted when you save:
          </p>
          <ul className="flex flex-wrap gap-2">
            {removed.map((img) => (
              <li key={img.key} className="flex items-center gap-2 rounded-lg bg-white p-1.5 pr-3 ring-1 ring-line">
                <span className="relative h-10 w-10 overflow-hidden rounded-md bg-mist">
                  <Image src={img.url} alt="" fill sizes="40px" className="object-contain opacity-60" />
                </span>
                <button type="button" onClick={() => restore(img.key)} className="inline-flex items-center gap-1 text-[13px] font-semibold text-sky hover:underline">
                  <Undo2 className="h-3.5 w-3.5" /> Undo
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-mist disabled:opacity-25 disabled:hover:bg-transparent", danger && "text-brand-700 hover:bg-brand-50")}
    >
      {children}
    </button>
  );
}
