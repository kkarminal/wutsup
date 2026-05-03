import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../hooks/useTheme';
import { FONT_SIZE, FONT_WEIGHT, SPACING } from '../constants/colors';

const HEADER_HEIGHT = 52;

interface AppHeaderProps {
  /**
   * When true, shows a back chevron on the left instead of the app name,
   * and hides the settings icon on the right.
   */
  showBack?: boolean;
  /** Title displayed in the centre when showBack is true. */
  title?: string;
}

export function AppHeader({ showBack = false, title }: AppHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: insets.top,
          backgroundColor: theme.surface,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={styles.inner}>
        {/* Left slot */}
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && { opacity: 0.6 },
            ]}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color={theme.primary}
            />
          </Pressable>
        ) : (
          <Image
            source={require('../assets/adaptive-icon.png')}
            style={styles.logoIcon}
            resizeMode="contain"
            accessibilityLabel="Wutsup"
          />
        )}

        {/* Centre title (only on back-navigation screens) */}
        {showBack && title !== undefined && (
          <Text
            style={[styles.pageTitle, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}

        {/* Right slot */}
        {showBack ? (
          // Invisible placeholder keeps the centre title truly centred
          <View style={styles.iconButton} />
        ) : (
          <Pressable
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && { opacity: 0.6 },
            ]}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
            hitSlop={8}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={theme.textSecondary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  inner: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  logoIcon: {
    width: 36,
    height: 36,
  },
  pageTitle: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: 'center',
    marginHorizontal: SPACING.xs,
  },
  iconButton: {
    padding: SPACING.xs,
    borderRadius: 8,
    width: 36,
    alignItems: 'center',
  },
});
