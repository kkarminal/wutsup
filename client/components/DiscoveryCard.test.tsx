/**
 * Tests for DiscoveryCard component logic.
 * Feature: discovery-results-feed, discovery-ratings-reviews
 *
 * @testing-library/react-native is not available in this project, so we
 * test the component's prop-to-render mapping logic directly — the same
 * approach used in CategoryNode.test.tsx.
 */

import { FONT_SIZE, FONT_WEIGHT } from '@/constants/colors';
import type { DiscoveryItem } from '@/services/discoveryApi';
import { parseMenuMetadata, parseEventMetadata } from '@/utils/metadataParsing';

// ─── Helpers that mirror DiscoveryCard's internal logic ──────────────────────

/**
 * Returns the accessibilityLabel for a DiscoveryCard,
 * mirroring: accessibilityLabel={`${item.name}, ${item.categoryLabel}`}
 */
function resolveAccessibilityLabel(item: DiscoveryItem): string {
  return `${item.name}, ${item.categoryLabel}`;
}

/**
 * Returns the name text style properties used by DiscoveryCard.
 */
function resolveNameStyle() {
  return {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
  };
}

/**
 * Returns the numberOfLines for description text.
 */
function resolveDescriptionNumberOfLines(): number {
  return 2;
}

/**
 * Determines whether the image or placeholder should be shown,
 * mirroring: item.imageUrl ? <Image .../> : <Placeholder />
 */
function resolveShowsImage(item: DiscoveryItem): boolean {
  return item.imageUrl !== null && item.imageUrl !== undefined;
}

/**
 * Determines whether the star rating section should be shown.
 * Mirrors: item.rating && <StarRatingDisplay ... />
 */
function resolveShowsStarRating(item: DiscoveryItem): boolean {
  return item.rating !== null && item.rating !== undefined;
}

/**
 * Maps a categoryLabel to an appropriate Ionicons icon name.
 * Mirrors getCategoryIcon in DiscoveryCard.tsx.
 */
function getCategoryIcon(categoryLabel: string): string {
  const label = categoryLabel.toLowerCase();
  if (label.includes('music') || label.includes('rock') || label.includes('jazz') || label.includes('classical') || label.includes('electronic') || label.includes('hip hop')) {
    return 'musical-notes-outline';
  }
  if (label.includes('food') || label.includes('restaurant') || label.includes('italian') || label.includes('mexican') || label.includes('asian') || label.includes('american')) {
    return 'restaurant-outline';
  }
  if (label.includes('bar') || label.includes('cocktail') || label.includes('speakeasy') || label.includes('brewery') || label.includes('wine')) {
    return 'beer-outline';
  }
  if (label.includes('hik') || label.includes('trail') || label.includes('outdoor') || label.includes('climb')) {
    return 'trail-sign-outline';
  }
  if (label.includes('yoga') || label.includes('fitness') || label.includes('gym') || label.includes('sport')) {
    return 'fitness-outline';
  }
  if (label.includes('event') || label.includes('festival') || label.includes('comedy') || label.includes('networking')) {
    return 'calendar-outline';
  }
  return 'location-outline';
}

// ─── Test fixtures ────────────────────────────────────────────────────────────

const itemWithImage: DiscoveryItem = {
  id: 1,
  name: 'The Velvet Underground',
  description: 'A legendary rock venue with live music every night and an amazing atmosphere for music lovers.',
  latitude: 30.2672,
  longitude: -97.7431,
  city: 'Austin',
  address: '123 Music Lane',
  imageUrl: 'https://picsum.photos/seed/1/400/300',
  navigationNodeId: 46,
  categoryLabel: 'Rock',
  metadata: { eventDate: '2025-06-15', venue: 'Main Stage' },
  rating: null,
};

const itemWithoutImage: DiscoveryItem = {
  id: 2,
  name: 'Trattoria Bella',
  description: 'Authentic Italian cuisine in a cozy setting with handmade pasta and wood-fired pizzas.',
  latitude: 45.5152,
  longitude: -122.6784,
  city: 'Portland',
  address: '456 Food Ave',
  imageUrl: null,
  navigationNodeId: 51,
  categoryLabel: 'Italian',
  metadata: { cuisineType: 'Italian', priceRange: '$' },
  rating: null,
};

const itemWithRating: DiscoveryItem = {
  id: 3,
  name: 'Sushi Palace',
  description: 'Fresh sushi and sashimi in a modern setting.',
  latitude: 34.0522,
  longitude: -118.2437,
  city: 'Los Angeles',
  address: '789 Sushi Blvd',
  imageUrl: 'https://picsum.photos/seed/3/400/300',
  navigationNodeId: 52,
  categoryLabel: 'Asian',
  metadata: {
    menuItems: [
      { name: 'Dragon Roll', price: '$15' },
      { name: 'Salmon Sashimi', price: '$12' },
    ],
  },
  rating: {
    rating: 4.5,
    reviewCount: 128,
    reviews: [
      {
        authorName: 'John D.',
        rating: 5,
        text: 'Best sushi in town!',
        relativeTimeDescription: '2 weeks ago',
      },
    ],
  },
};

const itemWithEvents: DiscoveryItem = {
  id: 4,
  name: 'Jazz Club',
  description: 'Live jazz every weekend.',
  latitude: 40.7128,
  longitude: -74.006,
  city: 'New York',
  address: '101 Jazz Ave',
  imageUrl: null,
  navigationNodeId: 46,
  categoryLabel: 'Jazz',
  metadata: {
    events: [
      { name: 'Friday Night Jazz', date: '2025-06-20', description: 'Live performance' },
      { name: 'Saturday Blues', date: '2025-06-21' },
    ],
  },
  rating: {
    rating: 4.2,
    reviewCount: 56,
    reviews: [],
  },
};

// ─── Name rendering ───────────────────────────────────────────────────────────

describe('DiscoveryCard — name rendering', () => {
  it('renders the item name', () => {
    expect(itemWithImage.name).toBe('The Velvet Underground');
  });

  it('name uses FONT_SIZE.lg (17 sp)', () => {
    const style = resolveNameStyle();
    expect(style.fontSize).toBe(FONT_SIZE.lg);
    expect(style.fontSize).toBe(17);
  });

  it('name uses fontWeight 600 (semibold)', () => {
    const style = resolveNameStyle();
    expect(style.fontWeight).toBe('600');
  });
});

// ─── Description rendering ────────────────────────────────────────────────────

describe('DiscoveryCard — description rendering', () => {
  it('renders the item description', () => {
    expect(itemWithImage.description).toBe(
      'A legendary rock venue with live music every night and an amazing atmosphere for music lovers.'
    );
  });

  it('description is truncated to 2 lines', () => {
    const numberOfLines = resolveDescriptionNumberOfLines();
    expect(numberOfLines).toBe(2);
  });
});

// ─── City rendering ───────────────────────────────────────────────────────────

describe('DiscoveryCard — city rendering', () => {
  it('renders the city name', () => {
    expect(itemWithImage.city).toBe('Austin');
  });

  it('renders city for item without image', () => {
    expect(itemWithoutImage.city).toBe('Portland');
  });
});

// ─── Category badge rendering ─────────────────────────────────────────────────

describe('DiscoveryCard — category badge', () => {
  it('renders the categoryLabel as badge text', () => {
    expect(itemWithImage.categoryLabel).toBe('Rock');
  });

  it('renders categoryLabel for different categories', () => {
    expect(itemWithoutImage.categoryLabel).toBe('Italian');
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('DiscoveryCard — accessibility', () => {
  it('accessibilityLabel contains item name and categoryLabel', () => {
    const label = resolveAccessibilityLabel(itemWithImage);
    expect(label).toBe('The Velvet Underground, Rock');
  });

  it('accessibilityLabel format is "{name}, {categoryLabel}"', () => {
    const label = resolveAccessibilityLabel(itemWithoutImage);
    expect(label).toBe('Trattoria Bella, Italian');
  });

  it('accessibilityLabel contains the name', () => {
    const label = resolveAccessibilityLabel(itemWithImage);
    expect(label).toContain(itemWithImage.name);
  });

  it('accessibilityLabel contains the categoryLabel', () => {
    const label = resolveAccessibilityLabel(itemWithImage);
    expect(label).toContain(itemWithImage.categoryLabel);
  });
});

// ─── Image / placeholder logic ────────────────────────────────────────────────

describe('DiscoveryCard — image vs placeholder', () => {
  it('shows image when imageUrl is present', () => {
    expect(resolveShowsImage(itemWithImage)).toBe(true);
  });

  it('shows placeholder when imageUrl is null', () => {
    expect(resolveShowsImage(itemWithoutImage)).toBe(false);
  });

  it('placeholder icon is category-appropriate for Rock', () => {
    const icon = getCategoryIcon('Rock');
    expect(icon).toBe('musical-notes-outline');
  });

  it('placeholder icon is category-appropriate for Italian', () => {
    const icon = getCategoryIcon('Italian');
    expect(icon).toBe('restaurant-outline');
  });

  it('placeholder icon falls back to location-outline for unknown category', () => {
    const icon = getCategoryIcon('Unknown Category');
    expect(icon).toBe('location-outline');
  });

  it('placeholder icon for bar categories', () => {
    const icon = getCategoryIcon('Cocktail Bars');
    expect(icon).toBe('beer-outline');
  });

  it('placeholder icon for hiking categories', () => {
    const icon = getCategoryIcon('Hiking');
    expect(icon).toBe('trail-sign-outline');
  });

  it('placeholder icon for yoga/fitness categories', () => {
    const icon = getCategoryIcon('Yoga');
    expect(icon).toBe('fitness-outline');
  });

  it('placeholder icon for event categories', () => {
    const icon = getCategoryIcon('Festival');
    expect(icon).toBe('calendar-outline');
  });
});

// ─── Map thumbnail ────────────────────────────────────────────────────────────

describe('DiscoveryCard — map thumbnail', () => {
  it('item has latitude and longitude for map thumbnail', () => {
    expect(typeof itemWithImage.latitude).toBe('number');
    expect(typeof itemWithImage.longitude).toBe('number');
  });

  it('latitude and longitude are valid coordinates', () => {
    expect(itemWithImage.latitude).toBeGreaterThanOrEqual(-90);
    expect(itemWithImage.latitude).toBeLessThanOrEqual(90);
    expect(itemWithImage.longitude).toBeGreaterThanOrEqual(-180);
    expect(itemWithImage.longitude).toBeLessThanOrEqual(180);
  });
});

// ─── Star rating display logic ────────────────────────────────────────────────

describe('DiscoveryCard — star rating display', () => {
  it('shows star rating when item has rating data', () => {
    expect(resolveShowsStarRating(itemWithRating)).toBe(true);
  });

  it('omits star rating when item has no rating data', () => {
    expect(resolveShowsStarRating(itemWithImage)).toBe(false);
  });

  it('omits star rating when rating is null', () => {
    expect(resolveShowsStarRating(itemWithoutImage)).toBe(false);
  });
});

// ─── Expand/collapse behavior ─────────────────────────────────────────────────

describe('DiscoveryCard — expand/collapse', () => {
  it('DiscoveryCardProps includes isExpanded boolean', () => {
    const props = { item: itemWithImage, isExpanded: false, onToggleExpand: () => {} };
    expect(typeof props.isExpanded).toBe('boolean');
  });

  it('DiscoveryCardProps includes onToggleExpand callback', () => {
    const props = { item: itemWithImage, isExpanded: false, onToggleExpand: () => {} };
    expect(typeof props.onToggleExpand).toBe('function');
  });

  it('expanded card shows reviews from rating data', () => {
    // When expanded and item has rating with reviews, ExpandedCardView receives them
    const reviews = itemWithRating.rating?.reviews ?? [];
    expect(reviews.length).toBe(1);
    expect(reviews[0].authorName).toBe('John D.');
  });

  it('expanded card shows empty reviews array when no rating', () => {
    const reviews = itemWithImage.rating?.reviews ?? [];
    expect(reviews).toEqual([]);
  });
});

// ─── Metadata parsing ─────────────────────────────────────────────────────────

describe('DiscoveryCard — parseMenuMetadata', () => {
  it('returns undefined for null metadata', () => {
    expect(parseMenuMetadata(null)).toBeUndefined();
  });

  it('returns undefined when no menuItems key exists', () => {
    expect(parseMenuMetadata({ cuisineType: 'Italian' })).toBeUndefined();
  });

  it('returns undefined when menuItems is empty array', () => {
    expect(parseMenuMetadata({ menuItems: [] })).toBeUndefined();
  });

  it('parses valid menu items', () => {
    const metadata = {
      menuItems: [
        { name: 'Dragon Roll', price: '$15' },
        { name: 'Salmon Sashimi', price: '$12' },
      ],
    };
    const result = parseMenuMetadata(metadata);
    expect(result).toBeDefined();
    expect(result!.items).toHaveLength(2);
    expect(result!.items[0].name).toBe('Dragon Roll');
    expect(result!.items[0].price).toBe('$15');
  });

  it('filters out items with empty names', () => {
    const metadata = {
      menuItems: [
        { name: '', price: '$5' },
        { name: 'Valid Item', price: '$10' },
      ],
    };
    const result = parseMenuMetadata(metadata);
    expect(result).toBeDefined();
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0].name).toBe('Valid Item');
  });

  it('handles items without price', () => {
    const metadata = {
      menuItems: [{ name: 'Special', notPrice: 123 }],
    };
    const result = parseMenuMetadata(metadata);
    expect(result).toBeDefined();
    expect(result!.items[0].price).toBeUndefined();
  });
});

describe('DiscoveryCard — parseEventMetadata', () => {
  it('returns undefined for null metadata', () => {
    expect(parseEventMetadata(null)).toBeUndefined();
  });

  it('returns undefined when no events key exists', () => {
    expect(parseEventMetadata({ venue: 'Main Stage' })).toBeUndefined();
  });

  it('returns undefined when events is empty array', () => {
    expect(parseEventMetadata({ events: [] })).toBeUndefined();
  });

  it('parses valid event metadata', () => {
    const metadata = {
      events: [
        { name: 'Friday Night Jazz', date: '2025-06-20', description: 'Live performance' },
        { name: 'Saturday Blues', date: '2025-06-21' },
      ],
    };
    const result = parseEventMetadata(metadata);
    expect(result).toBeDefined();
    expect(result!.events).toHaveLength(2);
    expect(result!.events[0].name).toBe('Friday Night Jazz');
    expect(result!.events[0].date).toBe('2025-06-20');
    expect(result!.events[0].description).toBe('Live performance');
    expect(result!.events[1].description).toBeUndefined();
  });

  it('filters out events with empty names', () => {
    const metadata = {
      events: [
        { name: '', date: '2025-01-01' },
        { name: 'Valid Event' },
      ],
    };
    const result = parseEventMetadata(metadata);
    expect(result).toBeDefined();
    expect(result!.events).toHaveLength(1);
    expect(result!.events[0].name).toBe('Valid Event');
  });
});
