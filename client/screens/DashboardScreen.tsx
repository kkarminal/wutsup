import { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BRAND, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/constants/colors';
import { SWIPE_THRESHOLD } from '@/utils/gestureNavigation';

export {
  FOOD_PANEL_LABEL,
  ACTIVITIES_PANEL_LABEL,
  FOOD_PANEL_ACCESSIBILITY_LABEL,
  ACTIVITIES_PANEL_ACCESSIBILITY_LABEL,
} from './DashboardScreen.constants';

import {
  FOOD_PANEL_LABEL,
  ACTIVITIES_PANEL_LABEL,
  FOOD_PANEL_ACCESSIBILITY_LABEL,
  ACTIVITIES_PANEL_ACCESSIBILITY_LABEL,
} from './DashboardScreen.constants';

// Pages: 0 = Food, 1 = Landing, 2 = Stuff
const PAGE_COUNT = 3;
const LANDING_INDEX = 1;

const LANDING_LABEL = 'Wutsup?';
const LANDING_SUBTITLE = 'Swipe to explore';

export function DashboardScreen() {
  const screenWidth = Dimensions.get('window').width;

  // Current settled page index (0 = Food, 1 = Landing, 2 = Stuff)
  const [pageIndex, setPageIndex] = useState(LANDING_INDEX);
  const pageIndexRef = useRef(LANDING_INDEX);

  // translateX drives the carousel strip.
  // At page N, translateX = -N * screenWidth
  const translateX = useRef(
    new Animated.Value(-LANDING_INDEX * screenWidth),
  ).current;

  // Track drag delta so we can add it live to translateX
  const dragStart = useRef(0);
  const isAnimating = useRef(false);

  const snapToPage = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(PAGE_COUNT - 1, index));
    isAnimating.current = true;
    Animated.spring(translateX, {
      toValue: -clampedIndex * screenWidth,
      useNativeDriver: true,
      bounciness: 0,
      speed: 14,
    }).start(() => {
      isAnimating.current = false;
      pageIndexRef.current = clampedIndex;
      setPageIndex(clampedIndex);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 8,

      onPanResponderGrant: () => {
        // Record the current offset so we can add drag delta on top
        dragStart.current = -pageIndexRef.current * screenWidth;
        translateX.stopAnimation();
      },

      onPanResponderMove: (_evt, gs) => {
        // Follow the finger live, with resistance at the ends
        const raw = dragStart.current + gs.dx;
        const minX = -(PAGE_COUNT - 1) * screenWidth;
        const maxX = 0;
        let clamped = raw;
        if (raw > maxX) {
          clamped = maxX + (raw - maxX) * 0.2; // rubber-band left edge
        } else if (raw < minX) {
          clamped = minX + (raw - minX) * 0.2; // rubber-band right edge
        }
        translateX.setValue(clamped);
      },

      onPanResponderRelease: (_evt, gs) => {
        if (isAnimating.current) return;
        if (Math.abs(gs.dx) >= SWIPE_THRESHOLD) {
          // Swipe right (dx > 0) → go to previous page (lower index)
          // Swipe left  (dx < 0) → go to next page (higher index)
          const nextIndex =
            gs.dx < 0
              ? pageIndexRef.current + 1
              : pageIndexRef.current - 1;
          snapToPage(nextIndex);
        } else {
          // Not far enough — snap back to current page
          snapToPage(pageIndexRef.current);
        }
      },

      onPanResponderTerminate: () => {
        snapToPage(pageIndexRef.current);
      },
    }),
  ).current;

  return (
    <View style={styles.root}>
      {/* Carousel strip — 3 pages wide, slides horizontally */}
      <Animated.View
        style={[
          styles.strip,
          { width: screenWidth * PAGE_COUNT, transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Page 0 — Food */}
        <View
          style={[styles.page, { width: screenWidth }, styles.foodPage]}
          accessibilityLabel={FOOD_PANEL_ACCESSIBILITY_LABEL}
        >
          <Text style={styles.pageLabel}>{FOOD_PANEL_LABEL}</Text>
        </View>

        {/* Page 1 — Landing */}
        <View
          style={[styles.page, { width: screenWidth }, styles.landingPage]}
          accessibilityLabel="Dashboard — swipe left for food, swipe right for activities"
        >
          <Text style={styles.landingTitle}>{LANDING_LABEL}</Text>
          <Text style={styles.landingSubtitle}>{LANDING_SUBTITLE}</Text>
        </View>

        {/* Page 2 — Stuff */}
        <View
          style={[styles.page, { width: screenWidth }, styles.stuffPage]}
          accessibilityLabel={ACTIVITIES_PANEL_ACCESSIBILITY_LABEL}
        >
          <Text style={styles.pageLabel}>{ACTIVITIES_PANEL_LABEL}</Text>
        </View>
      </Animated.View>

      {/* Dots indicator */}
      <View style={styles.dots} pointerEvents="none">
        {Array.from({ length: PAGE_COUNT }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === pageIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  strip: {
    flex: 1,
    flexDirection: 'row',
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodPage: {
    backgroundColor: BRAND.blue,
  },
  landingPage: {
    backgroundColor: BRAND.black,
  },
  stuffPage: {
    backgroundColor: BRAND.green,
  },
  pageLabel: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  landingTitle: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  landingSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
