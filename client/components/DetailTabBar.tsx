import React from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { FONT_SIZE, FONT_WEIGHT, SPACING } from '@/constants/colors';

interface DetailTabBarProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

/**
 * A horizontal tab bar for the expanded card detail view.
 * Renders tab labels with an animated active indicator that slides
 * to the selected tab position.
 */
export function DetailTabBar({ tabs, activeTab, onTabChange }: DetailTabBarProps) {
  const theme = useTheme();
  const indicatorLeft = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const tabLayouts = React.useRef<Record<string, { x: number; width: number }>>({});

  const handleTabLayout = (tab: string) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    tabLayouts.current[tab] = { x, width };

    if (tab === activeTab) {
      indicatorLeft.value = x;
      indicatorWidth.value = width;
    }
  };

  React.useEffect(() => {
    const layout = tabLayouts.current[activeTab];
    if (layout) {
      indicatorLeft.value = withTiming(layout.x, { duration: 200 });
      indicatorWidth.value = withTiming(layout.width, { duration: 200 });
    }
  }, [activeTab, indicatorLeft, indicatorWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorLeft.value,
    width: indicatorWidth.value,
  }));

  return (
    <View style={[styles.container, { borderBottomColor: theme.border }]}>
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <Pressable
            key={tab}
            style={styles.tab}
            onPress={() => onTabChange(tab)}
            onLayout={handleTabLayout(tab)}
            accessibilityRole="tab"
            accessibilityLabel={tab}
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? theme.primary : theme.textSecondary },
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        );
      })}
      <Animated.View
        style={[styles.indicator, { backgroundColor: theme.primary }, indicatorStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  tabLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
  },
});
