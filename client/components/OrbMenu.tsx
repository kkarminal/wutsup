import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, BackHandler, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, runOnJS } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { NavigationNodeDto } from '@/services/navigationApi';
import {
  computeRingPositions,
  DRAG_BACK_THRESHOLD,
  DRILL_ANIMATION_DURATION,
  REDUCE_MOTION_DURATION,
} from '@/utils/orbLayout';
import { LIGHT } from '@/constants/colors';
import { BreadcrumbTrail } from '@/components/BreadcrumbTrail';
import { CategoryNode } from '@/components/CategoryNode';

export interface OrbMenuProps {
  visible: boolean;
  activeNode: NavigationNodeDto | null;
  childNodes: NavigationNodeDto[];
  breadcrumb: string[];
  breadcrumbIds: number[];
  /** Y offset of the FAB centre from the top of the screen, measured by DashboardScreen */
  fabCentreY: number;
  onDrillInto: (node: NavigationNodeDto) => void;
  onNavigateBack: () => void;
  onNavigateTo: (nodeId: number) => void;
  onClose: () => void;
}

/**
 * OrbMenu — full-screen radial navigation overlay.
 *
 * Renders as a transparent Modal above all Dashboard content. Contains:
 * - BreadcrumbTrail at the top (safe-area aware)
 * - Central DrillOrb in `open` state (tap to close)
 * - CategoryNode ring positioned via computeRingPositions
 * - Pan + Pinch gesture detection for back navigation
 * - Drill/back animations via Reanimated (respects Reduce Motion)
 * - Android hardware back button support
 *
 * Requirements: 2.2, 2.3, 2.5, 2.6, 4.2, 5.1, 5.3, 5.5, 9.1, 9.2, 9.3, 9.4, 10.5
 */
export function OrbMenu({
  visible,
  activeNode,
  childNodes,
  breadcrumb,
  breadcrumbIds,
  fabCentreY,
  onDrillInto,
  onNavigateBack,
  onNavigateTo,
  onClose,
}: OrbMenuProps) {
  // Read the device's Reduce Motion accessibility setting.
  // AccessibilityInfo.isReduceMotionEnabled() is the correct API for both
  // iOS and Android in React Native (Reanimated v4 removed useReduceMotion).
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => sub.remove();
  }, []);

  // Shared animation values for the ring
  const scale = useSharedValue(1);
  const ringOpacity = useSharedValue(1);

  // Animated style for the ring container
  const ringAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Android hardware back button
  useEffect(() => {
    if (!visible) return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onNavigateBack();
        return true; // prevent default back behaviour
      },
    );

    return () => subscription.remove();
  }, [visible, onNavigateBack]);

  // Gesture: pan to navigate back
  const panGesture = Gesture.Pan().onEnd((event) => {
    if (
      Math.abs(event.translationX) >= DRAG_BACK_THRESHOLD ||
      Math.abs(event.translationY) >= DRAG_BACK_THRESHOLD
    ) {
      runOnJS(handleNavigateBack)();
    }
  });

  // Gesture: pinch to navigate back
  const pinchGesture = Gesture.Pinch().onEnd((event) => {
    if (event.scale > 1.2) {
      runOnJS(handleNavigateBack)();
    }
  });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // Drill animation: scale up and fade ring out
  function playDrillAnimation() {
    const duration = reduceMotion ? REDUCE_MOTION_DURATION : DRILL_ANIMATION_DURATION;
    if (reduceMotion) {
      // Reduce Motion: opacity-only transition
      ringOpacity.value = withTiming(0, { duration });
    } else {
      scale.value = withTiming(2, { duration });
      ringOpacity.value = withTiming(0, { duration });
    }
  }

  // Back animation: scale back to 1 and fade ring in
  function playBackAnimation() {
    const duration = reduceMotion ? REDUCE_MOTION_DURATION : DRILL_ANIMATION_DURATION;
    if (reduceMotion) {
      ringOpacity.value = withTiming(1, { duration });
    } else {
      scale.value = withTiming(1, { duration });
      ringOpacity.value = withTiming(1, { duration });
    }
  }

  // Handle drill-into: play animation then delegate
  function handleDrillInto(node: NavigationNodeDto) {
    playDrillAnimation();
    onDrillInto(node);
  }

  // Handle navigate back: play reverse animation then delegate
  function handleNavigateBack() {
    playBackAnimation();
    onNavigateBack();
  }

  // Compute ring positions for child nodes
  const ringPositions = computeRingPositions(childNodes.length);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onNavigateBack}
    >
      {/* Full-screen overlay */}
      <View style={styles.overlay}>
        {/* Gesture area covers the whole screen */}
        <GestureDetector gesture={composedGesture}>
          <View style={StyleSheet.absoluteFillObject}>
            {/*
             * Ring container positioned at the FAB's measured screen centre.
             * fabCentreY is measured by DashboardScreen so it matches exactly
             * where the background FAB sits, regardless of header height.
             * CategoryNode children use translateX/Y from this zero-size origin.
             */}
            <Animated.View
              style={[
                styles.ringContainer,
                { top: fabCentreY },
                ringAnimatedStyle,
              ]}
            >
              {childNodes.map((node, index) => (
                <CategoryNode
                  key={node.id}
                  node={node}
                  position={ringPositions[index]}
                  isLeaf={node.children.length === 0}
                  onPress={handleDrillInto}
                />
              ))}
            </Animated.View>
          </View>
        </GestureDetector>

        {/* Breadcrumb trail at the top, safe-area aware */}
        <SafeAreaView style={styles.breadcrumbContainer} pointerEvents="box-none">
          <BreadcrumbTrail
            breadcrumb={breadcrumb}
            nodeIds={breadcrumbIds}
            onNavigateTo={onNavigateTo}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: LIGHT.overlay,
  },
  ringContainer: {
    // Zero width, positioned absolutely at the FAB's horizontal centre.
    // `left: '50%'` centres horizontally; CategoryNode children offset via translateX/Y.
    position: 'absolute',
    left: '50%' as unknown as number,
    width: 0,
    height: 0,
  },
  breadcrumbContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
