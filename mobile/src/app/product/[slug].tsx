import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, ErrorView, Loading, QuantityStepper } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { imageUrl } from "@/lib/config";
import { discountPercent, formatNaira, maxOrderQty, variantLabel } from "@/lib/format";
import { colors, radius } from "@/lib/theme";
import type { ProductCard, ProductDetail, Variant } from "@/lib/types";

const isPurchasable = (v: Variant) => v.availability !== "sold_out" && (v.stock == null || v.stock > 0);

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const add = useCart((s) => s.add);

  const product = useQuery({ queryKey: ["product", slug], queryFn: () => api<ProductDetail>(`/api/products/${slug}`) });
  const wishlist = useQuery({ queryKey: ["wishlist"], queryFn: () => api<ProductCard[]>("/api/mobile/wishlist"), enabled: !!user });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  const variant = useMemo(() => {
    const vs = product.data?.variants ?? [];
    return vs.find((v) => v.id === selectedId) ?? vs.find(isPurchasable) ?? vs[0];
  }, [product.data, selectedId]);

  const toggleWish = useMutation({
    mutationFn: (productId: number) => api<{ saved: boolean }>("/api/mobile/wishlist", { method: "POST", body: { productId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  if (product.isPending) return <Loading />;
  if (product.isError) return <ErrorView message={product.error.message} onRetry={() => product.refetch()} />;

  const p = product.data;
  const images = p.images.length ? p.images : [p.image];
  const saved = wishlist.data?.some((w) => w.id === p.id) ?? false;
  const buyable = variant ? isPurchasable(variant) : false;
  const max = variant ? maxOrderQty(variant.stock) : 0;
  const off = variant ? discountPercent(variant.price, variant.compareAtPrice) : 0;

  const addToCart = () => {
    if (!variant) return;
    add(
      {
        variantId: variant.id,
        productId: p.id,
        slug: p.slug,
        name: p.name,
        variantLabel: variantLabel(variant),
        image: p.image,
        categorySlug: p.categorySlug,
        price: variant.price,
        onOrder: variant.availability === "on_order",
        stock: variant.stock,
      },
      qty,
    );
    Alert.alert("Added to cart", `${p.name}${variantLabel(variant) ? ` (${variantLabel(variant)})` : ""}`, [
      { text: "Keep shopping", style: "cancel" },
      { text: "View cart", onPress: () => router.push("/cart") },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <Stack.Screen
        options={{
          title: "",
          headerRight: () => (
            <Pressable
              accessibilityLabel={saved ? "Remove from wishlist" : "Save to wishlist"}
              hitSlop={10}
              onPress={() => (user ? toggleWish.mutate(p.id) : router.push("/sign-in"))}
            >
              <Ionicons name={saved ? "heart" : "heart-outline"} size={24} color={saved ? colors.brand : colors.ink} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <FlatList
          horizontal
          pagingEnabled
          data={images}
          keyExtractor={(src, i) => `${src}-${i}`}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <View style={{ width, height: width * 0.85, backgroundColor: colors.mist }}>
              <Image source={imageUrl(item)} style={{ flex: 1, margin: 24 }} contentFit="contain" transition={150} />
            </View>
          )}
        />
        {images.length > 1 ? (
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === imageIndex && styles.dotActive]} />
            ))}
          </View>
        ) : null}

        <View style={{ padding: 16, gap: 10 }}>
          {p.brand ? <Text style={styles.brand}>{p.brand}</Text> : null}
          <Text style={styles.title}>{p.name}</Text>
          {variant ? (
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatNaira(variant.price)}</Text>
              {off ? <Text style={styles.compare}>{formatNaira(variant.compareAtPrice!)}</Text> : null}
              {off ? <Text style={styles.off}>-{off}%</Text> : null}
            </View>
          ) : null}
          {variant ? (
            <Text style={[styles.availability, { color: !buyable ? colors.brand : variant.availability === "on_order" ? colors.sky : colors.success }]}>
              {!buyable
                ? "Sold out"
                : variant.availability === "on_order"
                  ? "Available on order · ships in 1–3 business days"
                  : variant.stock != null && variant.stock <= 5
                    ? `Only ${variant.stock} left — order soon`
                    : "In stock"}
            </Text>
          ) : null}

          {p.variants.length > 1 ? (
            <View style={{ gap: 8, marginTop: 6 }}>
              <Text style={styles.sectionLabel}>Options</Text>
              <View style={styles.variants}>
                {p.variants.map((v) => {
                  const active = v.id === variant?.id;
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => {
                        setSelectedId(v.id);
                        setQty(1);
                      }}
                      style={[styles.variant, active && styles.variantActive, !isPurchasable(v) && { opacity: 0.45 }]}
                    >
                      {v.colorHex ? <View style={[styles.swatch, { backgroundColor: v.colorHex }]} /> : null}
                      <View>
                        <Text style={[styles.variantText, active && { color: colors.white }]}>{variantLabel(v) || "Standard"}</Text>
                        <Text style={[styles.variantPrice, active && { color: colors.white }]}>{formatNaira(v.price)}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {p.shortDescription ? <Text style={styles.body}>{p.shortDescription}</Text> : null}
          {p.highlights.length ? (
            <View style={{ gap: 6, marginTop: 4 }}>
              {p.highlights.map((h) => (
                <View key={h} style={{ flexDirection: "row", gap: 8 }}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={[styles.body, { flex: 1 }]}>{h}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {p.description ? (
            <View style={{ gap: 6, marginTop: 8 }}>
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.body}>{p.description.replace(/<[^>]+>/g, "")}</Text>
            </View>
          ) : null}
          {p.specs.length ? (
            <View style={{ gap: 6, marginTop: 8 }}>
              <Text style={styles.sectionLabel}>Specifications</Text>
              {p.specs.map((s) => (
                <View key={s.label} style={styles.spec}>
                  <Text style={styles.specLabel}>{s.label}</Text>
                  <Text style={styles.specValue}>{s.value}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.buyBar}>
        {buyable ? <QuantityStepper value={qty} max={max} onChange={(n) => setQty(Math.max(1, Math.min(n, max)))} /> : null}
        <Button title={buyable ? "Add to cart" : "Sold out"} icon={buyable ? "bag-add" : undefined} disabled={!buyable} onPress={addToCart} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line },
  dotActive: { backgroundColor: colors.ink, width: 16 },
  brand: { fontSize: 13, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: "800", color: colors.ink, lineHeight: 30 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  price: { fontSize: 24, fontWeight: "800", color: colors.ink },
  compare: { fontSize: 15, color: colors.muted, textDecorationLine: "line-through" },
  off: { fontSize: 13, fontWeight: "700", color: colors.brand },
  availability: { fontSize: 14, fontWeight: "600" },
  sectionLabel: { fontSize: 16, fontWeight: "800", color: colors.ink },
  variants: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  variant: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  variantActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  variantText: { fontSize: 14, fontWeight: "600", color: colors.ink },
  variantPrice: { fontSize: 12.5, color: colors.muted },
  swatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.line },
  body: { fontSize: 15, color: colors.inkSoft, lineHeight: 22 },
  spec: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 8, gap: 12 },
  specLabel: { width: 120, fontSize: 14, color: colors.muted },
  specValue: { flex: 1, fontSize: 14, color: colors.ink },
  buyBar: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white },
});
