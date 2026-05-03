import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../hooks/useTheme';
import { useThemeContext, type ThemePreference } from '../contexts/ThemeContext';
import { AboutModal } from '../components/AboutModal';
import { AppHeader } from '../components/AppHeader';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../constants/colors';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'system', label: 'System default', icon: 'phone-portrait-outline' },
  { value: 'light',  label: 'Light',          icon: 'sunny-outline' },
  { value: 'dark',   label: 'Dark',           icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const { preference, setPreference } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [aboutVisible, setAboutVisible] = useState(false);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppHeader showBack title="Settings" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Appearance section ── */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          APPEARANCE
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {THEME_OPTIONS.map((option, index) => {
            const selected = preference === option.value;
            const isLast = index === THEME_OPTIONS.length - 1;

            return (
              <Pressable
                key={option.value}
                onPress={() => setPreference(option.value)}
                style={({ pressed }) => [
                  styles.row,
                  !isLast && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.border,
                  },
                  pressed && { backgroundColor: theme.backgroundSubtle },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={option.label}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={selected ? theme.primary : theme.textSecondary}
                  style={styles.rowIcon}
                />
                <Text
                  style={[
                    styles.rowLabel,
                    {
                      color: selected ? theme.primary : theme.textPrimary,
                      fontWeight: selected ? FONT_WEIGHT.semibold : FONT_WEIGHT.regular,
                    },
                  ]}
                >
                  {option.label}
                </Text>
                {selected && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={theme.primary}
                    style={styles.checkmark}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── About section ── */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          ABOUT
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Pressable
            onPress={() => setAboutVisible(true)}
            style={({ pressed }) => [
              styles.row,
              pressed && { backgroundColor: theme.backgroundSubtle },
            ]}
            accessibilityRole="button"
            accessibilityLabel="About Wutsup"
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.textSecondary}
              style={styles.rowIcon}
            />
            <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>
              About Wutsup
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.textDisabled}
              style={styles.checkmark}
            />
          </Pressable>
        </View>
      </ScrollView>

      <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
  },
  rowIcon: {
    marginRight: SPACING.md,
    width: 22,
  },
  rowLabel: {
    flex: 1,
    fontSize: FONT_SIZE.md,
  },
  checkmark: {
    marginLeft: SPACING.sm,
  },
});
