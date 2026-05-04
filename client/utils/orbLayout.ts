// Pure polar-to-Cartesian math utility for the Drill Orb Navigation feature.
// No React or native imports — plain TypeScript only.

export const RING_RADIUS = 120; // points from centre to node centre
export const DRAG_BACK_THRESHOLD = 40; // points
export const DRILL_ANIMATION_DURATION = 350; // ms
export const BACK_ANIMATION_DURATION = 350; // ms
export const REDUCE_MOTION_DURATION = 150; // ms

export interface PolarPosition {
  angle: number; // degrees, 0 = top (12 o'clock), increases clockwise
  radius: number; // points
}

export interface CartesianPosition {
  x: number;
  y: number;
}

/**
 * Converts polar coordinates (angle in degrees, radius in points)
 * to Cartesian (x, y) offsets from the centre point.
 * Angle 0 = top (12 o'clock), increases clockwise.
 * Formula: x = radius * sin(angleRad), y = -radius * cos(angleRad)
 */
export function polarToCartesian(polar: PolarPosition): CartesianPosition {
  const angleRad = (polar.angle * Math.PI) / 180;
  return {
    x: polar.radius * Math.sin(angleRad),
    y: -polar.radius * Math.cos(angleRad),
  };
}

/**
 * Computes the angle in degrees for node at `index` in a ring of `total` nodes.
 * Angles are evenly distributed across 360 degrees starting from 0 (top).
 * Returns (360 / total) * index.
 */
export function computeNodeAngle(index: number, total: number): number {
  return (360 / total) * index;
}

/**
 * Computes the Cartesian positions for all nodes in a ring.
 * Returns one position per node, all at RING_RADIUS from centre.
 */
export function computeRingPositions(nodeCount: number): CartesianPosition[] {
  return Array.from({ length: nodeCount }, (_, i) => {
    const angle = computeNodeAngle(i, nodeCount);
    return polarToCartesian({ angle, radius: RING_RADIUS });
  });
}

/**
 * Returns true if a drag gesture of the given distance (in points)
 * meets the threshold to trigger back navigation.
 */
export function meetsBackDragThreshold(dragDistance: number): boolean {
  return dragDistance >= DRAG_BACK_THRESHOLD;
}

/**
 * Resolves the animation configuration based on the reduce-motion preference.
 * When reduceMotion is true, returns a short fade transition.
 * Otherwise returns the standard zoom transition.
 */
export function resolveAnimationConfig(
  reduceMotion: boolean
): { duration: number; type: 'zoom' | 'fade' } {
  if (reduceMotion) {
    return { duration: REDUCE_MOTION_DURATION, type: 'fade' };
  }
  return { duration: DRILL_ANIMATION_DURATION, type: 'zoom' };
}
