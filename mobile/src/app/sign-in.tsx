import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { authStyles } from "@/components/auth-styles";
import { Button, Field, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isGoogleSignInAvailable } from "@/lib/google";
import { colors } from "@/lib/theme";

/** Sign in with the same account used on the website. */
export default function SignInScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState<"password" | "google" | null>(null);

  const done = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const submit = async () => {
    setBusy("password");
    setError(null);
    setInfo(null);
    try {
      await signIn(email, password);
      done();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setUnverified(err instanceof ApiError && (err.body as { code?: string } | null)?.code === "email_not_verified");
    } finally {
      setBusy(null);
    }
  };

  const google = async () => {
    setBusy("google");
    setError(null);
    try {
      if (await signInWithGoogle()) done();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setBusy(null);
    }
  };

  const resend = async () => {
    const res = await api<{ message?: string }>("/api/mobile/auth/resend-verification", { method: "POST", body: { email } }).catch(() => null);
    setInfo(res?.message ?? "If that account needs verifying, a new link is on its way.");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>Use the same email and password as on the Snoware website.</Text>
        {error ? <Notice tone="error">{error}</Notice> : null}
        {info ? <Notice tone="success">{info}</Notice> : null}
        {unverified ? <Button title="Resend verification email" variant="outline" onPress={resend} /> : null}

        {isGoogleSignInAvailable() ? (
          <>
            <Button title="Continue with Google" variant="outline" icon="logo-google" loading={busy === "google"} disabled={!!busy} onPress={google} />
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.or}>or</Text>
              <View style={styles.line} />
            </View>
          </>
        ) : null}

        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" onSubmitEditing={submit} />
        <Pressable onPress={() => router.push("/forgot-password")} hitSlop={8}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>
        <Button title="Sign in" variant="dark" loading={busy === "password"} disabled={!!busy || !email || !password} onPress={submit} />
        <Pressable onPress={() => router.replace("/sign-up")} hitSlop={8} style={{ alignSelf: "center" }}>
          <Text style={styles.footer}>
            New to Snoware? <Text style={styles.link}>Create an account</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  ...authStyles,
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
  or: { color: colors.muted, fontSize: 13 },
});
