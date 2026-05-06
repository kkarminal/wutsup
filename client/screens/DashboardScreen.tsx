import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimatedBackground } from '@/components/AnimatedBackground';
import { AppHeader } from '@/components/AppHeader';
import { DrillOrb } from '@/components/DrillOrb';
import { PieMenu } from '@/components/PieMenu';
import { ResultsFeed } from '@/components/ResultsFeed';
import { ResultsCarousel } from '@/components/ResultsCarousel';
import { ViewToggle } from '@/components/ViewToggle';
import { useOrbController, resolveApiBaseUrl } from '@/hooks/useOrbController';
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
  const [viewMode, setViewMode] = useState<'list' | 'carousel'>('list');

  const {
    orbState,
    activeNode,
    parentNode,
    selectedLeaf,
    breadcrumb,
    breadcrumbIds,
    openMenu,
    closeMenu,
    finalizeClose,
    drillInto,
    navigateBack,
    navigateTo,
    retryFetch,
  } = useOrbController();

  const menuVisible = orbState === 'open' || orbState === 'animating' || orbState === 'closing';

  const feedVisible = orbState === 'open' || orbState === 'animating';
  // Show results for the selected leaf if one is picked, otherwise the active node
  const feedNode = selectedLeaf ?? activeNode;
  const activeNodeId = feedVisible ? (feedNode?.id ?? null) : null;

  // Resolve relative background image URLs against the API base URL.
  // Fall back to parent's background if the active node doesn't have one,
  // then to the default root background.
  const DEFAULT_BACKGROUND_PATH = '/images/neon_main_background.jpg';

  const backgroundImageUrl = (() => {
    const raw = selectedLeaf?.backgroundImageUrl ?? activeNode?.backgroundImageUrl ?? parentNode?.backgroundImageUrl ?? DEFAULT_BACKGROUND_PATH;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `${resolveApiBaseUrl()}${raw}`;
  })();

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
      <AnimatedBackground imageUrl={backgroundImageUrl} />
      
      {/* Top half — header + FAB area */}
      <View style={styles.topHalf}>
        <AppHeader />

        {/* Breadcrumbs — fixed-height slot so the FAB doesn't shift */}
        <View style={styles.breadcrumbSlot} pointerEvents="box-none">
          {menuVisible && breadcrumb.length > 0 && (
            <View style={styles.breadcrumbRow} pointerEvents="box-none">
              {breadcrumb.map((label, i) => {
                const isLast = i === breadcrumb.length - 1;
                const isTappable = !isLast || selectedLeaf != null;
                return (
                  <View key={breadcrumbIds[i]} style={styles.breadcrumbItem}>
                    {i > 0 && <Text style={styles.breadcrumbSeparator}>›</Text>}
                    <Pressable
                      onPress={() => isTappable && navigateTo(breadcrumbIds[i])}
                      disabled={!isTappable}
                    >
                      <Text style={[
                        styles.breadcrumbText,
                        (isLast && !selectedLeaf) && styles.breadcrumbTextActive,
                      ]}>
                        {label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
              {/* Show selected leaf in breadcrumb */}
              {selectedLeaf && (
                <View style={styles.breadcrumbItem}>
                  <Text style={styles.breadcrumbSeparator}>›</Text>
                  <Text style={[styles.breadcrumbText, styles.breadcrumbTextActive]}>
                    {selectedLeaf.label}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Logo — top right corner */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/splash-icon.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Wutsup"
          />
        </View>

        {/* FAB with helper text — centered between header and results */}
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
      </View>

      {/* Pie menu overlay */}
      {fabPos !== null && (
        <PieMenu
          visible={menuVisible}
          isClosing={orbState === 'closing'}
          activeNode={activeNode}
          parentNode={parentNode}
          selectedLeafId={selectedLeaf?.id ?? null}
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
          <View style={styles.viewToggleRow}>
            <ViewToggle mode={viewMode} onModeChange={setViewMode} />
          </View>
          {viewMode === 'list' ? (
            <ResultsFeed activeNodeId={activeNodeId} visible={feedVisible} />
          ) : (
            <ResultsCarousel activeNodeId={activeNodeId} visible={feedVisible} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHalf: {
    height: '45%',
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
    justifyContent: 'center',
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
  breadcrumbSlot: {
    height: 28,
    justifyContent: 'center',
    paddingLeft: 20,
    paddingRight: SPACING.md,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbSeparator: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: FONT_SIZE.md,
    marginHorizontal: 4,
  },
  breadcrumbText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  breadcrumbTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  feedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
  },
  viewToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
});
