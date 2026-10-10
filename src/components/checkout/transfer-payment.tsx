"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Copy, FileText, ImageUp, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadPaymentProof } from "@/app/actions/payment";
import { cn, formatNaira } from "@/lib/utils";

type Account = { bank: string; accountNumber: string; accountName: string };

type Props = {
  reference: string;
  total: number;
  accounts: readonly Account[];
  /** When the customer last uploaded a screenshot (ISO), if they have. */
  proofAt: string | null;
};

/** Phone photos can be 5–12MB; shrink large images in the browser so the upload stays under the server limit. */
async function shrinkIfNeeded(file: File): Promise<File> {
  const LIMIT = 3.5 * 1024 * 1024;
  if (file.size <= LIMIT || !file.type.startsWith("image/") || file.type === "image/heic") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  return blob ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file;
}

export function TransferPayment({ reference, total, accounts, proofAt }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [pending, startTransition] = useTransition();

  const choose = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };

  const submit = () => {
    if (!file) return toast.error("Choose your payment screenshot first.");
    startTransition(async () => {
      const fd = new FormData();
      fd.append("proof", await shrinkIfNeeded(file));
      const res = await uploadPaymentProof(reference, fd);
      if (!res.ok) return void toast.error(res.message);
      toast.success(res.message);
      choose(null);
      setReplacing(false);
      router.refresh();
    });
  };

  const showUpload = !proofAt || replacing;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[20px] font-bold">Pay by bank transfer</h2>
        <p className="mt-1 text-[14.5px] text-muted">
          Transfer <b className="text-ink">exactly {formatNaira(total)}</b> to any account below. Put your order reference in the <b className="text-ink">narration / remark</b> so we
          can match your payment.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CopyRow label="Amount" value={String(total)} display={formatNaira(total)} large />
        <CopyRow label="Narration / remark" value={reference} display={reference} mono />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {accounts.map((a, i) => (
          <div key={a.accountNumber} className={cn("rounded-2xl p-4 ring-1", i === 0 ? "bg-navy-900 text-white ring-navy-900" : "bg-white ring-line")}>
            <div className="flex items-center justify-between">
              <p className={cn("text-[13px] font-semibold", i === 0 ? "text-white/70" : "text-muted")}>{a.bank}</p>
              {i === 0 && <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">Main account</span>}
            </div>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="font-mono text-[24px] font-bold tracking-wider">{a.accountNumber}</p>
              <CopyButton value={a.accountNumber} dark={i === 0} />
            </div>
            <p className={cn("text-[14px]", i === 0 ? "text-white/80" : "text-ink/75")}>{a.accountName}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-mist p-5">
        {showUpload ? (
          <>
            <p className="font-semibold">Paid? Upload your payment screenshot</p>
            <p className="mt-0.5 text-[13.5px] text-muted">A screenshot of the successful transfer from your bank app (image or PDF). We&apos;re notified immediately.</p>
            <input
              ref={input}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => choose(e.target.files?.[0] ?? null)}
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold ring-1 ring-line transition hover:ring-ink"
              >
                <ImageUp className="h-4.5 w-4.5" /> {file ? "Choose a different file" : "Choose screenshot"}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!file || pending}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-[14px] font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Upload className="h-4.5 w-4.5" />}
                {pending ? "Sending…" : "Send screenshot"}
              </button>
            </div>
            {file && (
              <div className="mt-4 flex items-center gap-3">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file
                  <img src={preview} alt="Selected payment screenshot" className="h-20 w-20 rounded-lg object-cover ring-1 ring-line" />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-lg bg-white ring-1 ring-line">
                    <FileText className="h-7 w-7 text-muted" />
                  </span>
                )}
                <p className="text-[13.5px] text-muted">{file.name}</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex gap-3">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-success" />
            <div>
              <p className="font-semibold">Screenshot received — we&apos;re confirming your payment</p>
              <p className="mt-0.5 text-[13.5px] text-muted">
                Sent {new Date(proofAt!).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}. We&apos;ll email you once it&apos;s confirmed, usually within a few
                minutes during opening hours.
              </p>
              <button type="button" onClick={() => setReplacing(true)} className="mt-2 text-[13.5px] font-semibold text-sky hover:underline">
                Uploaded the wrong file? Send another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CopyRow({ label, value, display, mono, large }: { label: string; value: string; display: string; mono?: boolean; large?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
      <div className="min-w-0">
        <p className="text-[12.5px] text-muted">{label}</p>
        <p className={cn("truncate font-bold", mono && "font-mono tracking-wide", large ? "text-[22px]" : "text-[17px]")}>{display}</p>
      </div>
      <CopyButton value={value} />
    </div>
  );
}

function CopyButton({ value, dark }: { value: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${value}`}
      onClick={async () => {
        await navigator.clipboard.writeText(value).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition",
        dark ? "bg-white/15 text-white hover:bg-white/25" : "bg-mist text-ink hover:bg-line",
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
    </button>
  );
}
