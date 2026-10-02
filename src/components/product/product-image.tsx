import Image from "next/image";
import { cn } from "@/lib/utils";
import { DeviceIcon, iconForCategory } from "@/components/brand/device-icon";

type Props = {
  src: string | null | undefined;
  alt: string;
  categorySlug?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Pads the image so product cut-outs float nicely inside the frame */
  contain?: boolean;
};

/**
 * Product image with a branded placeholder, so a missing photo never shows as an empty box
 * (one of the gaps on the reference site).
 */
export function ProductImage({ src, alt, categorySlug = "", sizes = "(min-width: 1024px) 25vw, 50vw", priority, className, contain = true }: Props) {
  if (!src) {
    return (
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-mist via-white to-navy-50",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <DeviceIcon icon={iconForCategory(categorySlug)} className="h-1/2 w-1/2 max-h-40 text-navy-900/25" strokeWidth={1.1} />
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-muted backdrop-blur">
          Photo coming soon
        </span>
      </div>
    );
  }
  return (
    <div className={cn("relative h-full w-full", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(contain ? "object-contain p-[8%]" : "object-cover")}
      />
    </div>
  );
}
