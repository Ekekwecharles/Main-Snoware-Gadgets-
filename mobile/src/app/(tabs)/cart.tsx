import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, EmptyState, QuantityStepper } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { cartCount, cartSubtotal, useCart } from "@/lib/cart";
import { imageUrl } from "@/lib/config";
import { formatNaira, maxOrderQty } from "@/lib/format";
import { colors, radius } from "@/lib/theme";

/** The cart. When signed in it's the same cart as on the website and updates live. */
export default function CartScreen() {
  const { user } = useAuth();
  const items = useCart((s) => s.items);
  const notes = useCart((s) => s.notes);
  const { setQuantity, remove, setNotes } = useCart.getState();

  if (!items.length)
    return (
      <EmptyState
        icon="bag-outline"
        title="Your cart is empty"
        body={user ? "Items you add here or on the website show up in both places." : "Sign in to keep your cart in sync with the website."}
        action={<Button title="Start shopping" variant="dark" onPress={() => router.push("/shop")} />}
      />
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      {!user ? (
        <Pressable style={styles.syncHint} onPress={() => router.push("/sign-in")}>
          <Ionicons name="sync" size={16} color={colors.navy} />
          <Text style={styles.syncHintText}>Sign in to sync this cart with the website</Text>
        </Pressable>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.variantId)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View style={styles.line}>
            <Pressable onPress={() => router.push(`/product/${item.slug}`)} style={styles.thumbWrap}>
              <Image source={imageUrl(item.image)} style={{ flex: 1 }} contentFit="contain" />
            </Pressable>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              {item.variantLabel ? <Text style={styles.meta}>{item.variantLabel}</Text> : null}
              {item.onOrder ? <Text style={styles.onOrder}>Available on order · ships in 1–3 business days</Text> : null}
              <View style={styles.lineFooter}>
                <QuantityStepper value={item.quantity} max={maxOrderQty(item.stock)} onChange={(n) => (n <= 0 ? remove(item.variantId) : setQuantity(item.variantId, n))} />
                <Text style={styles.price}>{formatNaira(item.price * item.quantity)}</Text>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={{ gap: 6, marginTop: 8 }}>
            <Text style={styles.notesLabel}>Order notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything we should know?"
              placeholderTextColor={colors.muted}
              multiline
              maxLength={1000}
              style={styles.notes}
            />
          </View>
        }
      />
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal ({cartCount(items)} items)</Text>
          <Text style={styles.summaryValue}>{formatNaira(cartSubtotal(items))}</Text>
        </View>
        <Text style={styles.summaryNote}>Delivery is calculated at checkout.</Text>
        <Button title="Checkout" icon="lock-closed" onPress={() => router.push("/checkout")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  syncHint: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: colors.navySoft, paddingHorizontal: 16, paddingVertical: 10 },
  syncHintText: { color: colors.navy, fontSize: 13.5, fontWeight: "600" },
  line: { flexDirection: "row", gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  thumbWrap: { width: 84, height: 84, backgroundColor: colors.mist, borderRadius: radius.md, padding: 6 },
  name: { fontSize: 15, fontWeight: "600", color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
  onOrder: { fontSize: 12, color: colors.sky },
  lineFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  price: { fontSize: 15, fontWeight: "800", color: colors.ink },
  notesLabel: { fontSize: 14, fontWeight: "600", color: colors.ink },
  notes: { minHeight: 70, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, fontSize: 15, textAlignVertical: "top", color: colors.ink },
  summary: { padding: 16, gap: 8, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 15, color: colors.muted },
  summaryValue: { fontSize: 18, fontWeight: "800", color: colors.ink },
  summaryNote: { fontSize: 12.5, color: colors.muted, marginBottom: 4 },
});
