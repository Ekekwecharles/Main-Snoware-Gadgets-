import { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProductGrid } from "@/components/product-grid";
import { EmptyState } from "@/components/ui";
import { colors, radius } from "@/lib/theme";

export default function SearchScreen() {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 350);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={styles.bar}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Search iPhone, PS5, Starlink…"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          autoCorrect={false}
          style={styles.input}
        />
        {text ? <Ionicons name="close-circle" size={18} color={colors.muted} onPress={() => setText("")} /> : null}
      </View>
      {q.length >= 2 ? (
        <ProductGrid params={{ q }} emptyTitle={`No results for “${q}”`} />
      ) : (
        <EmptyState icon="search-outline" title="Find your next gadget" body="Search by product name, brand or model." />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.mist,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: 16, color: colors.ink },
});
