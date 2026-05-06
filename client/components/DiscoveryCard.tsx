import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants/colors';
import { StarRatingDisplay } from '@/components/StarRatingDisplay';
import { ExpandedCardView } from '@/components/ExpandedCardView';
import type { DiscoveryItem } from '@/services/discoveryApi';

export { parseMenuMetadata, parseEventMetadata } from '@/utils/metadataParsing';

export interface DiscoveryCardProps {
  item: DiscoveryItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

/**
 * Maps a categoryLabel to an appropriate Ionicons icon name.
 * Falls back to a generic location icon for unknown categories.
 */
function getCategoryIcon(categoryLabel: string): React.ComponentProps<typeof Ionicons>['name'] {
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

const ANIMATION_DURATION = 300;

/**
 * DiscoveryCard — renders a single discovery item as a card.
 *
 * Displays the item name, description (truncated to 2 lines), a map
 * thumbnail placeholder with city name, a category badge, star rating
 * (when available), and either the item image or a category-appropriate
 * placeholder icon.
 *
 * Supports expand/collapse with animated transitions over 300ms.
 * When expanded, renders the ExpandedCardView with reviews, menu, and event data.
 */
export function DiscoveryCard({ item, isExpanded, onToggleExpand }: DiscoveryCardProps) {
  const theme = useTheme();

  // Animation values for expand/collapse
  const expandProgress = useSharedValue(isExpanded ? 1 : 0);

  useEffect(() => {
    expandProgress.value = withTiming(isExpanded ? 1 : 0, {
      duration: ANIMATION_DURATION,
    });
  }, [isExpanded, expandProgress]);

  const expandedStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    maxHeight: expandProgress.value * 1000,
  }));

  return (
    <Pressable
      onPress={onToggleExpand}
      accessibilityLabel={`${item.name}, ${item.categoryLabel}`}
      accessibilityRole="button"
      accessibilityState={{ expanded: isExpanded }}
    >
      <View
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        {/* Image or placeholder */}
        <View style={styles.topRow}>
          <View style={styles.imageContainer}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.image}
                accessibilityLabel={`Image of ${item.name}`}
              />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: theme.surfaceRaised }]}>
                <Ionicons
                  name={getCategoryIcon(item.categoryLabel)}
                  size={32}
                  color={theme.textSecondary}
                />
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Name */}
            <Text
              style={[styles.name, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>

            {/* Description */}
            <Text
              style={[styles.description, { color: theme.textSecondary }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>

            {/* Star Rating — shown when rating data is available */}
            {item.rating && (
              <View style={styles.ratingContainer}>
                <StarRatingDisplay rating={item.rating.rating} reviewCount={item.rating.reviewCount} />
              </View>
            )}

            {/* Bottom row: map thumbnail + city and category badge */}
            <View style={styles.bottomRow}>
              {/* Map thumbnail placeholder + city */}
              <View style={styles.locationContainer}>
                <View style={[styles.mapThumbnail, { backgroundColor: theme.surfaceRaised }]}>
                  <Ionicons name="map-outline" size={16} color={theme.textSecondary} />
                </View>
                <Text style={[styles.city, { color: theme.textSecondary }]} numberOfLines={1}>
                  {item.city}
                </Text>
              </View>

              {/* Category badge */}
              <View style={[styles.categoryBadge, { backgroundColor: theme.primarySubtle }]}>
                <Text style={[styles.categoryBadgeText, { color: theme.primary }]} numberOfLines={1}>
                  {item.categoryLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Expanded content with animation */}
        {isExpanded && (
          <Animated.View style={[styles.expandedContainer, expandedStyle]}>
            <ExpandedCardView item={item} />
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
  },
  topRow: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    marginRight: SPACING.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  ratingContainer: {
    marginTop: SPACING.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mapThumbnail: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  city: {
    fontSize: FONT_SIZE.xs,
    flexShrink: 1,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginLeft: SPACING.xs,
  },
  categoryBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  expandedContainer: {
    overflow: 'hidden',
  },
});
