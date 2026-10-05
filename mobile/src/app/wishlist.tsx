import { FlatList } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { Button, EmptyState, ErrorView, Loading } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ProductCard as Card } from "@/lib/types";

/** Same wishlist as the website's account page. */
export default function WishlistScreen() {
  const { user } = useAuth();
  const wishlist = useQuery({ queryKey: ["wishlist"], queryFn: () => api<Card[]>("/api/mobile/wishlist"), enabled: !!user });

  if (!user) return <EmptyState icon="heart-outline" title="Sign in to see your wishlist" action={<Button title="Sign in" variant="dark" onPress={() => router.push("/sign-in")} />} />;
  if (wishlist.isPending) return <Loading />;
  if (wishlist.isError) return <ErrorView message={wishlist.error.message} onRetry={() => wishlist.refetch()} />;

  return (
    <FlatList
      data={wishlist.data}
      numColumns={2}
      keyExtractor={(p) => String(p.id)}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
      refreshing={wishlist.isRefetching}
      onRefresh={() => wishlist.refetch()}
      renderItem={({ item }) => <ProductCard product={item} />}
      ListEmptyComponent={<EmptyState icon="heart-outline" title="Your wishlist is empty" body="Tap the heart on any product to save it for later." />}
    />
  );
}
