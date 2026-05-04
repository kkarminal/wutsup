import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { DrillOrb } from '@/components/DrillOrb';
import { PieMenu } from '@/components/PieMenu';
import { useOrbController } from '@/hooks/useOrbController';
import { useTheme } from '@/hooks/useTheme';

export {
  FOOD_PANEL_LABEL,
  ACTIVITIES_PANEL_LABEL,
  FOOD_PANEL_ACCESSIBILITY_LABEL,
  ACTIVITIES_PANEL_ACCESSIBILITY_LABEL,
} from './DashboardScreen.constants';

/**
 * DashboardScreen — single-page landing screen with the Drill Orb navigation.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.5
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

  // Menu stays mounted during 'closing' so the exit animation can play
  const menuVisible = orbState === 'open' || orbState === 'animating' || orbState === 'closing';

  const handleOrbPress = () => {
    if (orbState === 'ready') {
      // Measure both the root view and the FAB in window coordinates.
      // Subtracting the root's origin gives us coordinates relative to the
      // overlay (which is a child of the root), fixing the Android status-bar offset.
      rootRef.current?.measureInWindow((_rx, rootY) => {
        fabRef.current?.measureInWindow((fx, fy, fw, fh) => {
          setFabPos({
            x: fx + fw / 2,
            y: fy + fh / 2 - rootY,
          });
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

      {/* FAB — always visible; icon changes between + and - */}
      <View style={styles.centre}>
        <View ref={fabRef}>
          <DrillOrb
            orbState={orbState}
            onPress={handleOrbPress}
          />
        </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
