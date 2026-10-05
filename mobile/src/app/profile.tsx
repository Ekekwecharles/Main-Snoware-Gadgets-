import { useState } from "react";
import { ScrollView } from "react-native";
import { Button, Field, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { FormResult, User } from "@/lib/types";

/** Edits the same profile shown on the website's account page. */
export default function ProfileScreen() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [result, setResult] = useState<FormResult>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const res = await api<FormResult & { user?: User }>("/api/mobile/me", { method: "PATCH", body: { name, phone } });
      if (res?.user) setUser(res.user);
      setResult(res);
    } catch (err) {
      setResult({ ok: false, message: err instanceof ApiError ? err.message : "Couldn't save your profile." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
      {result?.message ? <Notice tone={result.ok ? "success" : "error"}>{result.message}</Notice> : null}
      <Field label="Email" value={user?.email ?? ""} editable={false} style={{ opacity: 0.6 }} />
      <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
      <Button title="Save changes" variant="dark" loading={busy} onPress={save} />
    </ScrollView>
  );
}
