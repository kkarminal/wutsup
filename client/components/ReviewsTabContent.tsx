import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { FONT_SIZE, FONT_WEIGHT, SPACING } from '@/constants/colors';
import { StarRatingDisplay } from '@/components/StarRatingDisplay';
import type { RatingData } from '@/services/discoveryApi';

interface ReviewsTabContentProps {
  rating: RatingData | null;
}

/**
 * Content panel for the "Reviews" tab in the expanded card detail view.
 * Displays overall rating, review count, and up to 5 individual reviews.
 */
export function ReviewsTabContent({ rating }: ReviewsTabContentProps) {
  const theme = useTheme();

  if (!rating) {
    return (
      <View style={styles.container}>
        <Text style={[styles.noReviews, { color: theme.textSecondary }]}>
          No reviews available
        </Text>
      </View>
    );
  }

  const reviews = rating.reviews.slice(0, 5);

  return (
    <View style={styles.container}>
      {/* Overall rating header */}
      <View style={styles.header}>
        <StarRatingDisplay rating={rating.rating} reviewCount={rating.reviewCount} />
      </View>

      {/* Individual reviews */}
      {reviews.map((review, index) => (
        <View
          key={index}
          style={[styles.reviewCard, { borderBottomColor: theme.border }]}
        >
          <View style={styles.reviewHeader}>
            <Ionicons name="person-circle-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.authorName, { color: theme.textPrimary }]}>
              {review.authorName}
            </Text>
            <Text style={[styles.relativeTime, { color: theme.textSecondary }]}>
              {review.relativeTimeDescription}
            </Text>
          </View>
          <StarRatingDisplay rating={review.rating} />
          <Text style={[styles.reviewText, { color: theme.textPrimary }]}>
            {review.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  header: {
    marginBottom: SPACING.xs,
  },
  noReviews: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  reviewCard: {
    gap: SPACING.xs,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  authorName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    flex: 1,
  },
  relativeTime: {
    fontSize: FONT_SIZE.xs,
  },
  reviewText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
});
