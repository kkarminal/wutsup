import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BRAND, FONT_SIZE, SPACING } from '@/constants/colors';

export interface BreadcrumbTrailProps {
  breadcrumb: string[];
  nodeIds: number[];
  onNavigateTo: (nodeId: number) => void;
}

/**
 * BreadcrumbTrail — horizontal scrollable trail of ancestor node labels.
 *
 * Renders one `Pressable` per breadcrumb item with a `>` separator between
 * items. Each item is accessible as a button with a descriptive label.
 *
 * Requirements: 5.2, 10.3
 */
export function BreadcrumbTrail({
  breadcrumb,
  nodeIds,
  onNavigateTo,
}: BreadcrumbTrailProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      style={styles.scrollView}
    >
      {breadcrumb.map((label, index) => (
        <View key={nodeIds[index]} style={styles.itemRow}>
          <Pressable
            onPress={() => onNavigateTo(nodeIds[index])}
            accessibilityRole="button"
            accessibilityLabel={`Navigate back to ${label}`}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <Text style={styles.itemText}>{label}</Text>
          </Pressable>

          {index < breadcrumb.length - 1 && (
            <Text style={styles.separator} accessibilityElementsHidden>
              {'>'}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  itemPressed: {
    opacity: 0.6,
  },
  itemText: {
    fontSize: FONT_SIZE.sm,
    color: BRAND.white,
    fontWeight: '500',
  },
  separator: {
    fontSize: FONT_SIZE.sm,
    color: BRAND.white,
    marginHorizontal: SPACING.xs,
    opacity: 0.6,
  },
});
