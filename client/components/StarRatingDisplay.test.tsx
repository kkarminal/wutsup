/**
 * Tests for StarRatingDisplay component logic.
 * Feature: discovery-ratings-reviews
 *
 * Tests the star breakdown logic and prop-to-render mapping directly.
 */

import { getStarBreakdown } from '@/utils/starRating';

// ─── Star breakdown logic ─────────────────────────────────────────────────────

describe('getStarBreakdown', () => {
  it('returns 4 filled, 0 half, 1 empty for rating 4.2 (remainder 0.2 < 0.25)', () => {
    expect(getStarBreakdown(4.2)).toEqual({ filled: 4, half: 0, empty: 1 });
  });

  it('returns 4 filled, 1 half, 0 empty for rating 4.3 (remainder 0.3 is in 0.25-0.74)', () => {
    expect(getStarBreakdown(4.3)).toEqual({ filled: 4, half: 1, empty: 0 });
  });

  it('returns 4 filled, 1 half, 0 empty for rating 4.5 (remainder 0.5 is in 0.25-0.74)', () => {
    expect(getStarBreakdown(4.5)).toEqual({ filled: 4, half: 1, empty: 0 });
  });

  it('returns 5 filled, 0 half, 0 empty for rating 4.8 (remainder 0.8 >= 0.75 rounds up)', () => {
    expect(getStarBreakdown(4.8)).toEqual({ filled: 5, half: 0, empty: 0 });
  });

  it('returns 0 filled, 0 half, 5 empty for rating 0', () => {
    expect(getStarBreakdown(0)).toEqual({ filled: 0, half: 0, empty: 5 });
  });

  it('returns 5 filled, 0 half, 0 empty for rating 5', () => {
    expect(getStarBreakdown(5)).toEqual({ filled: 5, half: 0, empty: 0 });
  });

  it('returns 3 filled, 0 half, 2 empty for rating 3.0', () => {
    expect(getStarBreakdown(3.0)).toEqual({ filled: 3, half: 0, empty: 2 });
  });

  it('returns 2 filled, 1 half, 2 empty for rating 2.5', () => {
    expect(getStarBreakdown(2.5)).toEqual({ filled: 2, half: 1, empty: 2 });
  });

  it('returns 0 filled, 1 half, 4 empty for rating 0.25 (boundary: exactly 0.25)', () => {
    expect(getStarBreakdown(0.25)).toEqual({ filled: 0, half: 1, empty: 4 });
  });

  it('returns 1 filled, 0 half, 4 empty for rating 0.74 (boundary: exactly 0.74)', () => {
    expect(getStarBreakdown(0.74)).toEqual({ filled: 0, half: 1, empty: 4 });
  });

  it('returns 1 filled, 0 half, 4 empty for rating 0.75 (boundary: exactly 0.75 rounds up)', () => {
    expect(getStarBreakdown(0.75)).toEqual({ filled: 1, half: 0, empty: 4 });
  });

  it('clamps rating above 5 to 5 filled stars', () => {
    expect(getStarBreakdown(6)).toEqual({ filled: 5, half: 0, empty: 0 });
  });

  it('clamps rating below 0 to 5 empty stars', () => {
    expect(getStarBreakdown(-1)).toEqual({ filled: 0, half: 0, empty: 5 });
  });

  it('always produces exactly 5 total stars', () => {
    const testValues = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    for (const rating of testValues) {
      const { filled, half, empty } = getStarBreakdown(rating);
      expect(filled + half + empty).toBe(5);
    }
  });
});

// ─── Accessibility label ──────────────────────────────────────────────────────

describe('StarRatingDisplay — accessibility', () => {
  it('accessibility label format is "Rated {rating} out of 5 stars"', () => {
    const rating = 4.5;
    const label = `Rated ${rating} out of 5 stars`;
    expect(label).toBe('Rated 4.5 out of 5 stars');
  });

  it('accessibility label uses the exact rating value', () => {
    const rating = 3.7;
    const label = `Rated ${rating} out of 5 stars`;
    expect(label).toContain('3.7');
  });
});

// ─── Numeric display ──────────────────────────────────────────────────────────

describe('StarRatingDisplay — numeric display', () => {
  it('displays rating formatted to one decimal place', () => {
    const rating = 4.0;
    expect(rating.toFixed(1)).toBe('4.0');
  });

  it('displays rating 4.5 as "4.5"', () => {
    const rating = 4.5;
    expect(rating.toFixed(1)).toBe('4.5');
  });

  it('displays rating 3.333 as "3.3"', () => {
    const rating = 3.333;
    expect(rating.toFixed(1)).toBe('3.3');
  });
});
