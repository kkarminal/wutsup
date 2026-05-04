import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

import { NavigationNodeDto } from '@/services/navigationApi';
import { CartesianPosition } from '@/utils/orbLayout';
import { BRAND, FONT_SIZE } from '@/constants/colors';

export interface CategoryNodeProps {
  node: NavigationNodeDto;
  position: CartesianPosition;
  isLeaf: boolean;
  onPress: (node: NavigationNodeDto) => void;
  /** Reanimated animated style for drill/back transitions */
  animatedStyle?: AnimatedStyle;
}

/**
 * CategoryNode — a single radial node rendered in the OrbMenu ring.
 *
 * Positioned absolutely using `position.x` and `position.y` as offsets
 * from the centre of the parent container via `transform: translateX/Y`.
 *
 * - Non-leaf nodes use `BRAND.blue` as the circle background.
 * - Leaf nodes use `BRAND.cyan` as the circle background.
 * - The node label is rendered below the circle at a minimum of 11 sp.
 */
export function CategoryNode({
  node,
  position,
  isLeaf,
  onPress,
  animatedStyle,
}: CategoryNodeProps) {
  const circleBackground = isLeaf ? BRAND.cyan : BRAND.blue;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX: position.x }, { translateY: position.y }] },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={() => onPress(node)}
        accessibilityLabel={node.label}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.circle,
          { backgroundColor: circleBackground },
          pressed && styles.circlePressed,
        ]}
      >
        {/* Circle content — icon could be added here in a future iteration */}
      </Pressable>

      <View style={styles.labelContainer}>
        <Text style={styles.label} numberOfLines={2}>
          {node.label}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    // Centre the node on its position point (56 pt circle → offset by half)
    marginLeft: -28,
    marginTop: -28,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlePressed: {
    opacity: 0.8,
  },
  labelContainer: {
    marginTop: 4,
    maxWidth: 72,
  },
  label: {
    fontSize: FONT_SIZE.xs, // 11 sp
    textAlign: 'center',
    color: '#FFFFFF',
  },
});
