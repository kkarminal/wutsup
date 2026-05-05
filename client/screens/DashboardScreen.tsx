import { useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { DrillOrb } from '@/components/DrillOrb';
import { PieMenu } from '@/components/PieMenu';
import { ResultsFeed } from '@/components/ResultsFeed';
import { useOrbController } from '@/hooks/useOrbController';
import { useTheme } from '@/hooks/useTheme';
import { FONT_SIZE, SPACING } from '@/constants/colors';

export {
  FOOD_PANEL_LABEL,
  ACTIVITIES_PANEL_LABEL,
  FOOD_PANEL_ACCESSIBILITY_LABEL,
  ACTIVITIES_PANEL_ACCESSIBILITY_LABEL,
} from './DashboardScreen.constants';

/**
 * DashboardScreen — single-page landing screen with the Drill Orb navigation.
 */
export function DashboardScreen() {
  const theme = useTheme();
  const fabRef = useRef<View>(null);
  const rootRef = useRef<View>(null);
  const [fabPos, setFabPos] = useState<{ x: number; y: number } | null>(null);

  const {
    orbState,
    activeNode,
    parentNode,
    openMenu,
    closeMenu,
    finalizeClose,
    drillInto,
    navigateBack,
    retryFetch,
  } = useOrbController();

  const menuVisible = orbState === 'open' || orbState === 'animating' || orbState === 'closing';

  const feedVisible = orbState === 'open' || orbState === 'animating';
  const activeNodeId = feedVisible ? (activeNode?.id ?? null) : null;

  const handleOrbPress = () => {
    if (orbState === 'ready') {
      rootRef.current?.measureInWindow((_rx, rootY) => {
        fabRef.current?.measureInWindow((fx, fy, fw, fh) => {
          setFabPos({ x: fx + fw / 2, y: fy + fh / 2 - rootY });
          openMenu();
        });
      });
    } else if (orbState === 'open') {
      closeMenu();
    } else if (orbState === 'error') {
      retryFetch();
    }
  };

  return (
    <View ref={rootRef} style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader />

      {/* Logo — top right corner */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Wutsup"
        />
      </View>

      {/* FAB with helper text — positioned below logo with enough clearance for the pie */}
      <View style={styles.fabArea}>
        <Text style={[styles.helperText, { color: theme.textSecondary, opacity: menuVisible ? 0 : 1 }]}>
          Tap to see wut's up
        </Text>
        <View ref={fabRef}>
          <DrillOrb orbState={orbState} onPress={handleOrbPress} />
        </View>
        <Text style={[styles.helperSubtext, { color: theme.textDisabled, opacity: menuVisible ? 0 : 1 }]}>
          Explore events, food, bars & more
        </Text>
      </View>

      {/* Pie menu overlay */}
      {fabPos !== null && (
        <PieMenu
          visible={menuVisible}
          isClosing={orbState === 'closing'}
          activeNode={activeNode}
          parentNode={parentNode}
          fabCentreX={fabPos.x}
          fabCentreY={fabPos.y}
          onDrillInto={drillInto}
          onNavigateBack={navigateBack}
          onClose={closeMenu}
          onCloseComplete={finalizeClose}
        />
      )}

      {/* Results feed — bottom half of screen, visible when Orb Menu is open */}
      {feedVisible && (
        <View style={styles.feedContainer}>
          <ResultsFeed activeNodeId={activeNodeId} visible={feedVisible} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'flex-end',
    paddingTop: SPACING.sm,
    paddingRight: SPACING.md,
  },
  logo: {
    width: 48,
    height: 48,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabArea: {
    flex: 1,
    alignItems: 'center',
    // Position FAB high enough that the pie (radius 160pt) doesn't overlap the logo
    // Logo is ~120pt + padding 24pt = 144pt from top of content area.
    // FAB centre needs to be at least 160pt below that.
    paddingTop: 40,
  },
  helperText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  helperSubtext: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.sm,
  },
  feedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
});
