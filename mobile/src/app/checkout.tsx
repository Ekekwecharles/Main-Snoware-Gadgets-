import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Button, EmptyState, Field, Loading, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cartSubtotal, useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import { colors, radius } from "@/lib/theme";
import type { Order, StoreInfo } from "@/lib/types";

type CheckoutResult =
  | { ok: true; url: string; reference: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Same checkout as the website: the server re-prices the cart and starts a Paystack payment. */
export default function CheckoutScreen() {
  const { user } = useAuth();
  const items = useCart((s) => s.items);
  const notes = useCart((s) => s.notes);
  const info = useQuery({ queryKey: ["store-info"], queryFn: () => api<StoreInfo>("/api/mobile/store-info") });

  const [form, setForm] = useState(() => ({
    email: user?.email ?? "",
    fullName: user?.name ?? "",
    phone: user?.phone ?? "",
    addressLine: "",
    city: "",
    state: "",
  }));
  const [method, setMethod] = useState<"delivery" | "pickup">("delivery");
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!items.length) return <EmptyState icon="bag-outline" title="Your cart is empty" action={<Button title="Keep shopping" variant="dark" onPress={() => router.replace("/")} />} />;
  if (info.isPending) return <Loading />;

  const zones = info.data?.zones ?? [];
  const zone = zones.find((z) => z.id === zoneId);
  const subtotal = cartSubtotal(items);
  const deliveryFee = method === "delivery" ? (zone?.fee ?? 0) : 0;
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const pay = async () => {
    setBusy(true);
    setErrors({});
    setMessage(null);
    let result: CheckoutResult;
    try {
      result = await api<CheckoutResult>("/api/mobile/checkout", {
        method: "POST",
        body: {
          ...form,
          deliveryMethod: method,
          zoneId: method === "delivery" ? zoneId ?? undefined : undefined,
          notes: notes || undefined,
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          returnUrl: Linking.createURL("checkout-complete"),
        },
      });
    } catch (err) {
      result = err instanceof ApiError && err.body ? (err.body as CheckoutResult) : { ok: false, error: err instanceof Error ? err.message : "Checkout failed." };
    }

    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setMessage(result.error);
      setBusy(false);
      return;
    }

    // Paystack runs in a secure in-app browser and redirects back to the app when done.
    const session = await WebBrowser.openAuthSessionAsync(result.url, Linking.createURL("checkout-complete"));
    let status = "failed";
    if (session.type === "success") {
      status = Linking.parse(session.url).queryParams?.status === "success" ? "success" : "failed";
    } else {
      // Closed without a redirect (or the redirect couldn't reach the app) — ask the server.
      const order = await api<Order>(`/api/mobile/orders/${result.reference}`).catch(() => null);
      status = order?.paymentStatus === "paid" ? "success" : "cancelled";
    }
    setBusy(false);
    router.replace({ pathname: "/checkout-complete", params: { status, reference: result.reference } });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {message ? <Notice tone="error">{message}</Notice> : null}

        <Text style={styles.heading}>Contact</Text>
        <Field label="Email" value={form.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errors.email} />
        <Field label="Full name" value={form.fullName} onChangeText={set("fullName")} autoComplete="name" error={errors.fullName} />
        <Field label="Phone" value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" autoComplete="tel" placeholder="080…" error={errors.phone} />

        <Text style={styles.heading}>Delivery</Text>
        <View style={styles.toggle}>
          {(["delivery", "pickup"] as const).map((m) => (
            <Pressable key={m} onPress={() => setMethod(m)} style={[styles.toggleItem, method === m && styles.toggleActive]}>
              <Ionicons name={m === "delivery" ? "car-outline" : "storefront-outline"} size={18} color={method === m ? colors.white : colors.ink} />
              <Text style={[styles.toggleText, method === m && { color: colors.white }]}>{m === "delivery" ? "Delivery" : "Store pickup"}</Text>
            </Pressable>
          ))}
        </View>

        {method === "pickup" ? (
          <Notice>Pick up for free at our store: {info.data?.store.address}</Notice>
        ) : (
          <>
            <Text style={styles.label}>Delivery location</Text>
            {errors.zoneId ? <Text style={styles.error}>{errors.zoneId}</Text> : null}
            <View style={styles.zones}>
              {zones.map((z) => (
                <Pressable key={z.id} onPress={() => setZoneId(z.id)} style={[styles.zone, zoneId === z.id && styles.zoneActive]}>
                  <Ionicons name={zoneId === z.id ? "radio-button-on" : "radio-button-off"} size={18} color={zoneId === z.id ? colors.brand : colors.muted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.zoneName}>
                      {z.name}, {z.state}
                    </Text>
                    <Text style={styles.zoneMeta}>{z.eta}</Text>
                  </View>
                  <Text style={styles.zoneFee}>{formatNaira(z.fee)}</Text>
                </Pressable>
              ))}
            </View>
            <Field label="Street address" value={form.addressLine} onChangeText={set("addressLine")} autoComplete="street-address" error={errors.addressLine} />
            <Field label="City / area" value={form.city} onChangeText={set("city")} error={errors.city} />
            <Field label="State" value={form.state} onChangeText={set("state")} placeholder={zone?.state} />
          </>
        )}

        <View style={styles.summary}>
          {items.map((i) => (
            <View key={i.variantId} style={styles.summaryRow}>
              <Text style={styles.summaryItem} numberOfLines={1}>
                {i.quantity} × {i.name}
              </Text>
              <Text style={styles.summaryValue}>{formatNaira(i.price * i.quantity)}</Text>
            </View>
          ))}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItem}>Delivery</Text>
            <Text style={styles.summaryValue}>{method === "pickup" ? "Free" : zone ? formatNaira(deliveryFee) : "—"}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 6 }]}>
            <Text style={styles.total}>Total</Text>
            <Text style={styles.total}>{formatNaira(subtotal + deliveryFee)}</Text>
          </View>
        </View>

        <Button title={`Pay ${formatNaira(subtotal + deliveryFee)} with Paystack`} icon="lock-closed" loading={busy} onPress={pay} />
        <Text style={styles.small}>Prices are confirmed by the server before payment. You'll pay securely on Paystack.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: "800", color: colors.ink, marginTop: 6 },
  label: { fontSize: 14, fontWeight: "600", color: colors.ink },
  error: { color: colors.brand, fontSize: 13 },
  toggle: { flexDirection: "row", gap: 8 },
  toggleItem: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md, paddingVertical: 12 },
  toggleActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  toggleText: { fontWeight: "700", color: colors.ink },
  zones: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, overflow: "hidden" },
  zone: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  zoneActive: { backgroundColor: colors.brandSoft },
  zoneName: { fontSize: 14.5, fontWeight: "600", color: colors.ink },
  zoneMeta: { fontSize: 12.5, color: colors.muted },
  zoneFee: { fontSize: 14, fontWeight: "700", color: colors.ink },
  summary: { backgroundColor: colors.mist, borderRadius: radius.lg, padding: 14, gap: 6, marginTop: 6 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  summaryItem: { flex: 1, fontSize: 14, color: colors.inkSoft },
  summaryValue: { fontSize: 14, fontWeight: "600", color: colors.ink },
  total: { fontSize: 17, fontWeight: "800", color: colors.ink },
  small: { fontSize: 12.5, color: colors.muted, textAlign: "center" },
});
