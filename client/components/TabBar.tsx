import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { BRAND, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants/colors';

export type TabId = 'food' | 'stuff';

interface TabBarProps {
  activeTab: TabId;
  onTabPress: (tab: TabId) => void;
  onFabPress: () => void;
}

export function TabBar({ activeTab, onTabPress, onFabPress }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* Food tab */}
      <Pressable
        style={styles.tab}
        onPress={() => onTabPress('food')}
        accessibilityRole="tab"
        accessibilityLabel="Find Food"
        accessibilityState={{ selected: activeTab === 'food' }}
      >
        <Ionicons
          name={activeTab === 'food' ? 'restaurant' : 'restaurant-outline'}
          size={24}
          color={activeTab === 'food' ? BRAND.blue : theme.textSecondary}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'food' ? BRAND.blue : theme.textSecondary },
          ]}
        >
          Food
        </Text>
      </Pressable>

      {/* FAB — centre */}
      <View style={styles.fabContainer}>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={onFabPress}
          accessibilityRole="button"
          accessibilityLabel="Quick actions"
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Up & About tab */}
      <Pressable
        style={styles.tab}
        onPress={() => onTabPress('stuff')}
        accessibilityRole="tab"
        accessibilityLabel="Up & About"
        accessibilityState={{ selected: activeTab === 'stuff' }}
      >
        <Ionicons
          name={activeTab === 'stuff' ? 'sparkles' : 'sparkles-outline'}
          size={24}
          color={activeTab === 'stuff' ? BRAND.blue : theme.textSecondary}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === 'stuff' ? BRAND.blue : theme.textSecondary },
          ]}
        >
          Up & About
        </Text>
      </Pressable>
    </View>
  );
}

const TAB_BAR_HEIGHT = 60;
const FAB_SIZE = 56;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TAB_BAR_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
    // Elevate so the FAB shadow renders correctly
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: SPACING.xs,
  },
  tabLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  fabContainer: {
    width: FAB_SIZE + SPACING.xl,
    alignItems: 'center',
    // Lift the FAB above the tab bar
    marginTop: -(FAB_SIZE / 2 + 4),
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: BRAND.blue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: BRAND.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});
