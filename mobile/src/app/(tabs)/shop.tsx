import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ErrorView, Loading } from "@/components/ui";
import { api } from "@/lib/api";
import { colors, radius } from "@/lib/theme";
import type { Category } from "@/lib/types";

const openListing = (c: Category) => router.push({ pathname: "/listing", params: { category: c.slug, title: c.name } });

/** Category browser: top-level categories with their sub-categories, like the website's mega menu. */
export default function ShopScreen() {
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => api<Category[]>("/api/mobile/categories"), staleTime: 10 * 60_000 });

  if (categories.isPending) return <Loading />;
  if (categories.isError) return <ErrorView message={categories.error.message} onRetry={() => categories.refetch()} />;

  const all = categories.data;
  const roots = all.filter((c) => c.parentId == null);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}>
      <View style={styles.quickRow}>
        <Pressable style={[styles.quick, { backgroundColor: colors.ink }]} onPress={() => router.push({ pathname: "/listing", params: { title: "All products" } })}>
          <Ionicons name="apps" size={18} color={colors.white} />
          <Text style={styles.quickText}>All products</Text>
        </Pressable>
        <Pressable style={[styles.quick, { backgroundColor: colors.brand }]} onPress={() => router.push({ pathname: "/listing", params: { used: "1", title: "Pre-owned" } })}>
          <Ionicons name="pricetag" size={18} color={colors.white} />
          <Text style={styles.quickText}>Pre-owned</Text>
        </Pressable>
      </View>

      {roots.map((root) => {
        const children = all.filter((c) => c.parentId === root.id);
        return (
          <View key={root.id} style={styles.group}>
            <Pressable style={styles.groupHeader} onPress={() => openListing(root)}>
              <Text style={styles.groupTitle}>{root.name}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
            {children.length ? (
              <View style={styles.chips}>
                {children.map((c) => (
                  <Pressable key={c.id} style={styles.chip} onPress={() => openListing(c)}>
                    <Text style={styles.chipText}>{c.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  quickRow: { flexDirection: "row", gap: 10 },
  quick: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.md, paddingVertical: 14 },
  quickText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  group: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 14, gap: 12 },
  groupHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  groupTitle: { fontSize: 18, fontWeight: "800", color: colors.ink },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: colors.mist, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 14, color: colors.ink, fontWeight: "500" },
});
