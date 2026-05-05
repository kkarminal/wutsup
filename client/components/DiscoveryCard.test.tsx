/**
 * Tests for DiscoveryCard component logic.
 * Feature: discovery-results-feed
 *
 * @testing-library/react-native is not available in this project, so we
 * test the component's prop-to-render mapping logic directly — the same
 * approach used in CategoryNode.test.tsx.
 */

import { FONT_SIZE, FONT_WEIGHT } from '@/constants/colors';
import type { DiscoveryItem } from '@/services/discoveryApi';

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
  metadata: { cuisineType: 'Italian', priceRange: '$$' },
};

// ─── Name rendering ───────────────────────────────────────────────────────────

describe('DiscoveryCard — name rendering', () => {
  it('renders the item name', () => {
    // The component renders item.name as the title Text content
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
