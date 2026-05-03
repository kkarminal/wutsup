import { useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

import { TabBar, TabId } from '@/components/TabBar';
import { QuickActionDrawer } from '@/components/QuickActionDrawer';
import { FindFoodScreen } from '@/screens/FindFoodScreen';
import { FindStuffScreen } from '@/screens/FindStuffScreen';
import { AppHeader } from '@/components/AppHeader';
import { useTheme } from '@/hooks/useTheme';

export {
  FOOD_PANEL_LABEL,
  ACTIVITIES_PANEL_LABEL,
  FOOD_PANEL_ACCESSIBILITY_LABEL,
  ACTIVITIES_PANEL_ACCESSIBILITY_LABEL,
} from './DashboardScreen.constants';

// Tab order: food = index 0, stuff = index 1
const TAB_ORDER: TabId[] = ['food', 'stuff'];
const SLIDE_DURATION = 260;

export function DashboardScreen() {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const [activeTab, setActiveTab] = useState<TabId>('food');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // translateX drives the two-page strip.
  // food (index 0) → translateX = 0
  // stuff (index 1) → translateX = -screenWidth
  const translateX = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  const handleTabPress = (tab: TabId) => {
    if (tab === activeTab || isAnimating.current) return;

    const toIndex = TAB_ORDER.indexOf(tab);
    const targetX = -toIndex * screenWidth;

    isAnimating.current = true;
    setActiveTab(tab);

    Animated.timing(translateX, {
      toValue: targetX,
      duration: SLIDE_DURATION,
      useNativeDriver: true,
    }).start(() => {
      isAnimating.current = false;
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader />

      {/* Clipping container — only one screen width visible at a time */}
      <View style={styles.viewport}>
        <Animated.View
          style={[
            styles.strip,
            { width: screenWidth * TAB_ORDER.length, transform: [{ translateX }] },
          ]}
        >
          {/* Page 0 — Food */}
          <View style={[styles.page, { width: screenWidth }]}>
            <FindFoodScreen />
          </View>

          {/* Page 1 — Stuff */}
          <View style={[styles.page, { width: screenWidth }]}>
            <FindStuffScreen />
          </View>
        </Animated.View>
      </View>

      {/* Tab bar with FAB */}
      <TabBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onFabPress={() => setDrawerOpen(true)}
      />

      {/* Quick action drawer */}
      <QuickActionDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  viewport: {
    flex: 1,
    overflow: 'hidden',
  },
  strip: {
    flex: 1,
    flexDirection: 'row',
  },
  page: {
    flex: 1,
  },
});
