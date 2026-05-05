import { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { useDiscoveryFeed } from '@/hooks/useDiscoveryFeed';
import { DiscoveryCard } from '@/components/DiscoveryCard';
import { ThemedButton } from '@/components/ThemedButton';
import { SPACING, FONT_SIZE } from '@/constants/colors';
import type { DiscoveryItem } from '@/services/discoveryApi';

export interface ResultsFeedProps {
  activeNodeId: number | null;
  visible: boolean;
}

/**
 * ResultsFeed — renders a paginated, virtualized list of DiscoveryCard
 * components driven by the active navigation node.
 *
 * - Animated enter/exit via Reanimated FadeIn/FadeOut (300ms)
 * - Infinite scroll via onEndReached
 * - Loading indicators for initial fetch and page loads
 * - Empty state when no items found
 * - Retry button on page fetch failure
 * - Resets scroll position when activeNodeId changes
 */
export function ResultsFeed({ activeNodeId, visible }: ResultsFeedProps) {
  const theme = useTheme();
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

  // Reset scroll position when activeNodeId changes
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [activeNodeId]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      fetchNextPage();
    }
  }, [hasMore, loadingMore, loading, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: DiscoveryItem }) => <DiscoveryCard item={item} />,
    [],
  );

  const keyExtractor = useCallback(
    (item: DiscoveryItem) => item.id.toString(),
    [],
  );

  const renderFooter = useCallback(() => {
    if (loadingMore) {
      return (
        <View style={styles.footer}>
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
        <View style={styles.footer}>
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
  }, [loadingMore, error, items.length, retry, theme.primary]);

  if (!visible) {
    return null;
  }

  // Initial loading state
  if (loading) {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
        style={[styles.container, { backgroundColor: theme.background }]}
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
        style={[styles.container, { backgroundColor: theme.background }]}
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
        style={[styles.container, { backgroundColor: theme.background }]}
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
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Animated.View>
  );
}

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
  listContent: {
    paddingVertical: SPACING.sm,
  },
  footer: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
});
