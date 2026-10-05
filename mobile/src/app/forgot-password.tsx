import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { Button, Field, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { authStyles as styles } from "@/components/auth-styles";
import type { FormResult } from "@/lib/types";

/** Emails a reset link. The link opens the website, and the new password works in the app too. */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<FormResult>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      setResult(await api<FormResult>("/api/mobile/auth/forgot-password", { method: "POST", body: { email } }));
    } catch (err) {
      setResult({ ok: false, message: err instanceof ApiError ? err.message : "Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.lead}>Enter your email and we'll send you a link to set a new password.</Text>
      {result?.message ? <Notice tone={result.ok ? "success" : "error"}>{result.message}</Notice> : null}
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" error={result?.fieldErrors?.email} />
      <Button title="Send reset link" variant="dark" loading={busy} disabled={!email} onPress={submit} />
    </ScrollView>
  );
}
