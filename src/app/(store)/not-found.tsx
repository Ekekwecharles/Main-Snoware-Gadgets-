import Link from "next/link";
import { DeviceIcon } from "@/components/brand/device-icon";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <DeviceIcon icon="phone-used" className="h-28 w-28 text-navy-900/20" strokeWidth={1} />
      <h1 className="mt-6 text-[30px] font-extrabold sm:text-[38px]">We couldn't find that page</h1>
      <p className="mt-2 max-w-md text-muted">The product may have sold out or moved. Try searching, or explore our latest arrivals.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="rounded-full bg-ink px-6 py-3 font-semibold text-white">Shop all gadgets</Link>
        <Link href="/" className="rounded-full px-6 py-3 font-semibold ring-1 ring-ink">Go home</Link>
      </div>
    </div>
  );
}
