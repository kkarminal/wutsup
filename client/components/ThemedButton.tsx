import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../hooks/useTheme';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../constants/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ThemedButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ionicons icon name rendered to the left of the label */
  iconLeft?: React.ComponentProps<typeof Ionicons>['name'];
  /** Ionicons icon name rendered to the right of the label */
  iconRight?: React.ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  loading?: boolean;
  /** Stretch to fill the parent container width */
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

/**
 * ThemedButton — the standard button for all Wutsup client screens.
 *
 * Always use this component instead of a raw Pressable + Text pair.
 * It automatically picks up the active theme (light / dark) and enforces
 * consistent sizing, spacing, and border-radius across the app.
 *
 * Variants:
 *   primary   — filled, brand blue background (default)
 *   secondary — outlined, transparent background with a border
 *   ghost     — no border or background, text-only
 *   danger    — filled, error-red background for destructive actions
 *
 * Sizes:
 *   sm  — compact (padding 6×12, font 13)
 *   md  — default (padding 10×16, font 15)
 *   lg  — prominent (padding 14×20, font 17)
 */
export function ThemedButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
}: ThemedButtonProps) {
  const theme = useTheme();

  const isDisabled = disabled || loading;

  // ── Resolve colors per variant ──────────────────────────────────────────
  const bg = (() => {
    if (isDisabled) return theme.surfaceRaised;
    switch (variant) {
      case 'primary':   return theme.primary;
      case 'secondary': return 'transparent';
      case 'ghost':     return 'transparent';
      case 'danger':    return theme.error;
    }
  })();

  const bgPressed = (() => {
    if (isDisabled) return theme.surfaceRaised;
    switch (variant) {
      case 'primary':   return theme.primaryPressed;
      case 'secondary': return theme.primarySubtle;
      case 'ghost':     return theme.primarySubtle;
      case 'danger':    return theme.errorSubtle;
    }
  })();

  const textColor = (() => {
    if (isDisabled) return theme.textDisabled;
    switch (variant) {
      case 'primary':   return theme.textInverse;
      case 'secondary': return theme.primary;
      case 'ghost':     return theme.primary;
      case 'danger':    return theme.textInverse;
    }
  })();

  const borderColor = (() => {
    switch (variant) {
      case 'secondary': return isDisabled ? theme.border : theme.primary;
      default:          return 'transparent';
    }
  })();

  // ── Resolve sizing per size ──────────────────────────────────────────────
  const { paddingV, paddingH, fontSize, iconSize } = SIZE_MAP[size];

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed && !isDisabled ? bgPressed : bg,
          borderColor,
          borderWidth: variant === 'secondary' ? 1.5 : 0,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.55 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColor}
          accessibilityLabel="Loading"
        />
      ) : (
        <View style={styles.inner}>
          {iconLeft !== undefined && (
            <Ionicons
              name={iconLeft}
              size={iconSize}
              color={textColor}
              style={styles.iconLeft}
            />
          )}

          <Text style={[styles.label, { color: textColor, fontSize }]}>
            {label}
          </Text>

          {iconRight !== undefined && (
            <Ionicons
              name={iconRight}
              size={iconSize}
              color={textColor}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}

// ── Size map ────────────────────────────────────────────────────────────────
const SIZE_MAP: Record<
  ButtonSize,
  { paddingV: number; paddingH: number; fontSize: number; iconSize: number }
> = {
  sm: { paddingV: 6,  paddingH: 12, fontSize: FONT_SIZE.sm, iconSize: 14 },
  md: { paddingV: 10, paddingH: 16, fontSize: FONT_SIZE.md, iconSize: 16 },
  lg: { paddingV: 14, paddingH: 20, fontSize: FONT_SIZE.lg, iconSize: 18 },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.sm,   // slightly rounded — 4 px
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 64,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: SPACING.xs,
  },
  iconRight: {
    marginLeft: SPACING.xs,
  },
});
