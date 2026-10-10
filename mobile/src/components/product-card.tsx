import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "@/lib/cart";
import { imageUrl } from "@/lib/config";
import { conditionSummary, discountPercent, formatNaira } from "@/lib/format";
import { colors, radius } from "@/lib/theme";
import type { ProductCard as Card } from "@/lib/types";

/** Product tile with a quick add-to-cart for the default (cheapest buyable) variant, like the website's card. */
export function ProductCard({ product, width }: { product: Card; width?: number }) {
  const add = useCart((s) => s.add);
  const off = discountPercent(product.price, product.compareAtPrice);
  const canQuickAdd = product.inStock && product.defaultVariantId != null;

  return (
    <Pressable onPress={() => router.push(`/product/${product.slug}`)} style={[styles.card, width ? { width } : { flex: 1 }]}>
      <View style={styles.imageWrap}>
        <Image source={imageUrl(product.image)} style={styles.image} contentFit="contain" transition={150} />
        {product.badge || off ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{product.badge ?? `-${off}%`}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ padding: 10, gap: 4, flex: 1 }}>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        {product.conditions?.length ? (
          <Text style={[styles.condition, product.conditions.length === 1 && product.conditions[0] === "new" && { color: colors.success }]}>
            {conditionSummary(product.conditions)}
          </Text>
        ) : null}
        <View style={{ flex: 1 }} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.price}>{formatNaira(product.price)}</Text>
            {product.compareAtPrice && off ? <Text style={styles.compare}>{formatNaira(product.compareAtPrice)}</Text> : null}
            {!product.inStock ? <Text style={styles.soldOut}>Sold out</Text> : product.onOrderOnly ? <Text style={styles.onOrder}>On order</Text> : null}
          </View>
          {canQuickAdd ? (
            <Pressable
              accessibilityLabel={`Add ${product.name} to cart`}
              hitSlop={6}
              style={styles.addBtn}
              onPress={() =>
                add({
                  variantId: product.defaultVariantId!,
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  variantLabel: product.defaultVariantLabel,
                  image: product.image,
                  categorySlug: product.categorySlug,
                  price: product.price,
                  onOrder: product.defaultVariantOnOrder,
                  stock: product.defaultVariantStock,
                })
              }
            >
              <Ionicons name="add" size={20} color={colors.white} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  imageWrap: { aspectRatio: 1, backgroundColor: colors.mist },
  image: { flex: 1, margin: 10 },
  badge: { position: "absolute", top: 8, left: 8, backgroundColor: colors.brand, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  name: { fontSize: 14, fontWeight: "600", color: colors.ink, lineHeight: 19 },
  condition: { fontSize: 12, fontWeight: "600", color: colors.navy },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  price: { fontSize: 15, fontWeight: "800", color: colors.ink },
  compare: { fontSize: 12, color: colors.muted, textDecorationLine: "line-through" },
  soldOut: { fontSize: 12, color: colors.brand, fontWeight: "600" },
  onOrder: { fontSize: 12, color: colors.sky, fontWeight: "600" },
  addBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
});
