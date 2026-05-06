import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { FONT_SIZE, FONT_WEIGHT, SPACING } from '@/constants/colors';
import type { BusyTimesData } from '@/services/discoveryApi';

interface BusyTimesChartProps {
  busyTimes: BusyTimesData;
}

/**
 * Renders a horizontal bar chart showing hourly popularity percentages.
 * Each bar's width represents the relative popularity for that hour.
 */
export function BusyTimesChart({ busyTimes }: BusyTimesChartProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Busy Times</Text>
      <View style={styles.chartContainer}>
        {busyTimes.hourlyPopularity.map((entry) => {
          const label = formatHourLabel(entry.hour);
          return (
            <View key={entry.hour} style={styles.barRow}>
              <Text style={[styles.hourLabel, { color: theme.textSecondary }]}>{label}</Text>
              <View style={[styles.barBackground, { backgroundColor: theme.surfaceRaised }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: theme.primary,
                      width: `${entry.popularityPercent}%`,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12a';
  if (hour < 12) return `${hour}a`;
  if (hour === 12) return '12p';
  return `${hour - 12}p`;
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.xs,
  },
  chartContainer: {
    gap: 2,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
  },
  hourLabel: {
    fontSize: FONT_SIZE.xs,
    width: 28,
    textAlign: 'right',
    marginRight: SPACING.xs,
  },
  barBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
