import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { Button, Field, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { authStyles as styles } from "@/components/auth-styles";
import type { FormResult } from "@/lib/types";

/** Creates a Snoware account — the same account works on the website. */
export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<FormResult>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      setResult(await api<FormResult>("/api/mobile/auth/register", { method: "POST", body: { name, email, password } }));
    } catch (err) {
      setResult(err instanceof ApiError ? (err.body as FormResult) ?? { ok: false, message: err.message } : { ok: false, message: "Sign-up failed." });
    } finally {
      setBusy(false);
    }
  };

  const errors = result?.fieldErrors ?? {};

  if (result?.ok)
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Notice tone="success">{result.message}</Notice>
        <Button title="Go to sign in" variant="dark" onPress={() => router.replace("/sign-in")} />
      </ScrollView>
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>One account for the Snoware website and app. We'll email you a link to verify your address.</Text>
        {result?.message ? <Notice tone="error">{result.message}</Notice> : null}
        <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" error={errors.name} />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" error={errors.email} />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" error={errors.password} />
        <Text style={styles.footer}>At least 8 characters, with a letter and a number.</Text>
        <Button title="Create account" variant="dark" loading={busy} disabled={!name || !email || !password} onPress={submit} />
        <Pressable onPress={() => router.replace("/sign-in")} hitSlop={8} style={{ alignSelf: "center" }}>
          <Text style={styles.footer}>
            Already have an account? <Text style={styles.link}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
