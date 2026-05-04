import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { BRAND } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import type { OrbState } from '@/hooks/useOrbController';

export interface DrillOrbProps {
  orbState: OrbState;
  onPress: () => void;
}

/**
 * DrillOrb — the central Floating Action Button for the drill-orb navigation.
 *
 * Renders different content based on `orbState`:
 * - `loading`  : `ActivityIndicator` spinner (cross-platform, no native module required)
 * - `error`    : Ionicons `warning-outline` icon; tap to retry
 * - `ready` / `open` / `animating` : Ionicons `add` icon; tap to open menu
 *
 * Always 64×64 pt, circular (`borderRadius: 32`), `BRAND.blue` background.
 *
 * Requirements: 1.2, 1.4, 2.1, 8.2, 8.3, 10.1
 */
export function DrillOrb({ orbState, onPress }: DrillOrbProps) {
  const theme = useTheme();
  const orbStyle = [styles.orb, { backgroundColor: theme.primary }];

  if (orbState === 'loading') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel="Loading navigation"
        accessibilityRole="button"
        style={orbStyle}
      >
        <ActivityIndicator size="small" color={theme.textInverse} />
      </Pressable>
    );
  }

  if (orbState === 'error') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel="Navigation unavailable, tap to retry"
        accessibilityRole="button"
        style={[styles.orb, { backgroundColor: theme.error }]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="warning-outline" size={32} color={theme.textInverse} />
        </View>
      </Pressable>
    );
  }

  // ready | open | animating | closing
  const isMenuActive = orbState === 'open' || orbState === 'animating' || orbState === 'closing';
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={isMenuActive ? 'Close navigation menu' : 'Open navigation menu'}
      accessibilityRole="button"
      style={orbStyle}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={isMenuActive ? 'remove' : 'add'}
          size={32}
          color={theme.textInverse}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  orb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
