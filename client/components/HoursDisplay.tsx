import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { FONT_SIZE, FONT_WEIGHT, SPACING } from '@/constants/colors';
import type { HoursData } from '@/services/discoveryApi';

interface HoursDisplayProps {
  hours: HoursData;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Displays weekly operating hours with the current day highlighted.
 */
export function HoursDisplay({ hours }: HoursDisplayProps) {
  const theme = useTheme();
  const currentDayName = DAY_NAMES[new Date().getDay()];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Hours</Text>
      {hours.weekdayHours.map((entry, index) => {
        const isToday = entry.day === currentDayName;
        return (
          <View key={index} style={styles.row}>
            <Text
              style={[
                styles.day,
                { color: isToday ? theme.primary : theme.textPrimary },
                isToday && styles.todayText,
              ]}
            >
              {entry.day}
            </Text>
            <Text
              style={[
                styles.hours,
                { color: isToday ? theme.primary : theme.textSecondary },
                isToday && styles.todayText,
              ]}
            >
              {entry.hours}
            </Text>
          </View>
        );
      })}
    </View>
  );
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  day: {
    fontSize: FONT_SIZE.sm,
    width: 100,
  },
  hours: {
    fontSize: FONT_SIZE.sm,
    flex: 1,
    textAlign: 'right',
  },
  todayText: {
    fontWeight: FONT_WEIGHT.semibold,
  },
});
