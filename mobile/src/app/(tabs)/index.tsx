import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { SpinningSnowflake } from "@/components/snowflake";
import { ErrorView, Loading, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api";
import { imageUrl } from "@/lib/config";
import { hrefFromSitePath } from "@/lib/links";
import { colors, radius } from "@/lib/theme";
import type { Banner, HomeData } from "@/lib/types";

/** `art` matches the website hero's snowflake tint for each theme (stronger when a photo sits on top). */
const bannerTheme: Record<string, { bg: string; fg: string; art: string }> = {
  light: { bg: colors.mist, fg: colors.ink, art: "rgba(11, 31, 77, 0.2)" },
  dark: { bg: colors.ink, fg: colors.white, art: "rgba(255, 255, 255, 0.2)" },
  red: { bg: colors.brand, fg: colors.white, art: "rgba(255, 255, 255, 0.25)" },
  navy: { bg: colors.navy, fg: colors.white, art: "rgba(255, 255, 255, 0.2)" },
  blue: { bg: colors.sky, fg: colors.white, art: "rgba(255, 255, 255, 0.25)" },
};

const ART_SIZE = 210;

function BannerCard({ banner, width }: { banner: Banner; width: number }) {
  const theme = bannerTheme[banner.theme] ?? bannerTheme.light;
  const href = hrefFromSitePath(banner.ctaHref);
  return (
    <Pressable disabled={!href} onPress={() => href && router.push(href)} style={[styles.banner, { width, backgroundColor: theme.bg }]}>
      <View style={{ flex: 1, gap: 4, zIndex: 1 }}>
        {banner.eyebrow ? <Text style={[styles.eyebrow, { color: theme.fg }]}>{banner.eyebrow}</Text> : null}
        <Text style={[styles.bannerTitle, { color: theme.fg }]} numberOfLines={2}>
          {banner.title}
        </Text>
        {banner.priceText ? <Text style={[styles.bannerPrice, { color: theme.fg }]}>{banner.priceText}</Text> : null}
        {banner.ctaLabel ? <Text style={[styles.cta, { color: theme.fg }]}>{banner.ctaLabel} →</Text> : null}
      </View>
      <View style={styles.art}>
        {/* Signature snowflake, always rotating behind the slide art — same as the website hero. */}
        <SpinningSnowflake size={ART_SIZE} color={theme.art} style={styles.snowflake} />
        {banner.image ? <Image source={imageUrl(banner.image)} style={styles.bannerImage} contentFit="contain" /> : null}
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const home = useQuery({ queryKey: ["home"], queryFn: () => api<HomeData>("/api/mobile/home") });

  if (home.isPending) return <Loading />;
  if (home.isError) return <ErrorView message={home.error.message} onRetry={() => home.refetch()} />;

  const { announcement, banners, sections } = home.data;
  const cardWidth = Math.min(180, width * 0.44);

  return (
    <ScrollView
      style={{ backgroundColor: colors.white }}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={home.isRefetching} onRefresh={() => home.refetch()} tintColor={colors.brand} />}
    >
      {announcement ? (
        <View style={styles.announcement}>
          <Text style={styles.announcementText}>{announcement}</Text>
        </View>
      ) : null}

      {banners.length ? (
        <FlatList
          horizontal
          data={banners}
          keyExtractor={(b) => String(b.id)}
          showsHorizontalScrollIndicator={false}
          snapToInterval={width - 32 + 12}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingTop: 16 }}
          renderItem={({ item }) => <BannerCard banner={item} width={width - 32} />}
        />
      ) : null}

      {sections.map((section) => (
        <View key={section.title} style={{ marginTop: 28 }}>
          <SectionTitle
            action={
              <Pressable
                hitSlop={8}
                onPress={() =>
                  router.push({
                    pathname: "/listing",
                    params: section.used ? { used: "1", title: section.title } : { category: section.category ?? "", title: section.title },
                  })
                }
              >
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            }
          >
            {section.title}
          </SectionTitle>
          <FlatList
            horizontal
            data={section.products}
            keyExtractor={(p) => String(p.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  announcement: { backgroundColor: colors.navy, paddingVertical: 8, paddingHorizontal: 16 },
  announcementText: { color: colors.white, fontSize: 12.5, textAlign: "center" },
  banner: { minHeight: 170, borderRadius: radius.lg, padding: 18, flexDirection: "row", alignItems: "center", gap: 10, overflow: "hidden" },
  eyebrow: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", opacity: 0.8, letterSpacing: 0.5 },
  bannerTitle: { fontSize: 22, fontWeight: "800", lineHeight: 27 },
  bannerPrice: { fontSize: 14, fontWeight: "600", opacity: 0.9 },
  cta: { fontSize: 14, fontWeight: "700", marginTop: 6 },
  art: { width: 130, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  snowflake: { position: "absolute", top: "50%", left: "50%", marginTop: -ART_SIZE / 2, marginLeft: -ART_SIZE / 2 },
  bannerImage: { width: 120, height: 130 },
  seeAll: { color: colors.brand, fontWeight: "700", fontSize: 14 },
});
