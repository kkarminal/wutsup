import * as fc from 'fast-check';

import {
  resolveSwipeNavigation,
  resolveAnimationConfig,
  computePanelHeight,
} from '@/utils/gestureNavigation';

// ---------------------------------------------------------------------------
// Property 1: Panel height invariant
// Feature: dashboard-swipe-navigation, Property 1: Panel height invariant
// Validates: Requirements 1.1
// ---------------------------------------------------------------------------

describe('Property 1: Panel height invariant', () => {
  it('panelHeight equals screenHeight / 2 and panelHeight * 2 equals screenHeight for any positive screen height', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 4000 }), (screenHeight) => {
        const panelHeight = computePanelHeight(screenHeight);
        return panelHeight === screenHeight / 2 && panelHeight * 2 === screenHeight;
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Directional gesture routing
// Feature: dashboard-swipe-navigation, Property 2: Directional gesture routing
// Validates: Requirements 2.1, 3.1
// ---------------------------------------------------------------------------

describe('Property 2: Directional gesture routing', () => {
  it('resolveSwipeNavigation returns "food" for any dx < -50 when not animating', () => {
    fc.assert(
      fc.property(fc.integer({ max: -51 }), (dx) => {
        return resolveSwipeNavigation({ dx }, false) === 'food';
      }),
      { numRuns: 100 },
    );
  });

  it('resolveSwipeNavigation returns "stuff" for any dx > 50 when not animating', () => {
    fc.assert(
      fc.property(fc.integer({ min: 51 }), (dx) => {
        return resolveSwipeNavigation({ dx }, false) === 'stuff';
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Sub-threshold gestures are ignored
// Feature: dashboard-swipe-navigation, Property 3: Sub-threshold gestures are ignored
// Validates: Requirements 2.4, 3.4
// ---------------------------------------------------------------------------

describe('Property 3: Sub-threshold gestures are ignored', () => {
  it('resolveSwipeNavigation returns "none" for any dx in [-50, 50] regardless of isAnimating', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -50, max: 50 }),
        fc.boolean(),
        (dx, isAnimating) => {
          return resolveSwipeNavigation({ dx }, isAnimating) === 'none';
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Animation guard prevents double-navigation
// Feature: dashboard-swipe-navigation, Property 4: Animation guard prevents double-navigation
// Validates: Requirements 5.2
// ---------------------------------------------------------------------------

describe('Property 4: Animation guard prevents double-navigation', () => {
  it('resolveSwipeNavigation always returns "none" when isAnimating = true, for any dx', () => {
    fc.assert(
      fc.property(fc.integer(), (dx) => {
        return resolveSwipeNavigation({ dx }, true) === 'none';
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Reduce Motion animation config
// Feature: dashboard-swipe-navigation, Property 5: Reduce Motion animation config
// Validates: Requirements 5.4, 2.2, 3.2, 5.3
// ---------------------------------------------------------------------------

describe('Property 5: Reduce Motion animation config', () => {
  it('resolveAnimationConfig returns correct duration and type for any reduceMotion value', () => {
    fc.assert(
      fc.property(fc.boolean(), (reduceMotion) => {
        const config = resolveAnimationConfig(reduceMotion);
        if (reduceMotion) {
          return config.duration <= 200 && config.type === 'fade';
        } else {
          return config.duration <= 400 && config.type === 'slide';
        }
      }),
      { numRuns: 100 },
    );
  });
});
