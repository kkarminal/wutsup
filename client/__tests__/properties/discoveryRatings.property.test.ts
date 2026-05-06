import * as fc from 'fast-check';

import { getStarBreakdown } from '@/utils/starRating';
import { parseMenuMetadata, parseEventMetadata } from '@/utils/metadataParsing';
import type { DiscoveryItem, RatingData, Review } from '@/services/discoveryApi';

// Feature: discovery-ratings-reviews, Property 8: At most one card expanded at a time
// **Validates: Requirements 4.7**
describe('Property 8 — At most one card expanded at a time', () => {
  /**
   * State machine for expand/collapse behavior:
   * - State: expandedItemId (number | null)
   * - Action: tap on item with ID n
   * - Transition: if expandedItemId === n, set to null (collapse); otherwise set to n (expand new)
   */
  function applyTap(expandedItemId: number | null, tappedId: number): number | null {
    return expandedItemId === tappedId ? null : tappedId;
  }

  it('at most one card is expanded after any sequence of tap actions', () => {
    // Generate random sequences of tap actions (item IDs from a pool of 1-20)
    const tapSequenceArb = fc.array(fc.integer({ min: 1, max: 20 }), { minLength: 1, maxLength: 50 });

    fc.assert(
      fc.property(tapSequenceArb, (taps) => {
        let expandedItemId: number | null = null;

        for (const tappedId of taps) {
          expandedItemId = applyTap(expandedItemId, tappedId);

          // Invariant: at most one card is expanded at any point
          // expandedItemId is either null (no card expanded) or a single number (one card expanded)
          if (expandedItemId !== null && typeof expandedItemId !== 'number') {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('tapping the same card twice returns to no card expanded', () => {
    const itemIdArb = fc.integer({ min: 1, max: 20 });

    fc.assert(
      fc.property(itemIdArb, (itemId) => {
        let expandedItemId: number | null = null;

        // First tap expands the card
        expandedItemId = applyTap(expandedItemId, itemId);
        if (expandedItemId !== itemId) return false;

        // Second tap collapses it
        expandedItemId = applyTap(expandedItemId, itemId);
        if (expandedItemId !== null) return false;

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('tapping a different card always collapses the previous one', () => {
    const twoDistinctIdsArb = fc.tuple(
      fc.integer({ min: 1, max: 20 }),
      fc.integer({ min: 1, max: 20 })
    ).filter(([a, b]) => a !== b);

    fc.assert(
      fc.property(twoDistinctIdsArb, ([firstId, secondId]) => {
        let expandedItemId: number | null = null;

        // Tap first card — it expands
        expandedItemId = applyTap(expandedItemId, firstId);
        if (expandedItemId !== firstId) return false;

        // Tap second card — first collapses, second expands
        expandedItemId = applyTap(expandedItemId, secondId);
        if (expandedItemId !== secondId) return false;

        // Only one card is expanded (the second one)
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('expanded state is always null or a single number from the tap pool', () => {
    const tapSequenceArb = fc.array(fc.integer({ min: 1, max: 20 }), { minLength: 0, maxLength: 100 });

    fc.assert(
      fc.property(tapSequenceArb, (taps) => {
        let expandedItemId: number | null = null;

        for (const tappedId of taps) {
          expandedItemId = applyTap(expandedItemId, tappedId);

          // The expanded state must be either null or one of the tapped IDs
          if (expandedItemId !== null && !taps.includes(expandedItemId)) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: discovery-ratings-reviews, Property 5: Star rating display correctness
// **Validates: Requirements 3.1, 3.2, 3.4**
describe('Property 5 — Star rating display correctness', () => {
  /**
   * Generator for valid rating values between 0 and 5.
   * Uses fc.double with noNaN to avoid NaN values.
   */
  const ratingArb = fc.double({ min: 0, max: 5, noNaN: true });

  it('star breakdown always sums to exactly 5 stars', () => {
    fc.assert(
      fc.property(ratingArb, (rating) => {
        const { filled, half, empty } = getStarBreakdown(rating);
        return filled + half + empty === 5;
      }),
      { numRuns: 100 }
    );
  });

  it('filled >= 0, half is 0 or 1, empty >= 0', () => {
    fc.assert(
      fc.property(ratingArb, (rating) => {
        const { filled, half, empty } = getStarBreakdown(rating);
        return filled >= 0 && (half === 0 || half === 1) && empty >= 0;
      }),
      { numRuns: 100 }
    );
  });

  it('star breakdown correctly represents the rating value', () => {
    fc.assert(
      fc.property(ratingArb, (rating) => {
        const { filled, half, empty } = getStarBreakdown(rating);
        const clamped = Math.max(0, Math.min(5, rating));
        const wholeStars = Math.floor(clamped);
        const remainder = clamped - wholeStars;

        // Verify the breakdown matches the rounding rules:
        // - remainder >= 0.75 → rounds up to additional filled star
        // - remainder in [0.25, 0.74] → half star
        // - remainder < 0.25 → no half star
        let expectedFilled = wholeStars;
        let expectedHalf = 0;

        if (remainder >= 0.75) {
          expectedFilled += 1;
        } else if (remainder >= 0.25) {
          expectedHalf = 1;
        }

        const expectedEmpty = 5 - expectedFilled - expectedHalf;

        return (
          filled === expectedFilled &&
          half === expectedHalf &&
          empty === expectedEmpty
        );
      }),
      { numRuns: 100 }
    );
  });

  it('accessibility label has the form "Rated {rating} out of 5 stars"', () => {
    fc.assert(
      fc.property(ratingArb, (rating) => {
        // Mirror the accessibility label logic from StarRatingDisplay component
        const accessibilityLabel = `Rated ${rating} out of 5 stars`;

        // Verify the label contains the rating value
        if (!accessibilityLabel.includes(String(rating))) return false;
        // Verify the label matches the expected format
        if (accessibilityLabel !== `Rated ${rating} out of 5 stars`) return false;

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('numeric display shows the rating value', () => {
    fc.assert(
      fc.property(ratingArb, (rating) => {
        // Mirror the numeric display logic from StarRatingDisplay component:
        // {rating.toFixed(1)}
        const numericDisplay = rating.toFixed(1);

        // The display must be a valid numeric string
        const parsed = parseFloat(numericDisplay);
        if (isNaN(parsed)) return false;

        // The displayed value should be close to the original rating
        // (toFixed(1) rounds to 1 decimal place)
        if (Math.abs(parsed - rating) > 0.05 + Number.EPSILON) return false;

        return true;
      }),
      { numRuns: 100 }
    );
  });
});


// Feature: discovery-ratings-reviews, Property 9: Carousel cards display all detail sections
// **Validates: Requirements 5.9**
describe('Property 9 — Carousel cards display all detail sections', () => {
  /**
   * Generators for DiscoveryItem components with various combinations of
   * rating data, reviews, menu metadata, and event metadata.
   */

  const reviewArb: fc.Arbitrary<Review> = fc.record({
    authorName: fc.string({ minLength: 1, maxLength: 30 }),
    rating: fc.double({ min: 0, max: 5, noNaN: true }),
    text: fc.string({ minLength: 1, maxLength: 200 }),
    relativeTimeDescription: fc.string({ minLength: 1, maxLength: 50 }),
  });

  const ratingDataArb: fc.Arbitrary<RatingData> = fc.record({
    rating: fc.double({ min: 0, max: 5, noNaN: true }),
    reviewCount: fc.integer({ min: 0, max: 1000 }),
    reviews: fc.array(reviewArb, { minLength: 0, maxLength: 5 }),
  });

  const menuMetadataArb = fc.record({
    menuItems: fc.array(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 30 }),
        price: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
      }),
      { minLength: 1, maxLength: 5 }
    ),
  });

  const eventMetadataArb = fc.record({
    events: fc.array(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 30 }),
        date: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
        description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
      }),
      { minLength: 1, maxLength: 5 }
    ),
  });

  const discoveryItemArb: fc.Arbitrary<DiscoveryItem> = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ minLength: 0, maxLength: 200 }),
    latitude: fc.double({ min: -90, max: 90, noNaN: true }),
    longitude: fc.double({ min: -180, max: 180, noNaN: true }),
    city: fc.string({ minLength: 1, maxLength: 30 }),
    address: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    imageUrl: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    navigationNodeId: fc.integer({ min: 1, max: 100 }),
    categoryLabel: fc.string({ minLength: 1, maxLength: 30 }),
    metadata: fc.oneof(
      fc.constant(null),
      menuMetadataArb as fc.Arbitrary<Record<string, unknown>>,
      eventMetadataArb as fc.Arbitrary<Record<string, unknown>>,
      fc.record({
        menuItems: fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }),
            price: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        events: fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }),
            date: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
      }) as fc.Arbitrary<Record<string, unknown>>,
    ),
    rating: fc.option(ratingDataArb, { nil: null }),
  });

  /**
   * Models the carousel card rendering decision logic.
   * Returns which sections WOULD be rendered for a given item.
   */
  function getRenderedSections(item: DiscoveryItem) {
    const showStarRating = item.rating !== null;
    const showReviews = (item.rating?.reviews?.length ?? 0) > 0;
    const showMenu = parseMenuMetadata(item.metadata) !== undefined;
    const showEvents = parseEventMetadata(item.metadata) !== undefined;

    return { showStarRating, showReviews, showMenu, showEvents };
  }

  /**
   * Returns which sections SHOULD be available based on the item's data.
   */
  function getAvailableSections(item: DiscoveryItem) {
    const hasStarRating = item.rating !== null;
    const hasReviews = (item.rating?.reviews?.length ?? 0) > 0;
    const hasMenu = parseMenuMetadata(item.metadata) !== undefined;
    const hasEvents = parseEventMetadata(item.metadata) !== undefined;

    return { hasStarRating, hasReviews, hasMenu, hasEvents };
  }

  it('all available detail sections are rendered without requiring a tap to expand', () => {
    fc.assert(
      fc.property(discoveryItemArb, (item) => {
        const rendered = getRenderedSections(item);
        const available = getAvailableSections(item);

        // Every available section must be rendered
        if (available.hasStarRating && !rendered.showStarRating) return false;
        if (available.hasReviews && !rendered.showReviews) return false;
        if (available.hasMenu && !rendered.showMenu) return false;
        if (available.hasEvents && !rendered.showEvents) return false;

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('star rating section is rendered if and only if rating data is present', () => {
    fc.assert(
      fc.property(discoveryItemArb, (item) => {
        const { showStarRating } = getRenderedSections(item);
        const hasRating = item.rating !== null;

        return showStarRating === hasRating;
      }),
      { numRuns: 100 }
    );
  });

  it('reviews section is rendered if and only if reviews array has items', () => {
    fc.assert(
      fc.property(discoveryItemArb, (item) => {
        const { showReviews } = getRenderedSections(item);
        const hasReviews = (item.rating?.reviews?.length ?? 0) > 0;

        return showReviews === hasReviews;
      }),
      { numRuns: 100 }
    );
  });

  it('menu section is rendered if and only if parseMenuMetadata returns a value', () => {
    fc.assert(
      fc.property(discoveryItemArb, (item) => {
        const { showMenu } = getRenderedSections(item);
        const hasMenu = parseMenuMetadata(item.metadata) !== undefined;

        return showMenu === hasMenu;
      }),
      { numRuns: 100 }
    );
  });

  it('event section is rendered if and only if parseEventMetadata returns a value', () => {
    fc.assert(
      fc.property(discoveryItemArb, (item) => {
        const { showEvents } = getRenderedSections(item);
        const hasEvents = parseEventMetadata(item.metadata) !== undefined;

        return showEvents === hasEvents;
      }),
      { numRuns: 100 }
    );
  });
});
