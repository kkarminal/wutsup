import {
  resolveSwipeNavigation,
  resolveAnimationConfig,
} from '@/utils/gestureNavigation';

// ---------------------------------------------------------------------------
// resolveSwipeNavigation — boundary value tests
// ---------------------------------------------------------------------------

describe('resolveSwipeNavigation — boundary values', () => {
  it('returns "none" when dx = -50 (at threshold, not past it)', () => {
    expect(resolveSwipeNavigation({ dx: -50 }, false)).toBe('none');
  });

  it('returns "food" when dx = -51 (one point past left threshold)', () => {
    expect(resolveSwipeNavigation({ dx: -51 }, false)).toBe('food');
  });

  it('returns "none" when dx = 50 (at threshold, not past it)', () => {
    expect(resolveSwipeNavigation({ dx: 50 }, false)).toBe('none');
  });

  it('returns "stuff" when dx = 51 (one point past right threshold)', () => {
    expect(resolveSwipeNavigation({ dx: 51 }, false)).toBe('stuff');
  });
});

// ---------------------------------------------------------------------------
// resolveSwipeNavigation — animation guard
// ---------------------------------------------------------------------------

describe('resolveSwipeNavigation — isAnimating guard', () => {
  it('returns "none" when isAnimating = true and dx is a large left swipe', () => {
    expect(resolveSwipeNavigation({ dx: -200 }, true)).toBe('none');
  });

  it('returns "none" when isAnimating = true and dx is a large right swipe', () => {
    expect(resolveSwipeNavigation({ dx: 200 }, true)).toBe('none');
  });

  it('returns "none" when isAnimating = true and dx = 0', () => {
    expect(resolveSwipeNavigation({ dx: 0 }, true)).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// resolveAnimationConfig
// ---------------------------------------------------------------------------

describe('resolveAnimationConfig', () => {
  it('returns duration ≤ 200 and type "fade" when reduceMotion = true', () => {
    const config = resolveAnimationConfig(true);
    expect(config.duration).toBeLessThanOrEqual(200);
    expect(config.type).toBe('fade');
  });

  it('returns duration ≤ 400 and type "slide" when reduceMotion = false', () => {
    const config = resolveAnimationConfig(false);
    expect(config.duration).toBeLessThanOrEqual(400);
    expect(config.type).toBe('slide');
  });
});
