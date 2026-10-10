import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { Button, ErrorView, Loading } from "@/components/ui";
import { api } from "@/lib/api";
import { imageUrl } from "@/lib/config";
import { formatNaira } from "@/lib/format";
import { colors, radius } from "@/lib/theme";
import type { Order } from "@/lib/types";

const deliverySteps = [
  { key: "paid", label: "Order placed" },
  { key: "processing", label: "Preparing" },
  { key: "shipped", label: "On the way" },
  { key: "delivered", label: "Delivered" },
];
const pickupSteps = [
  { key: "paid", label: "Order placed" },
  { key: "processing", label: "Preparing" },
  { key: "ready_for_pickup", label: "Ready for pickup" },
  { key: "delivered", label: "Collected" },
];

export default function OrderScreen() {
  const { reference } = useLocalSearchParams<{ reference: string }>();
  const order = useQuery({ queryKey: ["order", reference], queryFn: () => api<Order>(`/api/mobile/orders/${reference}`), refetchInterval: 60_000 });

  if (order.isPending) return <Loading />;
  if (order.isError) return <ErrorView message={order.error.message} onRetry={() => order.refetch()} />;

  const o = order.data;
  const steps = o.deliveryMethod === "pickup" ? pickupSteps : deliverySteps;
  const current = steps.findIndex((s) => s.key === o.status);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      <View style={{ gap: 4 }}>
        <Text style={styles.ref}>{o.reference}</Text>
        <Text style={styles.meta}>Placed {new Date(o.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</Text>
      </View>

      {o.status === "cancelled" ? (
        <Text style={[styles.status, { color: colors.brand }]}>This order was cancelled.</Text>
      ) : o.awaitingTransfer ? (
        <View style={{ gap: 10 }}>
          <Text style={[styles.status, { color: colors.sky }]}>{o.statusLabel}</Text>
          <Text style={styles.meta}>
            Transfer {formatNaira(o.total)} to our OPay or Moniepoint account with {o.reference} in the narration, then upload your payment screenshot.
          </Text>
          {o.payUrl ? (
            <Button
              title={o.statusLabel === "Confirming payment" ? "View payment details" : "Pay & upload screenshot"}
              variant="dark"
              icon="cloud-upload-outline"
              onPress={async () => {
                await WebBrowser.openBrowserAsync(o.payUrl!);
                void order.refetch();
              }}
            />
          ) : null}
        </View>
      ) : o.paymentStatus !== "paid" ? (
        <Text style={[styles.status, { color: colors.brand }]}>{o.statusLabel}</Text>
      ) : (
        <View style={styles.steps}>
          {steps.map((s, i) => {
            const done = i <= current;
            return (
              <View key={s.key} style={styles.step}>
                <View style={[styles.stepDot, done && { backgroundColor: colors.success, borderColor: colors.success }]} />
                <Text style={[styles.stepLabel, done && { color: colors.ink, fontWeight: "700" }]}>{s.label}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.box}>
        {o.items.map((i, idx) => (
          <View key={idx} style={styles.item}>
            <View style={styles.thumb}>
              <Image source={imageUrl(i.image)} style={{ flex: 1 }} contentFit="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{i.name}</Text>
              {i.variantLabel ? <Text style={styles.meta}>{i.variantLabel}</Text> : null}
              <Text style={styles.meta}>
                {i.quantity} × {formatNaira(i.unitPrice)}
              </Text>
            </View>
          </View>
        ))}
        <View style={styles.line}>
          <Text style={styles.meta}>Subtotal</Text>
          <Text style={styles.value}>{formatNaira(o.subtotal)}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.meta}>Delivery</Text>
          <Text style={styles.value}>{o.deliveryFee ? formatNaira(o.deliveryFee) : "Free"}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.total}>Total</Text>
          <Text style={styles.total}>{formatNaira(o.total)}</Text>
        </View>
      </View>

      <View style={styles.box}>
        <Text style={styles.heading}>{o.deliveryMethod === "pickup" ? "Store pickup" : "Delivery to"}</Text>
        <Text style={styles.body}>{o.fullName}</Text>
        <Text style={styles.body}>{o.phone}</Text>
        {o.deliveryMethod === "delivery" ? <Text style={styles.body}>{[o.addressLine, o.city, o.state].filter(Boolean).join(", ")}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ref: { fontFamily: "monospace", fontSize: 17, fontWeight: "800", color: colors.ink },
  meta: { fontSize: 13.5, color: colors.muted },
  status: { fontSize: 15, fontWeight: "700" },
  steps: { gap: 12, paddingLeft: 4 },
  step: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.line },
  stepLabel: { fontSize: 15, color: colors.muted },
  box: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 14, gap: 10 },
  item: { flexDirection: "row", gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.mist, padding: 4 },
  itemName: { fontSize: 14.5, fontWeight: "600", color: colors.ink },
  line: { flexDirection: "row", justifyContent: "space-between" },
  value: { fontSize: 14, fontWeight: "600", color: colors.ink },
  total: { fontSize: 16, fontWeight: "800", color: colors.ink },
  heading: { fontSize: 15, fontWeight: "800", color: colors.ink },
  body: { fontSize: 14.5, color: colors.inkSoft },
});
