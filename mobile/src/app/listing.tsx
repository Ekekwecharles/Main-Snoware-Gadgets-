import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { ProductGrid } from "@/components/product-grid";
import { colors, radius } from "@/lib/theme";

const sorts = [
  { value: "best-selling", label: "Best selling" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
] as const;

/** Product listing for a category, the pre-owned range, or the whole shop. */
export default function ListingScreen() {
  const params = useLocalSearchParams<{ category?: string; title?: string; used?: string; q?: string; condition?: string }>();
  const [sort, setSort] = useState<string>("best-selling");
  const [inStock, setInStock] = useState(false);

  const header = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
      <Pressable onPress={() => setInStock((v) => !v)} style={[styles.chip, inStock && styles.chipActive]}>
        <Text style={[styles.chipText, inStock && styles.chipTextActive]}>In stock</Text>
      </Pressable>
      {sorts.map((s) => (
        <Pressable key={s.value} onPress={() => setSort(s.value)} style={[styles.chip, sort === s.value && styles.chipActive]}>
          <Text style={[styles.chipText, sort === s.value && styles.chipTextActive]}>{s.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  return (
    <>
      <Stack.Screen options={{ title: params.title || "Shop" }} />
      <ProductGrid
        header={header}
        params={{
          category: params.category ?? "",
          used: params.used ?? "",
          q: params.q ?? "",
          condition: params.condition ?? "",
          sort,
          inStock: inStock ? "1" : "",
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13.5, color: colors.ink, fontWeight: "500" },
  chipTextActive: { color: colors.white },
});
