import type { ReactElement } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ProductCard } from "./product-card";
import { EmptyState, ErrorView, Loading } from "./ui";
import { api } from "@/lib/api";
import { colors } from "@/lib/theme";
import type { Listing } from "@/lib/types";

/** Paginated two-column product grid backed by /api/mobile/products. */
export function ProductGrid({ params, header, emptyTitle = "No products found" }: { params: Record<string, string>; header?: ReactElement; emptyTitle?: string }) {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  const listing = useInfiniteQuery({
    queryKey: ["products", query],
    queryFn: ({ pageParam }) => api<Listing>(`/api/mobile/products?${query}&page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });

  if (listing.isPending) return <>{header}<Loading /></>;
  if (listing.isError) return <>{header}<ErrorView message={listing.error.message} onRetry={() => listing.refetch()} /></>;

  const items = listing.data.pages.flatMap((p) => p.items);
  return (
    <FlatList
      data={items}
      numColumns={2}
      keyExtractor={(p) => String(p.id)}
      ListHeaderComponent={header}
      columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
      contentContainerStyle={{ gap: 12, paddingBottom: 32, flexGrow: 1 }}
      renderItem={({ item }) => <ProductCard product={item} />}
      onEndReachedThreshold={0.5}
      onEndReached={() => listing.hasNextPage && !listing.isFetchingNextPage && listing.fetchNextPage()}
      refreshing={listing.isRefetching && !listing.isFetchingNextPage}
      onRefresh={() => listing.refetch()}
      ListEmptyComponent={<EmptyState icon="search-outline" title={emptyTitle} body="Try another category or search term." />}
      ListFooterComponent={listing.isFetchingNextPage ? <ActivityIndicator color={colors.brand} style={{ marginTop: 8 }} /> : <View />}
    />
  );
}
