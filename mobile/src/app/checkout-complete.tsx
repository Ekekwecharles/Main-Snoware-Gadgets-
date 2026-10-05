import { useEffect } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui";
import { useCart } from "@/lib/cart";
import { colors } from "@/lib/theme";

/** Landing screen after Paystack (also the target of the snowaregadgets://checkout-complete deep link). */
export default function CheckoutCompleteScreen() {
  const { status, reference } = useLocalSearchParams<{ status?: string; reference?: string }>();
  const queryClient = useQueryClient();
  const success = status === "success";

  useEffect(() => {
    if (!success) return;
    // Signed in: the server already emptied the account cart on every device. Guests: empty it here.
    useCart.getState().clear();
    void queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [success, queryClient]);

  return (
    <View style={styles.container}>
      <Ionicons name={success ? "checkmark-circle" : "close-circle"} size={72} color={success ? colors.success : colors.brand} />
      <Text style={styles.title}>{success ? "Thank you for your order!" : "Payment not completed"}</Text>
      <Text style={styles.body}>
        {success
          ? "We've emailed your receipt. You can follow your order's progress here or on the website."
          : "You haven't been charged for this order. If money left your account, message us with your reference and we'll sort it out."}
      </Text>
      {reference ? <Text style={styles.ref}>{reference}</Text> : null}
      <View style={{ alignSelf: "stretch", gap: 10, marginTop: 12 }}>
        {success && reference ? <Button title="Track order" variant="dark" onPress={() => router.replace(`/orders/${reference}`)} /> : null}
        {!success ? <Button title="Back to cart" variant="dark" onPress={() => router.replace("/cart")} /> : null}
        {!success && reference ? (
          <Button
            title="Get help on WhatsApp"
            variant="outline"
            icon="logo-whatsapp"
            onPress={() => Linking.openURL(`https://wa.me/2347048236937?text=${encodeURIComponent(`Hi, I need help with my payment. Reference: ${reference}`)}`)}
          />
        ) : null}
        <Button title="Continue shopping" variant="ghost" onPress={() => router.replace("/")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10, backgroundColor: colors.white },
  title: { fontSize: 24, fontWeight: "800", color: colors.ink, textAlign: "center" },
  body: { fontSize: 15, color: colors.muted, textAlign: "center", lineHeight: 22 },
  ref: { fontFamily: "monospace", backgroundColor: colors.mist, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, overflow: "hidden", color: colors.ink },
});
