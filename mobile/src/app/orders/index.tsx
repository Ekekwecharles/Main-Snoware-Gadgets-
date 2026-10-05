import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Button, EmptyState, ErrorView, Loading } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatNaira } from "@/lib/format";
import { colors, radius } from "@/lib/theme";
import type { Order } from "@/lib/types";

const statusColor = (status: string) => (status === "delivered" ? colors.success : status === "cancelled" ? colors.brand : colors.sky);

/** Same order history as the website's account page. */
export default function OrdersScreen() {
  const { user } = useAuth();
  const orders = useQuery({ queryKey: ["orders"], queryFn: () => api<Order[]>("/api/mobile/orders"), enabled: !!user });

  if (!user) return <EmptyState icon="person-outline" title="Sign in to see your orders" action={<Button title="Sign in" variant="dark" onPress={() => router.push("/sign-in")} />} />;
  if (orders.isPending) return <Loading />;
  if (orders.isError) return <ErrorView message={orders.error.message} onRetry={() => orders.refetch()} />;

  return (
    <FlatList
      data={orders.data}
      keyExtractor={(o) => o.reference}
      contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
      refreshing={orders.isRefetching}
      onRefresh={() => orders.refetch()}
      ListEmptyComponent={<EmptyState icon="cube-outline" title="No orders yet" body="When you place an order, you'll be able to track it here." />}
      renderItem={({ item: o }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/orders/${o.reference}`)}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.ref}>{o.reference}</Text>
            <Text style={styles.meta}>
              {new Date(o.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} · {o.items.reduce((n, i) => n + i.quantity, 0)} item(s)
            </Text>
            <Text numberOfLines={1} style={styles.items}>
              {o.items.map((i) => i.name).join(", ")}
            </Text>
            <Text style={[styles.status, { color: statusColor(o.status) }]}>{o.statusLabel}</Text>
          </View>
          <Text style={styles.total}>{formatNaira(o.total)}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  ref: { fontFamily: "monospace", fontWeight: "700", fontSize: 14, color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
  items: { fontSize: 14, color: colors.inkSoft },
  status: { fontSize: 13, fontWeight: "700" },
  total: { fontSize: 15, fontWeight: "800", color: colors.ink },
});
