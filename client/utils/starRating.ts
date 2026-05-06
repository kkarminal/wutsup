/**
 * Star rating breakdown utility.
 *
 * Calculates the number of filled, half, and empty stars for a given rating.
 */

export interface StarBreakdown {
  filled: number;
  half: number;
  empty: number;
}

/**
 * Calculates the breakdown of filled, half, and empty stars for a given rating.
 *
 * Rules:
 * - Whole number portion → filled stars
 * - Remainder 0.25–0.74 → 1 half star
 * - Remainder >= 0.75 → rounds up to an additional filled star
 * - Remainder < 0.25 → empty star (no half)
 * - Rating is clamped to 0–5
 */
export function getStarBreakdown(rating: number): StarBreakdown {
  const clamped = Math.max(0, Math.min(5, rating));
  const wholeStars = Math.floor(clamped);
  const remainder = clamped - wholeStars;

  let filled = wholeStars;
  let half = 0;

  if (remainder >= 0.75) {
    filled += 1;
  } else if (remainder >= 0.25) {
    half = 1;
  }

  const empty = 5 - filled - half;

  return { filled, half, empty };
}
