// Pure gesture navigation utility — no React or native imports.
// Safe to import in a plain Jest (Node) environment.

export const SWIPE_THRESHOLD = 50; // points
export const ANIMATION_DURATION_NORMAL = 350; // ms (≤ 400 ms, satisfies Req 2.2, 3.2, 5.3)
export const ANIMATION_DURATION_REDUCED = 150; // ms (≤ 200 ms, satisfies Req 5.4)

export type SwipeDirection = 'food' | 'stuff' | 'none';

export interface SwipeGesture {
  /** Horizontal translation in points. Negative = left, positive = right. */
  dx: number;
}

export interface AnimationConfig {
  /** Duration in milliseconds. */
  duration: number;
  type: 'slide' | 'fade';
}

/**
 * Resolves a swipe gesture to a navigation target.
 *
 * Rules:
 *   - If isAnimating is true  → always 'none'  (Req 5.2)
 *   - If dx < -SWIPE_THRESHOLD → 'food'         (Req 2.1, 2.4)
 *   - If dx >  SWIPE_THRESHOLD → 'stuff'        (Req 3.1, 3.4)
 *   - Otherwise               → 'none'
 */
export function resolveSwipeNavigation(
  gesture: SwipeGesture,
  isAnimating: boolean,
): SwipeDirection {
  if (isAnimating) {
    return 'none';
  }
  if (gesture.dx < -SWIPE_THRESHOLD) {
    return 'food';
  }
  if (gesture.dx > SWIPE_THRESHOLD) {
    return 'stuff';
  }
  return 'none';
}

/**
 * Returns the animation config for a navigation event.
 * Respects the OS Reduce Motion accessibility setting (Req 5.4).
 */
export function resolveAnimationConfig(reduceMotion: boolean): AnimationConfig {
  if (reduceMotion) {
    return { duration: ANIMATION_DURATION_REDUCED, type: 'fade' };
  }
  return { duration: ANIMATION_DURATION_NORMAL, type: 'slide' };
}

/**
 * Pure helper: computes the height of a single panel given the full screen height.
 * Each panel occupies exactly half the screen (Req 1.1 — Property 1 invariant).
 */
export function computePanelHeight(screenHeight: number): number {
  return screenHeight / 2;
}
