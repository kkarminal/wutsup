/**
 * PieMenu — interactive radial pie-chart navigation overlay.
 *
 * Icons are rendered as a React Native overlay layer (not inside SVG)
 * because ForeignObject is not supported on iOS in react-native-svg.
 *
 * Labels use SVG TextPath with the arc path starting at the segment midpoint
 * so startOffset="0" + textAnchor="middle" reliably centres text.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import AnimatedGlow, { type PresetConfig } from 'react-native-animated-glow';

import { NavigationNodeDto } from '@/services/navigationApi';
import {
  computeSegments,
  computeParentSegments,
  PIE_INNER_RADIUS,
  PIE_MAX_OUTER_RADIUS,
  PIE_COLLAPSE_DURATION,
} from '@/utils/pieLayout';
import { FONT_SIZE } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';

const SEGMENT_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#059669',
  '#D97706', '#DC2626', '#4F46E5', '#0891B2',
] as const;

function segmentColor(index: number): string {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}

const LABEL_FONT_SIZE = FONT_SIZE.sm;
const ICON_SIZE = 16;

// Neon color pairs for the outer ring glow — randomized on each render
const NEON_GLOW_COLORS: [string, string][] = [
  ['#00DDFF', '#0066FF'], // cyan → blue
  ['#FF00FF', '#AA00FF'], // magenta → purple
  ['#00FF88', '#00CC44'], // green → emerald
  ['#FF3366', '#FF0066'], // pink → hot pink
  ['#FFDD00', '#FF8800'], // yellow → orange
  ['#7B2FFF', '#4400FF'], // violet → indigo
  ['#00FFCC', '#00DDAA'], // teal → mint
  ['#FF6600', '#FF2200'], // orange → red
];

function randomNeonColors(): [string, string] {
  return NEON_GLOW_COLORS[Math.floor(Math.random() * NEON_GLOW_COLORS.length)];
}

function makePieGlowPreset(colors: [string, string]): PresetConfig {
  return {
    metadata: { name: 'Pie Glow', textColor: '#FFFFFF', category: 'Custom', tags: [] },
    states: [
      {
        name: 'default',
        preset: {
          cornerRadius: 999,
          outlineWidth: 0,
          borderColor: 'transparent',
          glowLayers: [
            { colors, opacity: 0.5, glowSize: 15 },
          ],
        },
      },
    ],
  };
}

const AnimatedView = Animated.createAnimatedComponent(View);

export interface PieMenuProps {
  visible: boolean;
  isClosing: boolean;
  activeNode: NavigationNodeDto | null;
  parentNode: NavigationNodeDto | null;
  fabCentreY: number;
  fabCentreX: number;
  onDrillInto: (node: NavigationNodeDto) => void;
  onNavigateBack: () => void;
  onClose: () => void;
  onCloseComplete: () => void;
}

export function PieMenu({
  visible,
  isClosing,
  activeNode,
  parentNode,
  fabCentreY,
  fabCentreX,
  onDrillInto,
  onNavigateBack,
  onClose,
  onCloseComplete,
}: PieMenuProps) {
  const theme = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const overlayOpacity = useSharedValue(0);
  const activeScale = useSharedValue(0);
  const activeOpacity = useSharedValue(0);
  const activeRotation = useSharedValue(-120);
  const parentOpacity = useSharedValue(0);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible && !isClosing) {
      setShouldRender(true);
      overlayOpacity.value = withTiming(1, { duration: 200 });
      if (reduceMotion) {
        activeScale.value = withTiming(1, { duration: 150 });
        activeOpacity.value = withTiming(1, { duration: 150 });
        activeRotation.value = withTiming(0, { duration: 150 });
      } else {
        activeScale.value = withSpring(1, { damping: 12, stiffness: 200, mass: 0.7 });
        activeOpacity.value = withTiming(1, { duration: 180 });
        activeRotation.value = withSpring(0, { damping: 15, stiffness: 200, mass: 0.6 });
      }
    }
  }, [visible, isClosing]);

  useEffect(() => {
    if (!isClosing) return;
    const dur = reduceMotion ? 150 : PIE_COLLAPSE_DURATION;
    overlayOpacity.value = withTiming(0, { duration: dur });
    activeScale.value = withTiming(0, { duration: dur, easing: Easing.in(Easing.quad) });
    activeOpacity.value = withTiming(0, { duration: dur });
    activeRotation.value = withTiming(60, { duration: dur, easing: Easing.in(Easing.quad) });
    parentOpacity.value = withTiming(0, { duration: dur });
    setTimeout(() => { setShouldRender(false); onCloseComplete(); }, dur + 50);
  }, [isClosing]);

  useEffect(() => {
    if (!visible) return;
    activeScale.value = 0;
    activeOpacity.value = 0;
    activeRotation.value = -120;
    if (reduceMotion) {
      activeScale.value = withTiming(1, { duration: 150 });
      activeOpacity.value = withTiming(1, { duration: 150 });
      activeRotation.value = withTiming(0, { duration: 150 });
    } else {
      activeScale.value = withSpring(1, { damping: 12, stiffness: 200, mass: 0.7 });
      activeOpacity.value = withTiming(1, { duration: 180 });
      activeRotation.value = withSpring(0, { damping: 15, stiffness: 200, mass: 0.6 });
    }
  }, [activeNode?.id]);

  useEffect(() => {
    if (!visible) return;
    parentOpacity.value = withTiming(parentNode ? 1 : 0, { duration: 250 });
  }, [parentNode?.id, visible]);

  const overlayAnimStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const activeRingAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: activeScale.value }, { rotate: `${activeRotation.value}deg` }],
    opacity: activeOpacity.value,
  }));
  const parentRingAnimStyle = useAnimatedStyle(() => ({ opacity: parentOpacity.value }));

  // Pick a random neon color for the outer glow — changes on each drill level
  const glowPreset = useMemo(() => makePieGlowPreset(randomNeonColors()), [activeNode?.id]);
  const glowBorderColor = useMemo(() => randomNeonColors()[0], [activeNode?.id]);

  if (!shouldRender || !activeNode) return null;

  const children = activeNode.children;
  const parentChildren = parentNode?.children ?? [];
  const outerR = PIE_MAX_OUTER_RADIUS;
  const svgSize = (outerR + 32) * 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  const activeSegments = computeSegments(children.length, cx, cy, PIE_INNER_RADIUS, outerR);
  const parentSegments = computeParentSegments(parentChildren.length, cx, cy);

  const pinchGesture = Gesture.Pinch().onEnd((e) => {
    'worklet';
    if (e.scale > 1.2) runOnJS(onNavigateBack)();
  });

  // Swipe left to go back to parent menu
  const panGesture = Gesture.Pan()
    .minDistance(40)
    .onEnd((e) => {
      'worklet';
      if (e.translationX < -60) {
        runOnJS(onNavigateBack)();
      }
    });

  const composedGesture = Gesture.Race(panGesture, pinchGesture);

  const svgLeft = fabCentreX - svgSize / 2;
  const svgTop = fabCentreY - svgSize / 2;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <AnimatedView
        style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.overlay }, overlayAnimStyle]}
        pointerEvents="box-none"
      >
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          accessibilityLabel="Close navigation menu"
          accessibilityRole="button"
        />
      </AnimatedView>

      <GestureDetector gesture={composedGesture}>
        <View style={[styles.svgContainer, { left: svgLeft, top: svgTop, width: svgSize, height: svgSize }]}>

          {/* Parent ring */}
          {parentChildren.length > 0 && (
            <AnimatedView style={[StyleSheet.absoluteFillObject, parentRingAnimStyle]}>
              <Svg width={svgSize} height={svgSize}>
                <G opacity={0.75}>
                  {parentSegments.map((seg, i) => {
                    const node = parentChildren[i];
                    if (!node) return null;
                    return (
                      <Path key={`pseg-${node.id}`} d={seg.segmentPath} fill={segmentColor(i)} opacity={0.55} onPress={onNavigateBack} accessibilityLabel={`Back to ${node.label}`} />
                    );
                  })}
                </G>
              </Svg>
              {/* Parent ring labels */}
              {parentSegments.map((seg, i) => {
                const node = parentChildren[i];
                if (!node) return null;
                return (
                  <View
                    key={`plabel-${node.id}`}
                    pointerEvents="none"
                    style={[
                      styles.parentLabelWrapper,
                      {
                        left: seg.labelX,
                        top: seg.labelY,
                        transform: [{ rotate: `${seg.labelRotation}deg` }],
                      },
                    ]}
                  >
                    <Text style={styles.parentLabelText}>{node.label}</Text>
                  </View>
                );
              })}
            </AnimatedView>
          )}

          {/* Active ring — SVG segments + glow borders */}
          <AnimatedView style={[StyleSheet.absoluteFillObject, activeRingAnimStyle]}>
            {/* Interactive segments */}
            <Svg width={svgSize} height={svgSize}>
              {/* Segments */}
              {activeSegments.map((seg, i) => {
                const node = children[i];
                if (!node) return null;
                return (
                  <Path key={`seg-${node.id}`} d={seg.segmentPath} fill={segmentColor(i)} onPress={() => onDrillInto(node)} accessibilityLabel={node.label} />
                );
              })}

              {/* Centre tap target */}
              <Path
                d={`M ${cx} ${cy - PIE_INNER_RADIUS + 1} A ${PIE_INNER_RADIUS - 1} ${PIE_INNER_RADIUS - 1} 0 1 1 ${cx - 0.01} ${cy - PIE_INNER_RADIUS + 1} Z`}
                fill="transparent"
                onPress={parentNode ? onNavigateBack : onClose}
                accessibilityLabel={parentNode ? 'Go back' : 'Close navigation menu'}
              />
            </Svg>

            {/* Ring borders — non-interactive overlay */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <Svg width={svgSize} height={svgSize}>
                <Circle cx={cx} cy={cy} r={PIE_INNER_RADIUS} fill="none" stroke="#00DDFF" strokeWidth={1.5} opacity={0.8} />
              </Svg>
            </View>

            {/* Outer ring glow — AnimatedGlow on a circular View */}
            <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
              <AnimatedGlow preset={glowPreset}>
                <View style={{ width: outerR * 2, height: outerR * 2, borderRadius: outerR, borderWidth: 1.5, borderColor: glowBorderColor }} />
              </AnimatedGlow>
            </View>

            {/* Labels — React Native overlay for all segments */}
            {activeSegments.map((seg, i) => {
              const node = children[i];
              if (!node) return null;
              return (
                <View
                  key={`label-${node.id}`}
                  pointerEvents="none"
                  style={[
                    styles.labelWrapper,
                    {
                      left: seg.labelX,
                      top: seg.labelY,
                      transform: [{ rotate: `${seg.labelRotation}deg` }],
                    },
                  ]}
                >
                  <Text style={styles.labelText}>{node.label}</Text>
                </View>
              );
            })}

            {/* Icons — React Native overlay, not SVG (ForeignObject unsupported on iOS) */}
            {activeSegments.map((seg, i) => {
              const node = children[i];
              if (!node?.icon) return null;
              return (
                <View
                  key={`icon-${node.id}`}
                  pointerEvents="none"
                  style={[
                    styles.iconWrapper,
                    {
                      left: seg.iconX - ICON_SIZE / 2,
                      top: seg.iconY - ICON_SIZE / 2,
                      transform: [{ rotate: `${seg.iconRotation}deg` }],
                    },
                  ]}
                >
                  <Ionicons name={node.icon as any} size={ICON_SIZE} color="#FFFFFF" />
                </View>
              );
            })}
          </AnimatedView>

        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  svgContainer: {
    position: 'absolute',
  },
  iconWrapper: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    marginLeft: -60,
    marginTop: -8,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: LABEL_FONT_SIZE,
    fontWeight: '600',
    textAlign: 'center',
  },
  parentLabelWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    marginLeft: -40,
    marginTop: -5,
  },
  parentLabelText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '600',
    textAlign: 'center',
  },
});
