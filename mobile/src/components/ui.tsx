import { useState, type ComponentProps, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@/lib/theme";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "dark" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>["name"];
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = "primary", loading, disabled, icon, style }: ButtonProps) {
  const inactive = disabled || loading;
  const fg = variant === "outline" || variant === "ghost" ? colors.ink : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" && { backgroundColor: colors.brand },
        variant === "dark" && { backgroundColor: colors.ink },
        variant === "outline" && { borderWidth: 1.5, borderColor: colors.ink },
        inactive && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={fg} />}
          <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

type FieldProps = ComponentProps<typeof TextInput> & { label: string; error?: string };

export function Field({ label, error, style, secureTextEntry, ...props }: FieldProps) {
  const [revealed, setRevealed] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          placeholderTextColor={colors.muted}
          style={[styles.input, secureTextEntry && { paddingRight: 48 }, error && { borderColor: colors.brand }, style]}
          secureTextEntry={secureTextEntry && !revealed}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            hitSlop={8}
            onPress={() => setRevealed((r) => !r)}
            style={styles.reveal}
          >
            <Ionicons name={revealed ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const bg = tone === "error" ? colors.brandSoft : tone === "success" ? "#e8f6f0" : colors.navySoft;
  const fg = tone === "error" ? colors.brandDark : tone === "success" ? colors.success : colors.navy;
  return (
    <View style={[styles.notice, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 14, lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ComponentProps<typeof Ionicons>["name"]; title: string; body?: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={44} color={colors.muted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {action ? <View style={{ marginTop: 16, alignSelf: "stretch" }}>{action}</View> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.brand} size="large" />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState icon="cloud-offline-outline" title="Something went wrong" body={message} action={onRetry ? <Button title="Try again" variant="dark" onPress={onRetry} /> : null} />
  );
}

export function QuantityStepper({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityLabel="Decrease quantity" hitSlop={8} onPress={() => onChange(value - 1)} style={styles.stepBtn}>
        <Ionicons name={value <= 1 ? "trash-outline" : "remove"} size={16} color={colors.ink} />
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable accessibilityLabel="Increase quantity" hitSlop={8} disabled={value >= max} onPress={() => onChange(value + 1)} style={[styles.stepBtn, value >= max && { opacity: 0.35 }]}>
        <Ionicons name="add" size={16} color={colors.ink} />
      </Pressable>
    </View>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action}
    </View>
  );
}

export const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: { fontSize: 16, fontWeight: "700" },
  label: { fontSize: 14, fontWeight: "600", color: colors.ink },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  reveal: { position: "absolute", right: 0, top: 0, bottom: 0, width: 48, alignItems: "center", justifyContent: "center" },
  error: { color: colors.brand, fontSize: 13 },
  notice: { borderRadius: radius.md, padding: 14 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 6 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.ink, marginTop: 10, textAlign: "center" },
  emptyBody: { fontSize: 15, color: colors.muted, textAlign: "center", lineHeight: 21 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill },
  stepBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  stepValue: { minWidth: 26, textAlign: "center", fontSize: 15, fontWeight: "700", color: colors.ink },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: colors.ink },
});
