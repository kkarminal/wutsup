import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import AnimatedGlow, { type PresetConfig } from 'react-native-animated-glow';

import { useTheme } from '@/hooks/useTheme';
import type { OrbState } from '@/hooks/useOrbController';

// Neon cyan glow preset for the FAB
const fabGlowPreset: PresetConfig = {
  metadata: { name: 'FAB Glow', textColor: '#FFFFFF', category: 'Custom', tags: [] },
  states: [
    {
      name: 'default',
      preset: {
        cornerRadius: 32,
        outlineWidth: 1.5,
        borderColor: '#00DDFF',
        glowLayers: [
          { colors: ['#00DDFF', '#0088FF'], opacity: 0.6, glowSize: 12 },
        ],
      },
    },
  ],
};

export interface DrillOrbProps {
  orbState: OrbState;
  onPress: () => void;
}

export function DrillOrb({ orbState, onPress }: DrillOrbProps) {
  const theme = useTheme();
  const orbStyle = [styles.orb, { backgroundColor: theme.primary }];

  if (orbState === 'loading') {
    return (
      <AnimatedGlow preset={fabGlowPreset}>
        <Pressable
          onPress={onPress}
          accessibilityLabel="Loading navigation"
          accessibilityRole="button"
          style={orbStyle}
        >
          <ActivityIndicator size="small" color={theme.textInverse} />
        </Pressable>
      </AnimatedGlow>
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

  const isMenuActive = orbState === 'open' || orbState === 'animating' || orbState === 'closing';

  const orbButton = (
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

  // No glow when the pie menu is visible
  if (isMenuActive) return orbButton;

  return (
    <AnimatedGlow preset={fabGlowPreset}>
      {orbButton}
    </AnimatedGlow>
  );
}

const styles = StyleSheet.create({
  orb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
