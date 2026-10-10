import { useEffect, useState } from "react";
import { AppState, Linking, Modal, Platform, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { colors, radius } from "@/lib/theme";
import type { StoreInfo } from "@/lib/types";
import { Button } from "./ui";

const DISMISS_KEY = "snoware:update-dismissed";
const REMIND_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

/** -1 / 0 / 1 for dotted versions like 1.2.0 (missing parts count as 0). */
function compareVersions(a: string, b: string) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

/**
 * The APK is installed outside the Play Store, so nothing else tells people a new build exists.
 * Compares this build's version with the one set in the website's admin and asks (or requires) them to update.
 * JS-only changes don't need this — they arrive automatically through EAS Update.
 */
export function UpdatePrompt() {
  const installed = Constants.expoConfig?.version ?? "0";
  const info = useQuery({
    queryKey: ["store-info"],
    queryFn: () => api<StoreInfo>("/api/mobile/store-info"),
    staleTime: 10 * 60_000,
    enabled: Platform.OS === "android",
  });
  const [snoozed, setSnoozed] = useState<boolean | null>(null);

  // Check again whenever the app comes back to the foreground (it can stay open for days).
  const { refetch } = info;
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refetch();
    });
    return () => sub.remove();
  }, [refetch]);

  const app = info.data?.app;
  const latest = app?.latestVersion;
  const required = !!app?.minVersion && compareVersions(installed, app.minVersion) < 0;
  const available = !!latest && compareVersions(installed, latest) < 0;

  useEffect(() => {
    if (!latest) return;
    AsyncStorage.getItem(DISMISS_KEY)
      .then((raw) => {
        const saved = raw ? (JSON.parse(raw) as { version: string; at: number }) : null;
        setSnoozed(!!saved && saved.version === latest && Date.now() - saved.at < REMIND_AFTER_MS);
      })
      .catch(() => setSnoozed(false));
  }, [latest]);

  if (!app || !(required || (available && snoozed === false))) return null;

  const later = () => {
    setSnoozed(true);
    AsyncStorage.setItem(DISMISS_KEY, JSON.stringify({ version: latest, at: Date.now() })).catch(() => {});
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={required ? () => {} : later} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <Ionicons name="arrow-down-circle" size={34} color={colors.brand} />
          </View>
          <Text style={styles.title}>{required ? "Update required" : "Update available"}</Text>
          <Text style={styles.body}>
            {required
              ? `This version of Snoware Gadgets (${installed}) is no longer supported. Install the latest version to keep shopping.`
              : `Version ${latest} of Snoware Gadgets is ready, with the latest fixes and improvements. You're on ${installed}.`}
          </Text>
          <Text style={styles.hint}>Download it, then open the file and tap Update. Your account and cart stay as they are.</Text>
          <Button title="Download update" icon="download-outline" onPress={() => Linking.openURL(app.androidUrl)} style={styles.action} />
          {!required && <Button title="Later" variant="ghost" onPress={later} />}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(10,10,11,0.55)", justifyContent: "center", padding: 24 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 24, alignItems: "center" },
  badge: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  title: { marginTop: 16, fontSize: 20, fontWeight: "800", color: colors.ink },
  body: { marginTop: 8, fontSize: 15, lineHeight: 21, color: colors.ink, textAlign: "center" },
  hint: { marginTop: 8, fontSize: 13, lineHeight: 18, color: colors.muted, textAlign: "center" },
  action: { marginTop: 20, alignSelf: "stretch" },
});
