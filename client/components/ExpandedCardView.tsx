import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { SPACING } from '@/constants/colors';
import { DetailTabBar } from '@/components/DetailTabBar';
import { InfoTabContent } from '@/components/InfoTabContent';
import { ReviewsTabContent } from '@/components/ReviewsTabContent';
import { LocationTabContent } from '@/components/LocationTabContent';
import { parseMenuMetadata, parseEventMetadata } from '@/utils/metadataParsing';
import type { DiscoveryItem } from '@/services/discoveryApi';

export interface ExpandedCardViewProps {
  item: DiscoveryItem;
}

const TABS = ['Info', 'Reviews', 'Location'] as const;
type TabName = (typeof TABS)[number];

/**
 * ExpandedCardView — renders the detail section when a discovery card is expanded.
 *
 * Displays a tabbed interface with Info, Reviews, and Location tabs.
 * Uses a fade transition (200ms) when switching between tabs.
 */
export function ExpandedCardView({ item }: ExpandedCardViewProps) {
  const [activeTab, setActiveTab] = useState<TabName>('Info');
  const contentOpacity = useSharedValue(1);

  const handleTabChange = useCallback(
    (tab: string) => {
      if (tab === activeTab) return;

      contentOpacity.value = withTiming(0, { duration: 100 }, (finished) => {
        if (finished) {
          runOnJS(setActiveTab)(tab as TabName);
          contentOpacity.value = withTiming(1, { duration: 100 });
        }
      });
    },
    [activeTab, contentOpacity],
  );

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const menuMetadata = parseMenuMetadata(item.metadata);
  const eventMetadata = parseEventMetadata(item.metadata);

  return (
    <View style={styles.container}>
      <DetailTabBar
        tabs={[...TABS]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <Animated.View style={animatedContentStyle}>
        {activeTab === 'Info' && (
          <InfoTabContent
            description={item.description}
            address={item.address}
            categoryLabel={item.categoryLabel}
            menuMetadata={menuMetadata}
            eventMetadata={eventMetadata}
          />
        )}
        {activeTab === 'Reviews' && (
          <ReviewsTabContent rating={item.rating} />
        )}
        {activeTab === 'Location' && (
          <LocationTabContent
            latitude={item.latitude}
            longitude={item.longitude}
            address={item.address}
            city={item.city}
            hours={item.hours}
            busyTimes={item.busyTimes}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.sm,
  },
});
