import type { ComponentProps } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Loading } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radius } from "@/lib/theme";
import type { StoreInfo } from "@/lib/types";

function Row({ icon, label, onPress }: { icon: ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.ink} />
      <Text style={styles.rowText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function AccountScreen() {
  const { user, loading, signOut } = useAuth();
  const info = useQuery({ queryKey: ["store-info"], queryFn: () => api<StoreInfo>("/api/mobile/store-info"), staleTime: 10 * 60_000 });

  if (loading) return <Loading />;
  const go = (href: Href) => () => router.push(href);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      {user ? (
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user.name ?? user.email)[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user.name ?? "Snoware customer"}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.card, { flexDirection: "column", alignItems: "stretch", gap: 12 }]}>
          <Text style={styles.name}>Welcome to Snoware</Text>
          <Text style={styles.email}>Sign in with your website account to track orders, save favourites and keep one cart across the website and app.</Text>
          <Button title="Sign in" variant="dark" onPress={go("/sign-in")} />
          <Button title="Create account" variant="outline" onPress={go("/sign-up")} />
        </View>
      )}

      {user ? (
        <View style={styles.group}>
          <Row icon="receipt-outline" label="My orders" onPress={go("/orders")} />
          <Row icon="heart-outline" label="Wishlist" onPress={go("/wishlist")} />
          <Row icon="person-circle-outline" label="Profile" onPress={go("/profile")} />
        </View>
      ) : null}

      <View style={styles.group}>
        {info.data ? (
          <>
            <Row icon="logo-whatsapp" label="Chat with us on WhatsApp" onPress={() => Linking.openURL(info.data.store.whatsappLink)} />
            <Row icon="mail-outline" label={info.data.store.email} onPress={() => Linking.openURL(`mailto:${info.data.store.email}`)} />
            <View style={styles.storeInfo}>
              <Text style={styles.storeLabel}>Visit our store</Text>
              <Text style={styles.storeText}>{info.data.store.address}</Text>
              <Text style={styles.storeText}>{info.data.store.hours}</Text>
            </View>
          </>
        ) : null}
      </View>

      {user ? <Button title="Sign out" variant="outline" icon="log-out-outline" onPress={() => void signOut()} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: radius.lg, backgroundColor: colors.mist },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.white, fontSize: 22, fontWeight: "800" },
  name: { fontSize: 18, fontWeight: "800", color: colors.ink },
  email: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  group: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowText: { flex: 1, fontSize: 15.5, color: colors.ink, fontWeight: "500" },
  storeInfo: { padding: 16, gap: 3 },
  storeLabel: { fontSize: 14, fontWeight: "700", color: colors.ink },
  storeText: { fontSize: 14, color: colors.muted, lineHeight: 20 },
});
