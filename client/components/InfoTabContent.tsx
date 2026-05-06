import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '@/constants/colors';
import type { MenuInfo, EventInfo } from '@/utils/metadataParsing';

interface InfoTabContentProps {
  description: string;
  address: string | null;
  categoryLabel: string;
  menuMetadata?: MenuInfo;
  eventMetadata?: EventInfo;
}

/**
 * Content panel for the "Info" tab in the expanded card detail view.
 * Displays the full description, address, category badge, menu items,
 * and event details.
 */
export function InfoTabContent({
  description,
  address,
  categoryLabel,
  menuMetadata,
  eventMetadata,
}: InfoTabContentProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* Category badge */}
      <View style={[styles.badge, { backgroundColor: theme.primarySubtle }]}>
        <Text style={[styles.badgeText, { color: theme.primary }]}>{categoryLabel}</Text>
      </View>

      {/* Full description */}
      <Text style={[styles.description, { color: theme.textPrimary }]}>{description}</Text>

      {/* Address */}
      {address && (
        <Text style={[styles.address, { color: theme.textSecondary }]}>{address}</Text>
      )}

      {/* Menu items */}
      {menuMetadata && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Menu</Text>
          {menuMetadata.items.map((item, index) => (
            <View key={index} style={styles.menuItem}>
              <Text style={[styles.menuName, { color: theme.textPrimary }]}>{item.name}</Text>
              {item.price && (
                <Text style={[styles.menuPrice, { color: theme.textSecondary }]}>
                  {item.price}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Event details */}
      {eventMetadata && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Events</Text>
          {eventMetadata.events.map((event, index) => (
            <View key={index} style={styles.eventItem}>
              <Text style={[styles.eventName, { color: theme.textPrimary }]}>{event.name}</Text>
              {event.date && (
                <Text style={[styles.eventDate, { color: theme.textSecondary }]}>
                  {event.date}
                </Text>
              )}
              {event.description && (
                <Text style={[styles.eventDescription, { color: theme.textSecondary }]}>
                  {event.description}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
  description: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },
  address: {
    fontSize: FONT_SIZE.sm,
  },
  section: {
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.xs,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  menuName: {
    fontSize: FONT_SIZE.sm,
    flex: 1,
  },
  menuPrice: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  eventItem: {
    paddingVertical: SPACING.xs,
    gap: 2,
  },
  eventName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  eventDate: {
    fontSize: FONT_SIZE.xs,
  },
  eventDescription: {
    fontSize: FONT_SIZE.sm,
  },
});
