import { ProductCardSkeleton } from "@/components/product/product-card";

export default function Loading() {
  return (
    <div className="container-x py-10" aria-busy aria-label="Loading">
      <div className="skeleton mb-3 h-4 w-40 rounded" />
      <div className="skeleton mb-8 h-9 w-72 rounded-lg" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
