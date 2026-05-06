import { useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { useDiscoveryFeed } from '@/hooks/useDiscoveryFeed';
import { StarRatingDisplay } from '@/components/StarRatingDisplay';
import { ExpandedCardView } from '@/components/ExpandedCardView';
import { ThemedButton } from '@/components/ThemedButton';
import { parseMenuMetadata, parseEventMetadata } from '@/utils/metadataParsing';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants/colors';
import type { DiscoveryItem } from '@/services/discoveryApi';

export interface ResultsCarouselProps {
  activeNodeId: number | null;
  visible: boolean;
}

/**
 * ResultsCarousel — displays one full-detail discovery card at a time
 * with horizontal swipe navigation.
 *
 * - Uses FlatList with horizontal + pagingEnabled for swipe gestures
 * - Each card shows all detail sections (star rating, reviews, menu, events)
 *   without requiring a tap to expand
 * - Supports infinite scroll by loading next page when reaching the last item
 * - Animated enter/exit via Reanimated FadeIn/FadeOut (300ms)
 */
export function ResultsCarousel({ activeNodeId, visible }: ResultsCarouselProps) {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchNextPage,
    retry,
  } = useDiscoveryFeed(activeNodeId);

  const flatListRef = useRef<FlatList<DiscoveryItem>>(null);

  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      fetchNextPage();
    }
  }, [hasMore, loadingMore, loading, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: DiscoveryItem }) => (
      <CarouselCard item={item} cardWidth={windowWidth} />
    ),
    [windowWidth],
  );

  const keyExtractor = useCallback(
    (item: DiscoveryItem) => item.id.toString(),
    [],
  );

  const renderFooter = useCallback(() => {
    if (loadingMore) {
      return (
        <View style={[styles.footerContainer, { width: windowWidth }]}>
          <ActivityIndicator
            size="small"
            color={theme.primary}
            accessibilityLabel="Loading more items"
          />
        </View>
      );
    }

    if (error && items.length > 0) {
      return (
        <View style={[styles.footerContainer, { width: windowWidth }]}>
          <ThemedButton
            label="Retry"
            onPress={retry}
            variant="secondary"
            size="sm"
            iconLeft="refresh-outline"
          />
        </View>
      );
    }

    return null;
  }, [loadingMore, error, items.length, retry, theme.primary, windowWidth]);

  if (!visible) {
    return null;
  }

  // Initial loading state
  if (loading) {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
        style={[styles.container, { backgroundColor: 'transparent' }]}
      >
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={theme.primary}
            accessibilityLabel="Loading results"
          />
        </View>
      </Animated.View>
    );
  }

  // Error state on initial fetch (no items loaded yet)
  if (error && items.length === 0) {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
        style={[styles.container, { backgroundColor: 'transparent' }]}
      >
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            {error}
          </Text>
          <View style={styles.retryContainer}>
            <ThemedButton
              label="Retry"
              onPress={retry}
              variant="secondary"
              size="sm"
              iconLeft="refresh-outline"
            />
          </View>
        </View>
      </Animated.View>
    );
  }

  // Empty state
  if (items.length === 0 && !loading) {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
        style={[styles.container, { backgroundColor: 'transparent' }]}
      >
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No results found for this category
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[styles.container, { backgroundColor: 'transparent' }]}
    >
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        getItemLayout={(_data, index) => ({
          length: windowWidth,
          offset: windowWidth * index,
          index,
        })}
      />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// CarouselCard — full-detail card rendered at full window width
// ---------------------------------------------------------------------------

interface CarouselCardProps {
  item: DiscoveryItem;
  cardWidth: number;
}

/**
 * Maps a categoryLabel to an appropriate Ionicons icon name.
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

function CarouselCard({ item, cardWidth }: CarouselCardProps) {
  const theme = useTheme();
  const menuMetadata = parseMenuMetadata(item.metadata);
  const eventMetadata = parseEventMetadata(item.metadata);

  return (
    <View style={[styles.cardWrapper, { width: cardWidth }]}>
      <View
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        {/* Image or placeholder */}
        <View style={styles.imageSection}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.cardImage}
              accessibilityLabel={`Image of ${item.name}`}
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: theme.surfaceRaised }]}>
              <Ionicons
                name={getCategoryIcon(item.categoryLabel)}
                size={48}
                color={theme.textSecondary}
              />
            </View>
          )}
        </View>

        {/* Scrollable content area */}
        <View style={styles.contentSection}>
          {/* Name */}
          <Text style={[styles.cardName, { color: theme.textPrimary }]} numberOfLines={2}>
            {item.name}
          </Text>

          {/* Description */}
          <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
            {item.description}
          </Text>

          {/* Star Rating — always shown when available */}
          {item.rating && (
            <View style={styles.ratingSection}>
              <StarRatingDisplay
                rating={item.rating.rating}
                reviewCount={item.rating.reviewCount}
              />
            </View>
          )}

          {/* Location and category */}
          <View style={styles.metaRow}>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.cityText, { color: theme.textSecondary }]} numberOfLines={1}>
                {item.city}
              </Text>
            </View>
            <View style={[styles.categoryBadge, { backgroundColor: theme.primarySubtle }]}>
              <Text style={[styles.categoryBadgeText, { color: theme.primary }]} numberOfLines={1}>
                {item.categoryLabel}
              </Text>
            </View>
          </View>

          {/* All detail sections — always visible without tap to expand */}
          <ExpandedCardView
            reviews={item.rating?.reviews ?? []}
            menuMetadata={menuMetadata}
            eventMetadata={eventMetadata}
          />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  retryContainer: {
    marginTop: SPACING.md,
  },
  footerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  cardWrapper: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  card: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageSection: {
    height: 180,
    width: '100%',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSection: {
    flex: 1,
    padding: SPACING.md,
  },
  cardName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.semibold,
  },
  cardDescription: {
    fontSize: FONT_SIZE.md,
    marginTop: SPACING.xs,
  },
  ratingSection: {
    marginTop: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cityText: {
    fontSize: FONT_SIZE.sm,
    marginLeft: SPACING.xs,
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
});
