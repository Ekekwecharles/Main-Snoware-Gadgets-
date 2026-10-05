import { useEffect, useState } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";
import Svg, { G, Path } from "react-native-svg";

/** The Snoware snowflake, same geometry as the website's (src/components/brand/logo.tsx). */
export function Snowflake({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      {[0, 60, 120].map((deg) => (
        <G key={deg} rotation={deg} origin="24, 24">
          <Path d="M24 4v40" />
          <Path d="M24 10l-4-4M24 10l4-4M24 38l-4 4M24 38l4 4" />
          <Path d="M24 17l-6-5M24 17l6-5M24 31l-6 5M24 31l6 5" />
        </G>
      ))}
    </Svg>
  );
}

/** Signature hero snowflake: one slow, steady turn per minute, like the website's `animate-snow-spin`. */
export function SpinningSnowflake({ size, color, style }: { size: number; color: string; style?: StyleProp<ViewStyle> }) {
  const [turn] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(turn, { toValue: 1, duration: 60_000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [turn]);

  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <Animated.View pointerEvents="none" style={[{ width: size, height: size, transform: [{ rotate }] }, style]}>
      <Snowflake size={size} color={color} />
    </Animated.View>
  );
}
