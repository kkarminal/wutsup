import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { SPACING, RADIUS } from '@/constants/colors';

export interface ViewToggleProps {
  mode: 'list' | 'carousel';
  onModeChange: (mode: 'list' | 'carousel') => void;
}

const ICON_SIZE = 22;

/**
 * ViewToggle — switches between list and carousel view modes.
 *
 * Renders two pressable icon buttons side by side. The active mode
 * is highlighted with the primary color; the inactive mode uses a muted color.
 * The component is controlled — mode and persistence are managed by the parent.
 */
export function ViewToggle({ mode, onModeChange }: ViewToggleProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceRaised }]}>
      <Pressable
        onPress={() => onModeChange('list')}
        style={[
          styles.button,
          mode === 'list' && { backgroundColor: theme.primarySubtle },
        ]}
        accessibilityLabel="Switch to list view"
        accessibilityRole="button"
      >
        <Ionicons
          name="list-outline"
          size={ICON_SIZE}
          color={mode === 'list' ? theme.primary : theme.textDisabled}
        />
      </Pressable>
      <Pressable
        onPress={() => onModeChange('carousel')}
        style={[
          styles.button,
          mode === 'carousel' && { backgroundColor: theme.primarySubtle },
        ]}
        accessibilityLabel="Switch to carousel view"
        accessibilityRole="button"
      >
        <Ionicons
          name="grid-outline"
          size={ICON_SIZE}
          color={mode === 'carousel' ? theme.primary : theme.textDisabled}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  button: {
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
