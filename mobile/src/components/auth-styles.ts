import { StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

/** Shared layout for the sign-in, sign-up and reset screens. */
export const authStyles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  lead: { fontSize: 15, color: colors.muted, lineHeight: 21 },
  link: { color: colors.brand, fontWeight: "700", fontSize: 14 },
  footer: { fontSize: 14, color: colors.muted },
});
