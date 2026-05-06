import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { FONT_SIZE, FONT_WEIGHT, SPACING } from '@/constants/colors';
import { getStarBreakdown } from '@/utils/starRating';

export { getStarBreakdown } from '@/utils/starRating';

const STAR_COLOR = '#FFB800';
const STAR_SIZE = 16;

export interface StarRatingDisplayProps {
  rating: number;       // 0–5 scale
  reviewCount?: number; // optional review count to display
}

/**
 * StarRatingDisplay — renders a 0–5 star rating using Ionicons.
 *
 * Displays filled, half-filled, and empty star icons based on the rating value,
 * along with the numeric rating text. Optionally shows the review count.
 */
export function StarRatingDisplay({ rating, reviewCount }: StarRatingDisplayProps) {
  const theme = useTheme();
  const { filled, half, empty } = getStarBreakdown(rating);

  const stars: React.ReactNode[] = [];

  for (let i = 0; i < filled; i++) {
    stars.push(
      <Ionicons key={`filled-${i}`} name="star" size={STAR_SIZE} color={STAR_COLOR} />
    );
  }

  for (let i = 0; i < half; i++) {
    stars.push(
      <Ionicons key={`half-${i}`} name="star-half" size={STAR_SIZE} color={STAR_COLOR} />
    );
  }

  for (let i = 0; i < empty; i++) {
    stars.push(
      <Ionicons key={`empty-${i}`} name="star-outline" size={STAR_SIZE} color={STAR_COLOR} />
    );
  }

  const accessibilityLabel = `Rated ${rating} out of 5 stars`;

  return (
    <View style={styles.container} accessibilityLabel={accessibilityLabel}>
      <View style={styles.starsRow}>
        {stars}
      </View>
      <Text style={[styles.ratingText, { color: theme.textPrimary }]}>
        {rating.toFixed(1)}
      </Text>
      {reviewCount !== undefined && (
        <Text style={[styles.reviewCount, { color: theme.textSecondary }]}>
          ({reviewCount})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    marginLeft: SPACING.xs,
  },
  reviewCount: {
    fontSize: FONT_SIZE.xs,
    marginLeft: SPACING.xs,
  },
});
